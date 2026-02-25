/**
 * BrailleCRDT - Conflict-Free Replicated Data Types on ℤ₂⁸
 * 
 * CRDT primitives where every atomic value is a braille byte (0–255).
 * Designed for parallel multi-teacher distillation: many frontier models
 * can independently produce distillation artifacts that merge without
 * conflicts or coordination.
 * 
 * Implemented CRDTs:
 * 
 *   1. ORSet (Observed-Remove Set)
 *      - For facts, constraints, rules extracted from teachers
 *      - add(item) / remove(item) / merge(other)
 *      - Commutative, idempotent merge
 *      - Items are braille byte sequences (Uint8Array)
 * 
 *   2. LWWRegister (Last-Writer-Wins Register)
 *      - For "best current answer" fields with scoring
 *      - set(value, score, timestamp) / merge(other)
 *      - Higher score wins ties; higher timestamp breaks score ties
 * 
 *   3. RGASequence (Replicated Growable Array)
 *      - For reasoning traces, program-like outputs
 *      - insert(index, byte) / remove(index) / merge(other)
 *      - Preserves intent of concurrent edits
 * 
 *   4. MerkleChunkedLog
 *      - For scalable syncing and content-addressed dedup
 *      - append(chunk) / merge(other) / getChunk(hash)
 *      - Content-addressed by hash of braille byte chunks
 * 
 * All values are ℤ₂⁸ byte sequences. No strings, no English internally.
 */

class ORSet {
    /**
     * Observed-Remove Set for braille byte sequences.
     * Each element is tagged with a unique add-id; removes track which
     * add-ids have been removed. This allows concurrent add+remove to
     * resolve correctly (add wins if the remove didn't observe that add).
     * 
     * @param {string} replicaId - Unique identifier for this replica
     */
    constructor(replicaId = 'r_' + Math.random().toString(36).slice(2, 8)) {
        this.replicaId = replicaId;
        this.counter = 0;

        // Map: itemHash → Set of { tag, value }
        // Each add creates a unique tag = replicaId:counter
        this.elements = new Map();

        // Set of removed tags
        this.tombstones = new Set();
    }

    /**
     * Add a braille byte sequence to the set.
     * @param {Uint8Array|Array<number>} item - Braille bytes
     * @returns {string} - The unique tag for this addition
     */
    add(item) {
        const bytes = item instanceof Uint8Array ? item : new Uint8Array(item);
        const tag = `${this.replicaId}:${++this.counter}`;
        const hash = ORSet._hashBytes(bytes);

        if (!this.elements.has(hash)) {
            this.elements.set(hash, new Set());
        }
        this.elements.get(hash).add(JSON.stringify({ tag, value: Array.from(bytes) }));

        return tag;
    }

    /**
     * Remove all observed instances of an item.
     * @param {Uint8Array|Array<number>} item
     */
    remove(item) {
        const bytes = item instanceof Uint8Array ? item : new Uint8Array(item);
        const hash = ORSet._hashBytes(bytes);
        const entries = this.elements.get(hash);
        if (!entries) return;

        for (const entry of entries) {
            const { tag } = JSON.parse(entry);
            this.tombstones.add(tag);
        }
        this.elements.delete(hash);
    }

    /**
     * Check if an item is in the set.
     * @param {Uint8Array|Array<number>} item
     * @returns {boolean}
     */
    has(item) {
        const bytes = item instanceof Uint8Array ? item : new Uint8Array(item);
        const hash = ORSet._hashBytes(bytes);
        const entries = this.elements.get(hash);
        if (!entries) return false;

        for (const entry of entries) {
            const { tag } = JSON.parse(entry);
            if (!this.tombstones.has(tag)) return true;
        }
        return false;
    }

    /**
     * Get all live items in the set.
     * @returns {Array<Uint8Array>}
     */
    values() {
        const result = [];
        const seen = new Set();

        for (const [hash, entries] of this.elements) {
            for (const entry of entries) {
                const { tag, value } = JSON.parse(entry);
                if (!this.tombstones.has(tag) && !seen.has(hash)) {
                    result.push(new Uint8Array(value));
                    seen.add(hash);
                }
            }
        }

        return result;
    }

    /**
     * Number of distinct live items.
     * @returns {number}
     */
    get size() {
        return this.values().length;
    }

    /**
     * Merge another ORSet into this one. Commutative + idempotent.
     * @param {ORSet} other
     */
    merge(other) {
        // Union of elements
        for (const [hash, entries] of other.elements) {
            if (!this.elements.has(hash)) {
                this.elements.set(hash, new Set());
            }
            for (const entry of entries) {
                this.elements.get(hash).add(entry);
            }
        }

        // Union of tombstones
        for (const tag of other.tombstones) {
            this.tombstones.add(tag);
        }

        // Clean up: remove entries whose tags are tombstoned
        for (const [hash, entries] of this.elements) {
            for (const entry of entries) {
                const { tag } = JSON.parse(entry);
                if (this.tombstones.has(tag)) {
                    entries.delete(entry);
                }
            }
            if (entries.size === 0) this.elements.delete(hash);
        }
    }

    /**
     * Export state for serialization.
     * @returns {Object}
     */
    export() {
        const elements = {};
        for (const [hash, entries] of this.elements) {
            elements[hash] = Array.from(entries);
        }
        return {
            type: 'ORSet',
            replicaId: this.replicaId,
            counter: this.counter,
            elements,
            tombstones: Array.from(this.tombstones)
        };
    }

    /**
     * Import state.
     * @param {Object} data
     */
    static from(data) {
        const set = new ORSet(data.replicaId);
        set.counter = data.counter;
        for (const [hash, entries] of Object.entries(data.elements)) {
            set.elements.set(hash, new Set(entries));
        }
        set.tombstones = new Set(data.tombstones);
        return set;
    }

    /**
     * Content-hash for braille byte sequences.
     * @private
     */
    static _hashBytes(bytes) {
        let h = 0;
        for (let i = 0; i < bytes.length; i++) {
            h = ((h << 5) - h + bytes[i]) | 0;
        }
        return 'h_' + Math.abs(h).toString(36);
    }
}

// ═══════════════════════════════════════════════════════════════════════════

class LWWRegister {
    /**
     * Last-Writer-Wins Register with scoring.
     * Stores a single value (braille byte sequence) with a score and timestamp.
     * On merge, the entry with the higher score wins.
     * Timestamp breaks ties.
     * 
     * @param {string} replicaId
     */
    constructor(replicaId = 'r_' + Math.random().toString(36).slice(2, 8)) {
        this.replicaId = replicaId;
        this.value = null;      // Uint8Array
        this.score = -Infinity;
        this.timestamp = 0;
        this.source = null;     // which replica wrote it
    }

    /**
     * Set the register value.
     * @param {Uint8Array|Array<number>} value - Braille bytes
     * @param {number} score - Quality score (higher = better)
     * @param {number} timestamp - Timestamp (default Date.now())
     */
    set(value, score = 0, timestamp = Date.now()) {
        const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
        if (score > this.score || (score === this.score && timestamp > this.timestamp)) {
            this.value = bytes;
            this.score = score;
            this.timestamp = timestamp;
            this.source = this.replicaId;
        }
    }

    /**
     * Get the current value.
     * @returns {Uint8Array|null}
     */
    get() {
        return this.value;
    }

    /**
     * Merge another LWWRegister. Higher score wins, timestamp breaks ties.
     * @param {LWWRegister} other
     */
    merge(other) {
        if (other.value === null) return;
        if (this.value === null ||
            other.score > this.score ||
            (other.score === this.score && other.timestamp > this.timestamp)) {
            this.value = other.value;
            this.score = other.score;
            this.timestamp = other.timestamp;
            this.source = other.source;
        }
    }

    /**
     * Export state.
     * @returns {Object}
     */
    export() {
        return {
            type: 'LWWRegister',
            replicaId: this.replicaId,
            value: this.value ? Array.from(this.value) : null,
            score: this.score,
            timestamp: this.timestamp,
            source: this.source
        };
    }

    /**
     * Import state.
     * @param {Object} data
     */
    static from(data) {
        const reg = new LWWRegister(data.replicaId);
        reg.value = data.value ? new Uint8Array(data.value) : null;
        reg.score = data.score;
        reg.timestamp = data.timestamp;
        reg.source = data.source;
        return reg;
    }
}

// ═══════════════════════════════════════════════════════════════════════════

class RGASequence {
    /**
     * Replicated Growable Array for braille byte sequences.
     * Supports insert, remove, and conflict-free merge of concurrent edits.
     * 
     * Each element has a unique ID (replicaId:counter) and a reference to
     * the element it was inserted after. This allows deterministic ordering
     * even with concurrent inserts.
     * 
     * @param {string} replicaId
     */
    constructor(replicaId = 'r_' + Math.random().toString(36).slice(2, 8)) {
        this.replicaId = replicaId;
        this.counter = 0;

        // Ordered list of { id, byte, afterId, removed }
        this.nodes = [];

        // Index: id → node reference
        this.index = new Map();

        // Root sentinel
        const root = { id: 'ROOT', byte: null, afterId: null, removed: false };
        this.nodes.push(root);
        this.index.set('ROOT', root);
    }

    /**
     * Insert a byte after a given position.
     * @param {number} position - 0-indexed position (0 = prepend)
     * @param {number} byte - Braille byte value (0–255)
     * @returns {string} - ID of the new node
     */
    insert(position, byte) {
        const liveNodes = this._liveNodes();
        const afterId = position <= 0 ? 'ROOT' : (liveNodes[position - 1]?.id || 'ROOT');

        const id = `${this.replicaId}:${++this.counter}`;
        const node = { id, byte: byte & 0xFF, afterId, removed: false };

        // Insert after the referenced node
        const afterIndex = this.nodes.findIndex(n => n.id === afterId);
        this.nodes.splice(afterIndex + 1, 0, node);
        this.index.set(id, node);

        return id;
    }

    /**
     * Append a byte to the end.
     * @param {number} byte
     * @returns {string}
     */
    append(byte) {
        return this.insert(this._liveNodes().length, byte);
    }

    /**
     * Remove the byte at a position.
     * @param {number} position - 0-indexed
     */
    remove(position) {
        const liveNodes = this._liveNodes();
        if (position < 0 || position >= liveNodes.length) return;
        liveNodes[position].removed = true;
    }

    /**
     * Get the current sequence as a Uint8Array.
     * @returns {Uint8Array}
     */
    toBytes() {
        const live = this._liveNodes();
        const bytes = new Uint8Array(live.length);
        for (let i = 0; i < live.length; i++) bytes[i] = live[i].byte;
        return bytes;
    }

    /**
     * Get the current sequence as a braille string.
     * @returns {string}
     */
    toBraille() {
        const bytes = this.toBytes();
        let s = '';
        for (const b of bytes) s += String.fromCodePoint(0x2800 + b);
        return s;
    }

    /**
     * Number of live elements.
     * @returns {number}
     */
    get length() {
        return this._liveNodes().length;
    }

    /**
     * Merge another RGASequence. Concurrent inserts at the same position
     * are ordered by replicaId (deterministic tiebreak).
     * @param {RGASequence} other
     */
    merge(other) {
        for (const node of other.nodes) {
            if (node.id === 'ROOT') continue;

            if (this.index.has(node.id)) {
                // Already have this node — apply remove if other removed it
                if (node.removed) {
                    this.index.get(node.id).removed = true;
                }
            } else {
                // New node — insert after its reference
                const newNode = { ...node };
                this.index.set(newNode.id, newNode);

                const afterIndex = this.nodes.findIndex(n => n.id === newNode.afterId);
                if (afterIndex >= 0) {
                    // Find correct position among concurrent inserts after the same node
                    let insertAt = afterIndex + 1;
                    while (insertAt < this.nodes.length) {
                        const existing = this.nodes[insertAt];
                        if (existing.afterId !== newNode.afterId) break;
                        // Tiebreak: higher replicaId goes first
                        if (existing.id < newNode.id) break;
                        insertAt++;
                    }
                    this.nodes.splice(insertAt, 0, newNode);
                } else {
                    this.nodes.push(newNode);
                }
            }
        }
    }

    /**
     * Export state.
     * @returns {Object}
     */
    export() {
        return {
            type: 'RGASequence',
            replicaId: this.replicaId,
            counter: this.counter,
            nodes: this.nodes.map(n => ({ ...n }))
        };
    }

    /**
     * Import state.
     * @param {Object} data
     */
    static from(data) {
        const seq = new RGASequence(data.replicaId);
        seq.counter = data.counter;
        seq.nodes = data.nodes.map(n => ({ ...n }));
        seq.index = new Map();
        for (const node of seq.nodes) seq.index.set(node.id, node);
        return seq;
    }

    /** @private */
    _liveNodes() {
        return this.nodes.filter(n => n.id !== 'ROOT' && !n.removed);
    }
}

// ═══════════════════════════════════════════════════════════════════════════

class MerkleChunkedLog {
    /**
     * Content-addressed append-only log of braille byte chunks.
     * Each chunk is hashed for dedup. Merge = union of chunks.
     * Enables scalable syncing: only transfer missing hashes.
     * 
     * @param {string} replicaId
     * @param {number} chunkSize - Bytes per chunk (default 32)
     */
    constructor(replicaId = 'r_' + Math.random().toString(36).slice(2, 8), chunkSize = 32) {
        this.replicaId = replicaId;
        this.chunkSize = chunkSize;

        // hash → Uint8Array
        this.chunks = new Map();

        // Ordered list of hashes (append order)
        this.order = [];
    }

    /**
     * Append raw bytes. Auto-chunks into chunkSize pieces.
     * @param {Uint8Array|Array<number>} data
     * @returns {Array<string>} - Hashes of the new chunks
     */
    append(data) {
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        const hashes = [];

        for (let i = 0; i < bytes.length; i += this.chunkSize) {
            const chunk = bytes.slice(i, i + this.chunkSize);
            const hash = MerkleChunkedLog._hashChunk(chunk);

            if (!this.chunks.has(hash)) {
                this.chunks.set(hash, chunk);
                this.order.push(hash);
            }
            hashes.push(hash);
        }

        return hashes;
    }

    /**
     * Get a chunk by hash.
     * @param {string} hash
     * @returns {Uint8Array|null}
     */
    getChunk(hash) {
        return this.chunks.get(hash) || null;
    }

    /**
     * Get all hashes (for sync protocol).
     * @returns {Array<string>}
     */
    getHashes() {
        return [...this.order];
    }

    /**
     * Get hashes that the other log is missing.
     * @param {MerkleChunkedLog} other
     * @returns {Array<string>}
     */
    getMissing(other) {
        return this.order.filter(h => !other.chunks.has(h));
    }

    /**
     * Total stored bytes.
     * @returns {number}
     */
    get totalBytes() {
        let total = 0;
        for (const chunk of this.chunks.values()) total += chunk.length;
        return total;
    }

    /**
     * Number of unique chunks.
     * @returns {number}
     */
    get size() {
        return this.chunks.size;
    }

    /**
     * Merge another log. Union of chunks, preserving order.
     * @param {MerkleChunkedLog} other
     */
    merge(other) {
        for (const hash of other.order) {
            if (!this.chunks.has(hash)) {
                this.chunks.set(hash, other.chunks.get(hash));
                this.order.push(hash);
            }
        }
    }

    /**
     * Reassemble all chunks in order.
     * @returns {Uint8Array}
     */
    toBytes() {
        const parts = this.order.map(h => this.chunks.get(h)).filter(Boolean);
        const total = parts.reduce((s, p) => s + p.length, 0);
        const result = new Uint8Array(total);
        let offset = 0;
        for (const part of parts) {
            result.set(part, offset);
            offset += part.length;
        }
        return result;
    }

    /**
     * Export state.
     * @returns {Object}
     */
    export() {
        const chunks = {};
        for (const [hash, data] of this.chunks) {
            chunks[hash] = Array.from(data);
        }
        return {
            type: 'MerkleChunkedLog',
            replicaId: this.replicaId,
            chunkSize: this.chunkSize,
            chunks,
            order: [...this.order]
        };
    }

    /**
     * Import state.
     * @param {Object} data
     */
    static from(data) {
        const log = new MerkleChunkedLog(data.replicaId, data.chunkSize);
        for (const [hash, arr] of Object.entries(data.chunks)) {
            log.chunks.set(hash, new Uint8Array(arr));
        }
        log.order = [...data.order];
        return log;
    }

    /**
     * Content-address hash for a chunk.
     * @private
     */
    static _hashChunk(bytes) {
        let h1 = 0x811c9dc5;
        for (let i = 0; i < bytes.length; i++) {
            h1 ^= bytes[i];
            h1 = Math.imul(h1, 0x01000193);
        }
        return 'c_' + (h1 >>> 0).toString(36);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ORSet, LWWRegister, RGASequence, MerkleChunkedLog };
} else if (typeof window !== 'undefined') {
    window.ORSet = ORSet;
    window.LWWRegister = LWWRegister;
    window.RGASequence = RGASequence;
    window.MerkleChunkedLog = MerkleChunkedLog;
}
