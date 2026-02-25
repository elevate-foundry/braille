/**
 * BrailleTTS - Braille-Native Text-to-Speech Synthesis
 * 
 * Uses the 8D braille vector space as a UNIFIED basis for text and audio.
 * 
 * The core idea:
 *   1. Text → 8D braille vectors   (via BrailleVectorSpace.textToVectors)
 *   2. 8D vectors → audio features  (linear transform W_audio)
 *   3. Audio features → waveform    (additive synthesis)
 *   
 * And the inverse for speech-to-braille:
 *   1. Audio → spectrogram frames
 *   2. Frames → 8D braille vectors  (via W_audio⁻¹)
 *   3. Braille vectors → text        (via BrailleVectorSpace.vectorsToText)
 * 
 * The 8 dimensions of the braille cell map to 8 frequency bands:
 *   d₀ → 200 Hz   (fundamental / low)
 *   d₁ → 400 Hz
 *   d₂ → 600 Hz
 *   d₃ → 1000 Hz  (first formant region)
 *   d₄ → 1600 Hz
 *   d₅ → 2400 Hz  (second formant region)
 *   d₆ → 3200 Hz  (consonant energy)
 *   d₇ → 4800 Hz  (sibilance / high frequency)
 * 
 * Each raised dot = that frequency band is active in the synthesized frame.
 * This creates a direct, audible representation of braille patterns.
 */

// Imports for Node.js
if (typeof require !== 'undefined') {
    var BrailleVectorSpace = require('./braille-vector-space').BrailleVectorSpace;
}

class BrailleTTS {
    /**
     * @param {Object} options
     * @param {number} options.sampleRate - Audio sample rate (default 22050)
     * @param {number} options.frameDurationMs - Duration per braille cell in ms (default 80)
     * @param {number} options.attackMs - Amplitude envelope attack (default 5)
     * @param {number} options.releaseMs - Amplitude envelope release (default 10)
     * @param {number} options.baseAmplitude - Overall volume 0-1 (default 0.3)
     */
    constructor(options = {}) {
        this.options = {
            sampleRate: 22050,
            frameDurationMs: 80,
            attackMs: 5,
            releaseMs: 10,
            baseAmplitude: 0.3,
            ...options
        };

        // The 8 frequency bands mapped to braille dot positions
        // Chosen to span speech-relevant frequencies (200–4800 Hz)
        this.FREQ_BANDS = [
            200,   // d₀ — low fundamental
            400,   // d₁ — low-mid
            600,   // d₂ — first formant lower bound
            1000,  // d₃ — first formant upper / nasal
            1600,  // d₄ — second formant lower
            2400,  // d₅ — second formant upper
            3200,  // d₆ — fricative / consonant energy
            4800   // d₇ — sibilance / high-frequency detail
        ];

        this.vs = new BrailleVectorSpace();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  TEXT → AUDIO (Synthesis)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Synthesize audio from text via the braille vector space.
     * 
     *   text → [byte₁, byte₂, ...] → [{0,1}^8, ...] → [waveform₁, waveform₂, ...] → audio
     * 
     * @param {string} text - Input text
     * @returns {Object} - { samples: Float32Array, sampleRate, duration, frames }
     */
    synthesize(text) {
        const vectors = this.vs.textToVectors(text);
        return this.synthesizeFromVectors(vectors);
    }

    /**
     * Synthesize audio from an array of 8D braille vectors.
     * 
     * @param {Array<Float64Array>} vectors - 8D binary vectors
     * @returns {Object} - { samples: Float32Array, sampleRate, duration, frames }
     */
    synthesizeFromVectors(vectors) {
        const sr = this.options.sampleRate;
        const frameSamples = Math.round(sr * this.options.frameDurationMs / 1000);
        const totalSamples = frameSamples * vectors.length;
        const samples = new Float32Array(totalSamples);

        for (let f = 0; f < vectors.length; f++) {
            const frameStart = f * frameSamples;
            this._renderFrame(samples, frameStart, frameSamples, vectors[f]);
        }

        return {
            samples,
            sampleRate: sr,
            duration: totalSamples / sr,
            frameCount: vectors.length,
            frameDurationMs: this.options.frameDurationMs
        };
    }

    /**
     * Synthesize audio from a braille unicode string.
     * 
     * @param {string} braille - Braille unicode characters
     * @returns {Object} - { samples, sampleRate, duration, frames }
     */
    synthesizeFromBraille(braille) {
        const vectors = [];
        for (let i = 0; i < braille.length; i++) {
            vectors.push(this.vs.charToVector(braille[i]));
        }
        return this.synthesizeFromVectors(vectors);
    }

    /**
     * Render a single frame (one braille cell) into the sample buffer.
     * Uses additive synthesis: each active dot contributes a sine wave
     * at its mapped frequency.
     * 
     * @private
     */
    _renderFrame(buffer, offset, length, vector) {
        const sr = this.options.sampleRate;
        const amp = this.options.baseAmplitude;
        const attackSamples = Math.round(sr * this.options.attackMs / 1000);
        const releaseSamples = Math.round(sr * this.options.releaseMs / 1000);

        // Count active dots for amplitude normalization
        let activeDots = 0;
        for (let d = 0; d < 8; d++) {
            if (Math.round(vector[d])) activeDots++;
        }
        if (activeDots === 0) return; // silence for empty cell

        const perDotAmp = amp / Math.sqrt(activeDots); // normalize energy

        for (let d = 0; d < 8; d++) {
            if (!Math.round(vector[d])) continue;

            const freq = this.FREQ_BANDS[d];
            const omega = 2 * Math.PI * freq / sr;

            for (let s = 0; s < length; s++) {
                // Amplitude envelope (attack-sustain-release)
                let env = 1.0;
                if (s < attackSamples) {
                    env = s / attackSamples;
                } else if (s > length - releaseSamples) {
                    env = (length - s) / releaseSamples;
                }

                buffer[offset + s] += perDotAmp * env * Math.sin(omega * s);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  AUDIO → TEXT (Analysis / Speech-to-Braille)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Analyze audio samples into 8D braille vectors by measuring energy
     * in each of the 8 frequency bands per frame.
     * 
     *   audio → [frame₁, frame₂, ...] → [{0,1}^8, ...] → text
     * 
     * @param {Float32Array} samples - Audio sample data
     * @param {number} sampleRate - Sample rate of the audio
     * @returns {Array<Float64Array>} - Array of 8D binary vectors
     */
    analyzeToVectors(samples, sampleRate) {
        const frameSamples = Math.round(sampleRate * this.options.frameDurationMs / 1000);
        const frameCount = Math.floor(samples.length / frameSamples);
        const vectors = [];

        for (let f = 0; f < frameCount; f++) {
            const start = f * frameSamples;
            const frame = samples.subarray(start, start + frameSamples);
            vectors.push(this._analyzeFrame(frame, sampleRate));
        }

        return vectors;
    }

    /**
     * Analyze a single audio frame into an 8D binary vector using
     * Goertzel's algorithm for each target frequency band.
     * 
     * @private
     */
    _analyzeFrame(frame, sampleRate) {
        const vec = new Float64Array(8);
        const energies = new Float64Array(8);
        let maxEnergy = 0;

        for (let d = 0; d < 8; d++) {
            energies[d] = this._goertzelEnergy(frame, sampleRate, this.FREQ_BANDS[d]);
            if (energies[d] > maxEnergy) maxEnergy = energies[d];
        }

        // Threshold: a band is "active" if its energy exceeds 20% of the max
        const threshold = maxEnergy * 0.2;
        for (let d = 0; d < 8; d++) {
            vec[d] = energies[d] > threshold ? 1 : 0;
        }

        return vec;
    }

    /**
     * Goertzel algorithm: efficiently compute energy at a single frequency.
     * O(N) per frequency, much faster than full FFT for 8 target bins.
     * 
     * @private
     * @param {Float32Array} frame - Audio samples
     * @param {number} sampleRate
     * @param {number} targetFreq - Target frequency in Hz
     * @returns {number} - Energy at that frequency
     */
    _goertzelEnergy(frame, sampleRate, targetFreq) {
        const N = frame.length;
        const k = Math.round(targetFreq * N / sampleRate);
        const omega = 2 * Math.PI * k / N;
        const coeff = 2 * Math.cos(omega);

        let s0 = 0, s1 = 0, s2 = 0;
        for (let i = 0; i < N; i++) {
            s0 = frame[i] + coeff * s1 - s2;
            s2 = s1;
            s1 = s0;
        }

        // Magnitude squared
        return s1 * s1 + s2 * s2 - coeff * s1 * s2;
    }

    /**
     * Full round-trip: text → synthesize → analyze → decode back to text.
     * Tests the lossless (or near-lossless) property of the encoding.
     * 
     * @param {string} text
     * @returns {Object} - { decoded, originalLength, matchRate, vectors }
     */
    roundTrip(text) {
        // Encode
        const synthesized = this.synthesize(text);

        // Decode
        const recoveredVectors = this.analyzeToVectors(synthesized.samples, synthesized.sampleRate);

        // Convert back to text
        const decoded = this.vs.vectorsToText(recoveredVectors);

        // Measure accuracy
        const originalVectors = this.vs.textToVectors(text);
        let matches = 0;
        const compareLen = Math.min(originalVectors.length, recoveredVectors.length);
        for (let i = 0; i < compareLen; i++) {
            if (this.vs.vectorToByte(originalVectors[i]) === this.vs.vectorToByte(recoveredVectors[i])) {
                matches++;
            }
        }

        return {
            original: text,
            decoded: decoded.substring(0, text.length),
            originalLength: originalVectors.length,
            recoveredLength: recoveredVectors.length,
            matchRate: compareLen > 0 ? (matches / compareLen * 100).toFixed(1) + '%' : '0%',
            exactMatch: decoded.substring(0, text.length) === text
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  MUSICAL ENCODING (braille → music)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Map braille vectors to musical notes using a pentatonic scale.
     * Each dot activates a note; the combination creates a chord.
     * 
     * @param {Array<Float64Array>} vectors - 8D braille vectors
     * @param {number} bpm - Beats per minute (default 120)
     * @returns {Array<Object>} - Array of { notes, duration, vector }
     */
    vectorsToMusic(vectors, bpm = 120) {
        // Pentatonic + octave mapping for pleasant sound
        const NOTES = [
            { name: 'C4', freq: 261.63 },
            { name: 'D4', freq: 293.66 },
            { name: 'E4', freq: 329.63 },
            { name: 'G4', freq: 392.00 },
            { name: 'A4', freq: 440.00 },
            { name: 'C5', freq: 523.25 },
            { name: 'D5', freq: 587.33 },
            { name: 'E5', freq: 659.25 }
        ];

        const beatDuration = 60 / bpm; // seconds per beat

        return vectors.map(vec => {
            const activeNotes = [];
            for (let d = 0; d < 8; d++) {
                if (Math.round(vec[d])) {
                    activeNotes.push(NOTES[d]);
                }
            }
            return {
                notes: activeNotes,
                duration: beatDuration,
                vector: Array.from(vec)
            };
        });
    }

    /**
     * Synthesize musical audio from braille vectors.
     * 
     * @param {Array<Float64Array>} vectors
     * @param {number} bpm
     * @returns {Object} - { samples, sampleRate, duration }
     */
    synthesizeMusic(vectors, bpm = 120) {
        const sr = this.options.sampleRate;
        const beatSamples = Math.round(sr * 60 / bpm);
        const totalSamples = beatSamples * vectors.length;
        const samples = new Float32Array(totalSamples);
        const amp = this.options.baseAmplitude;

        const NOTES_FREQ = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
        const attackSamples = Math.round(sr * 0.01);
        const releaseSamples = Math.round(sr * 0.05);

        for (let f = 0; f < vectors.length; f++) {
            const vec = vectors[f];
            let activeDots = 0;
            for (let d = 0; d < 8; d++) if (Math.round(vec[d])) activeDots++;
            if (activeDots === 0) continue;

            const perNoteAmp = amp / Math.sqrt(activeDots);
            const frameStart = f * beatSamples;

            for (let d = 0; d < 8; d++) {
                if (!Math.round(vec[d])) continue;
                const omega = 2 * Math.PI * NOTES_FREQ[d] / sr;

                for (let s = 0; s < beatSamples; s++) {
                    let env = 1.0;
                    if (s < attackSamples) env = s / attackSamples;
                    else if (s > beatSamples - releaseSamples) env = (beatSamples - s) / releaseSamples;

                    samples[frameStart + s] += perNoteAmp * env * Math.sin(omega * s);
                }
            }
        }

        return {
            samples,
            sampleRate: sr,
            duration: totalSamples / sr,
            noteCount: vectors.length
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  WEB AUDIO API PLAYBACK
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Play synthesized audio in the browser using Web Audio API.
     * Returns null in Node.js environments.
     * 
     * @param {Object} synthesized - Output from synthesize() or synthesizeMusic()
     * @returns {Promise<void>|null}
     */
    play(synthesized) {
        if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
            return null; // Not in browser
        }

        const AudioCtx = typeof AudioContext !== 'undefined' ? AudioContext : webkitAudioContext;
        const ctx = new AudioCtx();
        const buffer = ctx.createBuffer(1, synthesized.samples.length, synthesized.sampleRate);
        buffer.getChannelData(0).set(synthesized.samples);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();

        return new Promise(resolve => {
            source.onended = () => {
                ctx.close();
                resolve();
            };
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §5  STATS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get info about this TTS engine's configuration.
     * @returns {Object}
     */
    getInfo() {
        return {
            sampleRate: this.options.sampleRate,
            frameDurationMs: this.options.frameDurationMs,
            frequencyBands: this.FREQ_BANDS.map((f, i) => ({
                dot: i,
                freq: f,
                label: ['low', 'low-mid', 'F1-low', 'F1-high', 'F2-low', 'F2-high', 'consonant', 'sibilance'][i]
            })),
            crossModalBasis: '8D braille vector space',
            modalities: ['text', 'speech', 'music']
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrailleTTS };
} else if (typeof window !== 'undefined') {
    window.BrailleTTS = BrailleTTS;
}
