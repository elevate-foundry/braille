/**
 * BrailleVectorSpace - 8-Dimensional Braille Vector Space
 * 
 * Mathematical foundation for the Braille Infinity Lattice Pipeline.
 * 
 * KEY INSIGHT: Each 8-dot braille cell is a point in {0,1}^8 — an 8-dimensional
 * binary vector space with 2^8 = 256 possible states. This is isomorphic to a
 * byte, but the braille structure gives us a meaningful geometric interpretation:
 * 
 *   Dot layout:     Vector indices:
 *   ┌───┐           ┌───┐
 *   │1 4│           │d₀ d₃│
 *   │2 5│           │d₁ d₄│
 *   │3 6│           │d₂ d₅│
 *   │7 8│           │d₆ d₇│
 *   └───┘           └───┘
 * 
 * Unicode mapping: U+2800 + Σ(dᵢ × 2ⁱ) for i ∈ {0..7}
 * 
 * Formal basis notation (see BrailleBasis):
 * 
 *   𝓑_D = {0,1}^D      Basis indexed by dot-set D ⊆ {1,...,8}
 *   𝓑₀ ⊂ 𝓑₁ ⊂ ⋯ ⊂ 𝓑₈   Filtration (nested subspaces)
 *   𝓑₆⁽ⁱ⁾              Six-of-eight variant i ∈ 0..27
 * 
 * This module provides:
 *   1. Bijection φ: TokenSpace → {0,1}^8  (encoding)
 *   2. Inverse  φ⁻¹: {0,1}^8 → TokenSpace (decoding)
 *   3. Linear transformations (matrix multiply, transpose)
 *   4. PCA-based dimensionality reduction for compression
 *   5. Distance metrics in the vector space (Hamming, cosine)
 *   6. Basis for multi-modal encoding (text, audio features, etc.)
 *   7. Formal basis system via BrailleBasis (ℤ₂ᵏ, dot-sets, filtration)
 */

// Import BrailleBasis for formal notation support
if (typeof require !== 'undefined') {
    var BrailleBasis = require('./braille-basis').BrailleBasis;
}

class BrailleVectorSpace {
    constructor() {
        // The 8 standard basis vectors e₀..e₇ (one-hot per dot)
        this.BASIS = Array.from({ length: 8 }, (_, i) => {
            const v = new Float64Array(8);
            v[i] = 1;
            return v;
        });

        // Dimension of the space
        this.DIM = 8;

        // Unicode base for braille patterns
        this.UNICODE_BASE = 0x2800;

        // ─── Formal basis instances ──────────────────────────────────
        // 𝓑₆ = 𝓑_{1,2,3,4,5,6} ≅ ℤ₂⁶   Standard 6-dot
        // 𝓑₈ = 𝓑_{1..8}         ≅ ℤ₂⁸   Full 8-dot
        this.B6 = BrailleBasis.standard6();
        this.B8 = BrailleBasis.full8();

        // Full filtration: 𝓑₀ ⊂ 𝓑₁ ⊂ ⋯ ⊂ 𝓑₈
        this.filtration = BrailleBasis.filtration();
    }

    // ─── Basis Access ──────────────────────────────────────────────

    /**
     * Get a basis layer from the standard filtration.
     *   layer(6) → 𝓑₆ = 𝓑_{1..6} ≅ ℤ₂⁶
     *   layer(8) → 𝓑₈ = 𝓑_{1..8} ≅ ℤ₂⁸
     * 
     * @param {number} k - Layer index 0–8
     * @returns {BrailleBasis}
     */
    layer(k) {
        return this.filtration[k];
    }

    /**
     * Create a basis for an arbitrary dot-set.
     *   basis([1,2,3,4,7,8]) → 𝓑_{1,2,3,4,7,8} ≅ ℤ₂⁶
     * 
     * @param {Array<number>} dotSet - Dot numbers (1-indexed)
     * @returns {BrailleBasis}
     */
    basis(dotSet) {
        return new BrailleBasis(dotSet);
    }

    /**
     * Get all 28 six-of-eight variants.
     *   𝓑₆⁽⁰⁾ ... 𝓑₆⁽²⁷⁾
     * @returns {Array<BrailleBasis>}
     */
    sixOfEight() {
        return BrailleBasis.sixOfEight();
    }

    /**
     * Project a full 8-bit byte down to a k-dot layer.
     *   π: ℤ₂⁸ → ℤ₂ᵏ
     * 
     * @param {number} byte - Full 8-bit value
     * @param {BrailleBasis|number} target - Target basis or filtration layer index
     * @returns {number} - Projected byte
     */
    projectTo(byte, target) {
        const basis = typeof target === 'number' ? this.filtration[target] : target;
        return basis.project(byte);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  BIJECTION:  Token ↔ 8D Binary Vector ↔ Braille Unicode
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Convert a braille unicode character to its 8D binary vector.
     *   φ_char: BrailleChar → {0,1}^8
     * 
     * @param {string} char - Single braille unicode character (U+2800–U+28FF)
     * @returns {Float64Array} - 8-element vector, each 0 or 1
     */
    charToVector(char) {
        const cp = char.codePointAt(0) - this.UNICODE_BASE;
        const v = new Float64Array(8);
        for (let i = 0; i < 8; i++) {
            v[i] = (cp >> i) & 1;
        }
        return v;
    }

    /**
     * Convert an 8D binary vector back to a braille unicode character.
     *   φ_char⁻¹: {0,1}^8 → BrailleChar
     * 
     * @param {Float64Array|Array<number>} vec - 8-element vector
     * @returns {string} - Single braille unicode character
     */
    vectorToChar(vec) {
        let cp = 0;
        for (let i = 0; i < 8; i++) {
            if (Math.round(vec[i])) cp |= (1 << i);
        }
        return String.fromCodePoint(this.UNICODE_BASE + cp);
    }

    /**
     * Encode a byte (0–255) as an 8D braille vector.
     *   φ_byte: {0..255} → {0,1}^8
     * 
     * This is the natural bijection: byte value = dot pattern index.
     * 
     * @param {number} byte - Integer 0–255
     * @returns {Float64Array}
     */
    byteToVector(byte) {
        const v = new Float64Array(8);
        for (let i = 0; i < 8; i++) {
            v[i] = (byte >> i) & 1;
        }
        return v;
    }

    /**
     * Decode an 8D vector back to a byte value.
     *   φ_byte⁻¹: {0,1}^8 → {0..255}
     * 
     * @param {Float64Array|Array<number>} vec
     * @returns {number}
     */
    vectorToByte(vec) {
        let byte = 0;
        for (let i = 0; i < 8; i++) {
            if (Math.round(vec[i])) byte |= (1 << i);
        }
        return byte;
    }

    /**
     * Encode arbitrary text into a sequence of 8D vectors.
     * Each UTF-8 byte maps to one braille vector (lossless for ASCII).
     * Multi-byte UTF-8 chars produce multiple vectors.
     * 
     *   φ_text: String → [{0,1}^8, ...]
     * 
     * @param {string} text
     * @returns {Array<Float64Array>} - Array of 8D vectors
     */
    textToVectors(text) {
        const bytes = new TextEncoder().encode(text);
        return Array.from(bytes, b => this.byteToVector(b));
    }

    /**
     * Decode a sequence of 8D vectors back to text.
     *   φ_text⁻¹: [{0,1}^8, ...] → String
     * 
     * @param {Array<Float64Array>} vectors
     * @returns {string}
     */
    vectorsToText(vectors) {
        const bytes = new Uint8Array(vectors.map(v => this.vectorToByte(v)));
        return new TextDecoder().decode(bytes);
    }

    /**
     * Encode text into braille unicode string (via vector space).
     * Each byte becomes one braille character. Fully lossless.
     * 
     *   encode: String → BrailleString
     * 
     * @param {string} text
     * @returns {string} - Braille unicode string
     */
    encode(text) {
        const bytes = new TextEncoder().encode(text);
        let braille = '';
        for (const b of bytes) {
            braille += String.fromCodePoint(this.UNICODE_BASE + b);
        }
        return braille;
    }

    /**
     * Decode braille unicode string back to text.
     *   decode: BrailleString → String
     * 
     * @param {string} braille
     * @returns {string}
     */
    decode(braille) {
        const bytes = new Uint8Array(braille.length);
        for (let i = 0; i < braille.length; i++) {
            bytes[i] = braille.codePointAt(i) - this.UNICODE_BASE;
        }
        return new TextDecoder().decode(bytes);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  LINEAR ALGEBRA PRIMITIVES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Matrix × vector multiplication.
     *   Mv where M is m×n and v is n×1
     * 
     * @param {Array<Float64Array>} M - Matrix (array of row vectors)
     * @param {Float64Array} v - Column vector
     * @returns {Float64Array} - Result vector
     */
    matVecMul(M, v) {
        const result = new Float64Array(M.length);
        for (let i = 0; i < M.length; i++) {
            let sum = 0;
            for (let j = 0; j < v.length; j++) {
                sum += M[i][j] * v[j];
            }
            result[i] = sum;
        }
        return result;
    }

    /**
     * Matrix × matrix multiplication.
     *   C = A × B where A is m×k and B is k×n
     * 
     * @param {Array<Float64Array>} A
     * @param {Array<Float64Array>} B
     * @returns {Array<Float64Array>}
     */
    matMul(A, B) {
        const m = A.length;
        const k = A[0].length;
        const n = B[0].length;
        const C = Array.from({ length: m }, () => new Float64Array(n));
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                let sum = 0;
                for (let p = 0; p < k; p++) {
                    sum += A[i][p] * B[p][j];
                }
                C[i][j] = sum;
            }
        }
        return C;
    }

    /**
     * Matrix transpose.
     * @param {Array<Float64Array>} M - m×n matrix
     * @returns {Array<Float64Array>} - n×m matrix
     */
    transpose(M) {
        const m = M.length;
        const n = M[0].length;
        const T = Array.from({ length: n }, () => new Float64Array(m));
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                T[j][i] = M[i][j];
            }
        }
        return T;
    }

    /**
     * Dot product of two vectors.
     * @param {Float64Array} a
     * @param {Float64Array} b
     * @returns {number}
     */
    dot(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
        return sum;
    }

    /**
     * Vector L2 norm.
     * @param {Float64Array} v
     * @returns {number}
     */
    norm(v) {
        return Math.sqrt(this.dot(v, v));
    }

    /**
     * Normalize a vector to unit length.
     * @param {Float64Array} v
     * @returns {Float64Array}
     */
    normalize(v) {
        const n = this.norm(v);
        if (n === 0) return new Float64Array(v.length);
        const result = new Float64Array(v.length);
        for (let i = 0; i < v.length; i++) result[i] = v[i] / n;
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  DISTANCE METRICS IN BRAILLE SPACE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Hamming distance: number of differing dots between two braille cells.
     * In the vector space, this is ‖a - b‖₁ for binary vectors.
     * 
     * @param {Float64Array} a
     * @param {Float64Array} b
     * @returns {number} - Integer 0–8
     */
    hammingDistance(a, b) {
        let d = 0;
        for (let i = 0; i < 8; i++) {
            if (Math.round(a[i]) !== Math.round(b[i])) d++;
        }
        return d;
    }

    /**
     * Cosine similarity between two vectors.
     *   cos(θ) = (a·b) / (‖a‖ × ‖b‖)
     * 
     * @param {Float64Array} a
     * @param {Float64Array} b
     * @returns {number} - Range [-1, 1]
     */
    cosineSimilarity(a, b) {
        const na = this.norm(a);
        const nb = this.norm(b);
        if (na === 0 || nb === 0) return 0;
        return this.dot(a, b) / (na * nb);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  PCA — DIMENSIONALITY REDUCTION FOR COMPRESSION
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Given N braille vectors in ℝ^8, PCA finds the k < 8 principal axes
    // that capture the most variance. Projecting onto those axes compresses
    // 8D → kD while minimizing reconstruction error.
    //
    // For text, k=5 or 6 often captures >95% variance because natural
    // language doesn't use all 256 braille patterns uniformly.

    /**
     * Compute the mean vector of a dataset.
     * @param {Array<Float64Array>} data - Array of 8D vectors
     * @returns {Float64Array}
     */
    mean(data) {
        const mu = new Float64Array(8);
        for (const v of data) {
            for (let i = 0; i < 8; i++) mu[i] += v[i];
        }
        for (let i = 0; i < 8; i++) mu[i] /= data.length;
        return mu;
    }

    /**
     * Compute the 8×8 covariance matrix of a dataset.
     *   Σ = (1/N) × Xᶜᵀ × Xᶜ  where Xᶜ is mean-centered
     * 
     * @param {Array<Float64Array>} data
     * @returns {Array<Float64Array>} - 8×8 covariance matrix
     */
    covarianceMatrix(data) {
        const mu = this.mean(data);
        const cov = Array.from({ length: 8 }, () => new Float64Array(8));
        const N = data.length;

        for (const v of data) {
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    cov[i][j] += (v[i] - mu[i]) * (v[j] - mu[j]);
                }
            }
        }

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                cov[i][j] /= N;
            }
        }

        return cov;
    }

    /**
     * Power iteration to find the dominant eigenvector of a symmetric matrix.
     * @param {Array<Float64Array>} M - Symmetric matrix
     * @param {number} maxIter - Max iterations (default 100)
     * @returns {{ vector: Float64Array, value: number }}
     */
    powerIteration(M, maxIter = 100) {
        let v = new Float64Array(M.length);
        // Initialize with non-zero vector
        for (let i = 0; i < v.length; i++) v[i] = Math.random() - 0.5;
        v = this.normalize(v);

        let eigenvalue = 0;
        for (let iter = 0; iter < maxIter; iter++) {
            const Mv = this.matVecMul(M, v);
            eigenvalue = this.norm(Mv);
            if (eigenvalue === 0) break;
            const vNew = this.normalize(Mv);

            // Convergence check
            let diff = 0;
            for (let i = 0; i < v.length; i++) diff += Math.abs(vNew[i] - v[i]);
            v = vNew;
            if (diff < 1e-10) break;
        }

        return { vector: v, value: eigenvalue };
    }

    /**
     * Deflation: remove the contribution of eigenvector from matrix.
     *   M' = M - λ × v × vᵀ
     * @param {Array<Float64Array>} M
     * @param {Float64Array} eigVec
     * @param {number} eigVal
     * @returns {Array<Float64Array>}
     */
    deflate(M, eigVec, eigVal) {
        const n = M.length;
        const result = Array.from({ length: n }, (_, i) => new Float64Array(M[i]));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                result[i][j] -= eigVal * eigVec[i] * eigVec[j];
            }
        }
        return result;
    }

    /**
     * Full PCA: compute top-k principal components of a dataset.
     * 
     * @param {Array<Float64Array>} data - N vectors of dimension 8
     * @param {number} k - Number of components to keep (1–8)
     * @returns {Object} - { components: k×8 matrix, eigenvalues, mean, varianceExplained }
     */
    pca(data, k = 6) {
        k = Math.min(k, 8);
        const mu = this.mean(data);
        let cov = this.covarianceMatrix(data);

        const components = [];
        const eigenvalues = [];

        for (let i = 0; i < k; i++) {
            const { vector, value } = this.powerIteration(cov);
            components.push(vector);
            eigenvalues.push(value);
            cov = this.deflate(cov, vector, value);
        }

        // Total variance = sum of all eigenvalues
        const totalVariance = eigenvalues.reduce((s, v) => s + v, 0);
        // To get true total, we'd need all 8 eigenvalues, but approximate from data
        let trueTotal = 0;
        const cov0 = this.covarianceMatrix(data);
        for (let i = 0; i < 8; i++) trueTotal += cov0[i][i]; // trace = sum of eigenvalues

        const varianceExplained = totalVariance / Math.max(trueTotal, 1e-10);

        return {
            components, // k eigenvectors (each Float64Array of length 8)
            eigenvalues,
            mean: mu,
            varianceExplained,
            k
        };
    }

    /**
     * Project 8D vectors into k-dimensional PCA subspace.
     *   z = W × (x - μ)  where W is k×8 principal component matrix
     * 
     * @param {Array<Float64Array>} data - 8D vectors
     * @param {Object} pcaResult - Output from pca()
     * @returns {Array<Float64Array>} - k-dimensional projected vectors
     */
    pcaProject(data, pcaResult) {
        const { components, mean } = pcaResult;
        return data.map(v => {
            const centered = new Float64Array(8);
            for (let i = 0; i < 8; i++) centered[i] = v[i] - mean[i];
            const projected = new Float64Array(components.length);
            for (let j = 0; j < components.length; j++) {
                projected[j] = this.dot(components[j], centered);
            }
            return projected;
        });
    }

    /**
     * Reconstruct 8D vectors from k-dimensional PCA projections.
     *   x̂ = Wᵀ × z + μ
     * 
     * If k < 8, this is lossy (but near-lossless if variance explained ≈ 1).
     * If k = 8, this is lossless.
     * 
     * @param {Array<Float64Array>} projected - k-dimensional vectors
     * @param {Object} pcaResult - Output from pca()
     * @returns {Array<Float64Array>} - Reconstructed 8D vectors
     */
    pcaReconstruct(projected, pcaResult) {
        const { components, mean } = pcaResult;
        return projected.map(z => {
            const reconstructed = new Float64Array(8);
            for (let i = 0; i < 8; i++) {
                reconstructed[i] = mean[i];
                for (let j = 0; j < components.length; j++) {
                    reconstructed[i] += components[j][i] * z[j];
                }
            }
            return reconstructed;
        });
    }

    /**
     * Quantize a reconstructed 8D vector back to binary {0,1}^8.
     * Rounds each dimension to nearest integer, clamps to [0,1].
     * 
     * @param {Float64Array} vec - Continuous 8D vector
     * @returns {Float64Array} - Binary 8D vector
     */
    quantize(vec) {
        const q = new Float64Array(8);
        for (let i = 0; i < 8; i++) {
            q[i] = Math.max(0, Math.min(1, Math.round(vec[i])));
        }
        return q;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §5  COMPRESSION PIPELINE:  text → vectors → PCA → compressed → reconstruct
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Compress text using PCA in the 8D braille vector space.
     * 
     * @param {string} text - Input text
     * @param {number} k - Target dimensions (1–8, default 6)
     * @returns {Object} - { projected, pcaResult, originalLength, compressionRatio }
     */
    compress(text, k = 6) {
        const vectors = this.textToVectors(text);
        const pcaResult = this.pca(vectors, k);
        const projected = this.pcaProject(vectors, pcaResult);

        return {
            projected,
            pcaResult,
            originalLength: vectors.length,
            originalBits: vectors.length * 8,
            compressedBits: projected.length * k,
            compressionRatio: k / 8,
            varianceExplained: pcaResult.varianceExplained
        };
    }

    /**
     * Decompress PCA-compressed data back to text.
     * 
     * @param {Object} compressed - Output from compress()
     * @returns {{ text: string, reconstructionError: number }}
     */
    decompress(compressed) {
        const { projected, pcaResult } = compressed;
        const reconstructed = this.pcaReconstruct(projected, pcaResult);
        const quantized = reconstructed.map(v => this.quantize(v));
        const text = this.vectorsToText(quantized);

        // Measure reconstruction error (average Hamming distance)
        const origVectors = this.textToVectors(text);
        let totalError = 0;
        for (let i = 0; i < quantized.length; i++) {
            totalError += this.hammingDistance(quantized[i],
                i < origVectors.length ? origVectors[i] : new Float64Array(8));
        }

        return {
            text,
            reconstructionError: totalError / Math.max(quantized.length, 1)
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §6  AUDIO FEATURE ENCODING (basis for braille-native TTS)
    // ═══════════════════════════════════════════════════════════════════════
    //
    // The same 8D vector space can encode audio features:
    //   - 8 frequency bands (like a mini-spectrogram frame)
    //   - Or 8 phoneme dimensions
    //   - Or 8 mel-frequency cepstral coefficients (MFCCs)
    //
    // The key insight: text and audio share the SAME braille vector space,
    // enabling cross-modal encoding.

    /**
     * Encode 8 audio feature values (e.g. frequency band energies) as a
     * braille vector. Values are normalized to [0,1] and thresholded at 0.5.
     * 
     * @param {Array<number>} features - 8 real-valued features
     * @returns {Float64Array} - Binary 8D braille vector
     */
    audioFeaturesToVector(features) {
        const v = new Float64Array(8);
        for (let i = 0; i < 8; i++) {
            v[i] = (features[i] || 0) >= 0.5 ? 1 : 0;
        }
        return v;
    }

    /**
     * Generate 8 frequency band amplitudes from a braille vector.
     * This is the synthesis direction: braille → audio features.
     * 
     * @param {Float64Array} vec - 8D braille vector
     * @returns {Array<number>} - 8 amplitude values [0, 1]
     */
    vectorToAudioFeatures(vec) {
        return Array.from(vec, v => Math.max(0, Math.min(1, v)));
    }

    /**
     * Build a linear transformation matrix that maps from one modality's
     * feature space to the braille vector space. Uses least-squares fitting.
     * 
     *   Given pairs (xᵢ, bᵢ) where xᵢ is a source feature vector and
     *   bᵢ is the target braille vector, find W such that W × xᵢ ≈ bᵢ.
     * 
     * @param {Array<Float64Array>} sourceFeatures - N feature vectors (dim d)
     * @param {Array<Float64Array>} targetBraille - N braille vectors (dim 8)
     * @returns {Array<Float64Array>} - 8×d transformation matrix
     */
    fitTransformMatrix(sourceFeatures, targetBraille) {
        // Simple least-squares via normal equations: W = B^T X (X^T X)^-1
        // For this prototype, use a simpler correlation-based approach
        const d = sourceFeatures[0].length;
        const N = sourceFeatures.length;
        const W = Array.from({ length: 8 }, () => new Float64Array(d));

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < d; j++) {
                let sumXY = 0, sumXX = 0;
                for (let n = 0; n < N; n++) {
                    sumXY += sourceFeatures[n][j] * targetBraille[n][i];
                    sumXX += sourceFeatures[n][j] * sourceFeatures[n][j];
                }
                W[i][j] = sumXX > 0 ? sumXY / sumXX : 0;
            }
        }

        return W;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §7  STATS & ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Analyze the distribution of braille vectors in a dataset.
     * 
     * @param {Array<Float64Array>} vectors - 8D vectors
     * @returns {Object} - Statistics about the vector distribution
     */
    analyzeDistribution(vectors) {
        // Per-dimension activation rate
        const dimActivation = new Float64Array(8);
        for (const v of vectors) {
            for (let i = 0; i < 8; i++) {
                if (Math.round(v[i])) dimActivation[i]++;
            }
        }
        for (let i = 0; i < 8; i++) dimActivation[i] /= vectors.length;

        // Unique patterns
        const patterns = new Set(vectors.map(v => this.vectorToByte(v)));

        // Average dot count (Hamming weight)
        let totalDots = 0;
        for (const v of vectors) {
            for (let i = 0; i < 8; i++) totalDots += Math.round(v[i]);
        }

        return {
            count: vectors.length,
            uniquePatterns: patterns.size,
            maxPossiblePatterns: 256,
            patternUtilization: (patterns.size / 256 * 100).toFixed(1) + '%',
            avgDotsPerCell: (totalDots / vectors.length).toFixed(2),
            dimActivation: Array.from(dimActivation, d => d.toFixed(3)),
            entropy: this._shannonEntropy(vectors)
        };
    }

    /**
     * Shannon entropy of the vector dataset (bits).
     * @private
     */
    _shannonEntropy(vectors) {
        const freq = new Map();
        for (const v of vectors) {
            const key = this.vectorToByte(v);
            freq.set(key, (freq.get(key) || 0) + 1);
        }
        let H = 0;
        const N = vectors.length;
        for (const count of freq.values()) {
            const p = count / N;
            if (p > 0) H -= p * Math.log2(p);
        }
        return H;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrailleVectorSpace };
} else if (typeof window !== 'undefined') {
    window.BrailleVectorSpace = BrailleVectorSpace;
}
