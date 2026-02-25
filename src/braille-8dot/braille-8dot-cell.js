/**
 * Braille 8-Dot Cell Component
 * 
 * Visual representation and interaction handler for 8-dot braille cells
 */

class Braille8DotCell {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element '${containerId}' not found`);
        }

        // Configuration options
        this.options = {
            size: options.size || 'medium',  // small, medium, large
            interactive: options.interactive !== undefined ? options.interactive : true,
            showLabels: options.showLabels || false,
            mode: options.mode || '8dot',  // '6dot' or '8dot'
            ...options
        };

        // State
        this.activeDots = [];
        this.unicode = null;
        this.callbacks = {
            onChange: options.onChange || null,
            onDotClick: options.onDotClick || null
        };

        this.init();
    }

    /**
     * Initialize the cell component
     */
    init() {
        this.render();
        if (this.options.interactive) {
            this.attachEventListeners();
        }
    }

    /**
     * Render the 8-dot cell HTML
     */
    render() {
        const sizeClass = `braille-cell-8dot-${this.options.size}`;
        const modeClass = this.options.mode === '6dot' ? 'mode-6dot' : 'mode-8dot';
        const interactiveClass = this.options.interactive ? 'interactive' : '';

        this.container.innerHTML = `
            <div class="braille-cell-8dot ${sizeClass} ${modeClass} ${interactiveClass}">
                <div class="dot-column left">
                    ${this.renderDot(1)}
                    ${this.renderDot(2)}
                    ${this.renderDot(3)}
                    ${this.options.mode === '8dot' ? this.renderDot(7) : ''}
                </div>
                <div class="dot-column right">
                    ${this.renderDot(4)}
                    ${this.renderDot(5)}
                    ${this.renderDot(6)}
                    ${this.options.mode === '8dot' ? this.renderDot(8) : ''}
                </div>
            </div>
            ${this.options.showUnicode ? '<div class="unicode-display"></div>' : ''}
        `;

        this.updateDisplay();
    }

    /**
     * Render individual dot HTML
     */
    renderDot(dotNumber) {
        const label = this.options.showLabels ? `<span class="dot-label">${dotNumber}</span>` : '';
        return `
            <div class="dot" data-dot="${dotNumber}" role="button" tabindex="0" aria-label="Dot ${dotNumber}">
                ${label}
            </div>
        `;
    }

    /**
     * Attach event listeners for interactive mode
     */
    attachEventListeners() {
        const dots = this.container.querySelectorAll('.dot');
        
        dots.forEach(dot => {
            const dotNumber = parseInt(dot.dataset.dot);
            
            // Click/touch events
            dot.addEventListener('click', () => this.toggleDot(dotNumber));
            
            // Keyboard accessibility
            dot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleDot(dotNumber);
                }
            });

            // Hover effects
            dot.addEventListener('mouseenter', () => {
                dot.classList.add('hover');
            });
            
            dot.addEventListener('mouseleave', () => {
                dot.classList.remove('hover');
            });
        });
    }

    /**
     * Toggle a dot on/off
     */
    toggleDot(dotNumber) {
        if (this.activeDots.includes(dotNumber)) {
            this.removeDot(dotNumber);
        } else {
            this.addDot(dotNumber);
        }

        if (this.callbacks.onDotClick) {
            this.callbacks.onDotClick(dotNumber, this.activeDots);
        }
    }

    /**
     * Add a dot to the active set
     */
    addDot(dotNumber) {
        if (!this.activeDots.includes(dotNumber)) {
            this.activeDots.push(dotNumber);
            this.activeDots.sort((a, b) => a - b);
            this.updateDisplay();
            this.triggerChange();
        }
    }

    /**
     * Remove a dot from the active set
     */
    removeDot(dotNumber) {
        const index = this.activeDots.indexOf(dotNumber);
        if (index > -1) {
            this.activeDots.splice(index, 1);
            this.updateDisplay();
            this.triggerChange();
        }
    }

    /**
     * Set dots from array
     */
    setDots(dots) {
        this.activeDots = [...dots].sort((a, b) => a - b);
        this.updateDisplay();
        this.triggerChange();
    }

    /**
     * Set dots from Unicode character
     */
    setFromUnicode(char) {
        if (typeof Braille8DotUnicode !== 'undefined') {
            const converter = new Braille8DotUnicode();
            this.activeDots = converter.unicodeToDots(char);
            this.unicode = char;
            this.updateDisplay();
            this.triggerChange();
        } else {
            console.error('Braille8DotUnicode class not loaded');
        }
    }

    /**
     * Clear all dots
     */
    clear() {
        this.activeDots = [];
        this.unicode = null;
        this.updateDisplay();
        this.triggerChange();
    }

    /**
     * Update visual display
     */
    updateDisplay() {
        const dots = this.container.querySelectorAll('.dot');
        
        dots.forEach(dot => {
            const dotNumber = parseInt(dot.dataset.dot);
            if (this.activeDots.includes(dotNumber)) {
                dot.classList.add('active');
                dot.setAttribute('aria-pressed', 'true');
            } else {
                dot.classList.remove('active');
                dot.setAttribute('aria-pressed', 'false');
            }
        });

        // Update Unicode display if enabled
        if (this.options.showUnicode) {
            const unicodeDisplay = this.container.querySelector('.unicode-display');
            if (unicodeDisplay && typeof Braille8DotUnicode !== 'undefined') {
                const converter = new Braille8DotUnicode();
                this.unicode = converter.dotsToUnicode(this.activeDots);
                unicodeDisplay.textContent = this.unicode;
            }
        }
    }

    /**
     * Trigger onChange callback
     */
    triggerChange() {
        if (this.callbacks.onChange) {
            this.callbacks.onChange({
                dots: this.activeDots,
                unicode: this.unicode,
                dotCount: this.activeDots.length
            });
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            dots: [...this.activeDots],
            unicode: this.unicode,
            dotCount: this.activeDots.length
        };
    }

    /**
     * Switch between 6-dot and 8-dot modes
     */
    setMode(mode) {
        if (mode !== '6dot' && mode !== '8dot') {
            throw new Error('Mode must be "6dot" or "8dot"');
        }

        this.options.mode = mode;
        
        // Remove dots 7-8 if switching to 6-dot
        if (mode === '6dot') {
            this.activeDots = this.activeDots.filter(dot => dot <= 6);
        }
        
        this.render();
        if (this.options.interactive) {
            this.attachEventListeners();
        }
    }

    /**
     * Animate dot activation
     */
    animateDots(sequence = 'sequential', duration = 100) {
        const dots = this.container.querySelectorAll('.dot');
        
        if (sequence === 'sequential') {
            this.activeDots.forEach((dotNum, index) => {
                setTimeout(() => {
                    const dot = this.container.querySelector(`[data-dot="${dotNum}"]`);
                    if (dot) {
                        dot.classList.add('animate-pulse');
                        setTimeout(() => dot.classList.remove('animate-pulse'), 300);
                    }
                }, index * duration);
            });
        } else if (sequence === 'simultaneous') {
            this.activeDots.forEach(dotNum => {
                const dot = this.container.querySelector(`[data-dot="${dotNum}"]`);
                if (dot) {
                    dot.classList.add('animate-pulse');
                    setTimeout(() => dot.classList.remove('animate-pulse'), 300);
                }
            });
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.container.innerHTML = '';
        this.activeDots = [];
        this.callbacks = {};
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Braille8DotCell;
}
