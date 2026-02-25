/**
 * Music Braille Notation Implementation
 * 
 * Provides music notation in braille following international standards
 * Supports notes, rhythms, accidentals, dynamics, and more
 */

class MusicBraille {
    constructor() {
        this.unicode = new Braille8DotUnicode();
        
        // Initialize music notation mappings
        this.notes = this.initializeNotes();
        this.accidentals = this.initializeAccidentals();
        this.octaveMarks = this.initializeOctaveMarks();
        this.rhythms = this.initializeRhythms();
        this.dynamics = this.initializeDynamics();
        this.articulations = this.initializeArticulations();
    }

    /**
     * Initialize note patterns (C-B)
     */
    initializeNotes() {
        return {
            // Whole notes
            'C_whole': [1, 4, 5, 6],
            'D_whole': [1, 5, 6],
            'E_whole': [1, 2, 4, 6],
            'F_whole': [1, 2, 4, 5, 6],
            'G_whole': [1, 2, 5, 6],
            'A_whole': [2, 4, 6],
            'B_whole': [2, 4, 5, 6],
            
            // Half notes
            'C_half': [1, 3, 4, 5, 6],
            'D_half': [1, 3, 5, 6],
            'E_half': [1, 2, 3, 4, 6],
            'F_half': [1, 2, 3, 4, 5, 6],
            'G_half': [1, 2, 3, 5, 6],
            'A_half': [2, 3, 4, 6],
            'B_half': [2, 3, 4, 5, 6],
            
            // Quarter notes
            'C_quarter': [1, 4, 5],
            'D_quarter': [1, 5],
            'E_quarter': [1, 2, 4],
            'F_quarter': [1, 2, 4, 5],
            'G_quarter': [1, 2, 5],
            'A_quarter': [2, 4],
            'B_quarter': [2, 4, 5],
            
            // Eighth notes
            'C_eighth': [1, 5],
            'D_eighth': [1, 5],
            'E_eighth': [3, 4],
            'F_eighth': [3, 4, 5],
            'G_eighth': [3, 5],
            'A_eighth': [3],
            'B_eighth': [3, 5],
            
            // Sixteenth notes
            'C_sixteenth': [1],
            'D_sixteenth': [1, 5],
            'E_sixteenth': [1, 2],
            'F_sixteenth': [1, 2, 5],
            'G_sixteenth': [1, 2, 5],
            'A_sixteenth': [2],
            'B_sixteenth': [2, 5],
        };
    }

    /**
     * Initialize accidentals
     */
    initializeAccidentals() {
        return {
            'sharp': [1, 4, 6],      // ♯
            'flat': [1, 2, 6],       // ♭
            'natural': [1, 6],       // ♮
            'double_sharp': [1, 4, 5, 6, 7], // 𝄪
            'double_flat': [1, 2, 6, 7],     // 𝄫
        };
    }

    /**
     * Initialize octave marks
     */
    initializeOctaveMarks() {
        return {
            'octave_1': [4, 5, 6],       // Lowest
            'octave_2': [4, 5],
            'octave_3': [4, 6],
            'octave_4': [4],             // Middle C octave
            'octave_5': [5],
            'octave_6': [4, 5, 6],
            'octave_7': [4, 5, 6, 7],    // Highest (8-dot)
            'octave_8': [4, 5, 6, 7, 8], // Extended (8-dot)
        };
    }

    /**
     * Initialize rhythm indicators
     */
    initializeRhythms() {
        return {
            'whole': [3, 4, 5, 6],
            'half': [3, 4, 5],
            'quarter': [3, 4],
            'eighth': [3],
            'sixteenth': [6],
            'thirty_second': [5, 6],
            'sixty_fourth': [4, 5, 6],
            'dotted': [3],           // Adds to note
            'double_dotted': [3, 3], // Two dots
            'triplet': [2, 3],
            'rest_whole': [1, 3, 4, 5, 6],
            'rest_half': [1, 3, 4, 5],
            'rest_quarter': [1, 3, 4],
            'rest_eighth': [1, 3],
            'rest_sixteenth': [1, 6],
        };
    }

    /**
     * Initialize dynamics
     */
    initializeDynamics() {
        return {
            'pp': [1, 2, 3, 4, 4],      // Pianissimo
            'p': [1, 2, 3, 4],          // Piano
            'mp': [1, 3, 4, 1, 2, 3, 4], // Mezzo-piano
            'mf': [1, 3, 4, 1, 2, 4],   // Mezzo-forte
            'f': [1, 2, 4],             // Forte
            'ff': [1, 2, 4, 1, 2, 4],   // Fortissimo
            'fff': [1, 2, 4, 1, 2, 4, 1, 2, 4], // Fortississimo
            'crescendo': [1, 2, 6],     // <
            'decrescendo': [3, 4, 5],   // >
            'sforzando': [2, 3, 4, 1, 2, 4], // sf
            'accent': [4, 6, 7],        // > (8-dot)
            'staccato': [2, 3, 6, 7],   // . (8-dot)
        };
    }

    /**
     * Initialize articulations (8-dot enhanced)
     */
    initializeArticulations() {
        return {
            'slur_start': [1, 4],
            'slur_end': [1, 5, 6],
            'tie': [1, 4, 6],
            'staccato': [2, 3, 6, 7],    // 8-dot
            'staccatissimo': [2, 3, 6, 7, 8], // 8-dot
            'accent': [4, 6, 7],         // 8-dot
            'marcato': [4, 6, 7, 8],     // 8-dot
            'tenuto': [5, 6, 7],         // 8-dot
            'fermata': [1, 2, 6, 7, 8],  // 8-dot
            'trill': [2, 3, 5, 6],
            'mordent': [1, 3, 5, 6],
            'turn': [2, 4, 5, 6],
        };
    }

    /**
     * Create a note with pitch, duration, and octave
     */
    createNote(pitch, duration, octave, accidental = null) {
        const result = [];
        
        // Add octave mark
        if (octave >= 1 && octave <= 8) {
            const octaveKey = `octave_${octave}`;
            if (this.octaveMarks[octaveKey]) {
                result.push(this.unicode.dotsToUnicode(this.octaveMarks[octaveKey]));
            }
        }
        
        // Add accidental if present
        if (accidental && this.accidentals[accidental]) {
            result.push(this.unicode.dotsToUnicode(this.accidentals[accidental]));
        }
        
        // Add note
        const noteKey = `${pitch}_${duration}`;
        if (this.notes[noteKey]) {
            result.push(this.unicode.dotsToUnicode(this.notes[noteKey]));
        }
        
        return result.join('');
    }

    /**
     * Create a chord (multiple notes played simultaneously)
     */
    createChord(notes) {
        // In braille music, chords are written with interval indicators
        const result = [];
        
        // Sort notes by pitch (lowest to highest)
        const sortedNotes = notes.sort((a, b) => {
            const pitchOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            return pitchOrder.indexOf(a.pitch) - pitchOrder.indexOf(b.pitch);
        });
        
        // Write lowest note with full notation
        result.push(this.createNote(
            sortedNotes[0].pitch,
            sortedNotes[0].duration,
            sortedNotes[0].octave,
            sortedNotes[0].accidental
        ));
        
        // Add interval indicators for upper notes
        for (let i = 1; i < sortedNotes.length; i++) {
            const interval = this.calculateInterval(sortedNotes[i-1], sortedNotes[i]);
            result.push(this.unicode.dotsToUnicode(this.getIntervalDots(interval)));
        }
        
        return result.join('');
    }

    /**
     * Calculate interval between two notes
     */
    calculateInterval(note1, note2) {
        const pitchOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const index1 = pitchOrder.indexOf(note1.pitch);
        const index2 = pitchOrder.indexOf(note2.pitch);
        
        let interval = index2 - index1;
        if (note2.octave > note1.octave) {
            interval += 7 * (note2.octave - note1.octave);
        }
        
        return interval;
    }

    /**
     * Get braille dots for interval
     */
    getIntervalDots(interval) {
        const intervalDots = {
            1: [3, 4],      // Second
            2: [3, 4, 5],   // Third
            3: [3, 4, 6],   // Fourth
            4: [3, 5],      // Fifth
            5: [3, 5, 6],   // Sixth
            6: [3, 6],      // Seventh
            7: [3, 4, 5, 6], // Octave
        };
        
        return intervalDots[interval % 7] || [3, 4];
    }

    /**
     * Create time signature
     */
    createTimeSignature(numerator, denominator) {
        const result = [];
        
        // Number indicator
        result.push(this.unicode.dotsToUnicode([3, 4, 5, 6]));
        
        // Numerator
        result.push(this.numberToBraille(numerator));
        
        // Music hyphen (separator)
        result.push(this.unicode.dotsToUnicode([5]));
        
        // Denominator
        result.push(this.numberToBraille(denominator));
        
        return result.join('');
    }

    /**
     * Convert number to braille
     */
    numberToBraille(num) {
        const digitDots = {
            '0': [3, 5, 6],
            '1': [2],
            '2': [2, 3],
            '3': [2, 5],
            '4': [2, 5, 6],
            '5': [2, 6],
            '6': [2, 3, 5],
            '7': [2, 3, 5, 6],
            '8': [2, 3, 6],
            '9': [3, 5]
        };
        
        return num.toString().split('').map(digit => 
            this.unicode.dotsToUnicode(digitDots[digit])
        ).join('');
    }

    /**
     * Create key signature
     */
    createKeySignature(sharps, flats) {
        const result = [];
        
        // Add sharps
        for (let i = 0; i < sharps; i++) {
            result.push(this.unicode.dotsToUnicode(this.accidentals.sharp));
        }
        
        // Add flats
        for (let i = 0; i < flats; i++) {
            result.push(this.unicode.dotsToUnicode(this.accidentals.flat));
        }
        
        return result.join('');
    }

    /**
     * Add dynamic marking
     */
    addDynamic(dynamic) {
        if (this.dynamics[dynamic]) {
            return this.unicode.dotsToUnicode(this.dynamics[dynamic]);
        }
        return '';
    }

    /**
     * Add articulation
     */
    addArticulation(articulation) {
        if (this.articulations[articulation]) {
            return this.unicode.dotsToUnicode(this.articulations[articulation]);
        }
        return '';
    }

    /**
     * Create a rest
     */
    createRest(duration) {
        const restKey = `rest_${duration}`;
        if (this.rhythms[restKey]) {
            return this.unicode.dotsToUnicode(this.rhythms[restKey]);
        }
        return '';
    }

    /**
     * Create a measure
     */
    createMeasure(notes) {
        const result = [];
        
        for (const note of notes) {
            if (note.type === 'note') {
                result.push(this.createNote(
                    note.pitch,
                    note.duration,
                    note.octave,
                    note.accidental
                ));
            } else if (note.type === 'rest') {
                result.push(this.createRest(note.duration));
            } else if (note.type === 'chord') {
                result.push(this.createChord(note.notes));
            }
            
            // Add articulation if present
            if (note.articulation) {
                result.push(this.addArticulation(note.articulation));
            }
        }
        
        // Measure separator
        result.push(this.unicode.dotsToUnicode([4, 6]));
        
        return result.join('');
    }

    /**
     * Get note information
     */
    getNoteInfo(pitch, duration) {
        const noteKey = `${pitch}_${duration}`;
        
        if (this.notes[noteKey]) {
            return {
                pitch: pitch,
                duration: duration,
                dots: this.notes[noteKey],
                unicode: this.unicode.dotsToUnicode(this.notes[noteKey]),
                description: `${pitch} ${duration} note`
            };
        }
        
        return null;
    }

    /**
     * Get all notes for a duration
     */
    getNotesByDuration(duration) {
        const notes = [];
        const pitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        
        for (const pitch of pitches) {
            const info = this.getNoteInfo(pitch, duration);
            if (info) {
                notes.push(info);
            }
        }
        
        return notes;
    }

    /**
     * Parse simple melody notation (e.g., "C4q D4q E4h")
     */
    parseSimpleMelody(notation) {
        const result = [];
        const tokens = notation.split(' ');
        
        for (const token of tokens) {
            // Format: [Pitch][Octave][Duration][Accidental?]
            // Example: C4q = C, octave 4, quarter note
            // Example: F#5h = F sharp, octave 5, half note
            
            const match = token.match(/^([A-G])([#b]?)(\d)([whqest])$/);
            if (match) {
                const [, pitch, accidental, octave, duration] = match;
                
                const durationMap = {
                    'w': 'whole',
                    'h': 'half',
                    'q': 'quarter',
                    'e': 'eighth',
                    's': 'sixteenth',
                    't': 'thirty_second'
                };
                
                const accidentalMap = {
                    '#': 'sharp',
                    'b': 'flat',
                    '': null
                };
                
                result.push(this.createNote(
                    pitch,
                    durationMap[duration],
                    parseInt(octave),
                    accidentalMap[accidental]
                ));
            }
        }
        
        return result.join(' ');
    }

    /**
     * Get all music symbols
     */
    getAllSymbols() {
        const symbols = [];
        
        // Add notes
        for (const [key, dots] of Object.entries(this.notes)) {
            const [pitch, duration] = key.split('_');
            symbols.push({
                type: 'note',
                pitch: pitch,
                duration: duration,
                dots: dots,
                unicode: this.unicode.dotsToUnicode(dots)
            });
        }
        
        // Add accidentals
        for (const [name, dots] of Object.entries(this.accidentals)) {
            symbols.push({
                type: 'accidental',
                name: name,
                dots: dots,
                unicode: this.unicode.dotsToUnicode(dots)
            });
        }
        
        return symbols;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicBraille;
}
