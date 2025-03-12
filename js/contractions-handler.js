/**
 * BrailleBuddy Contractions Handler
 * 
 * This module handles the UI interactions for the contractions section,
 * including displaying contractions, filtering by category, and providing
 * visual and haptic feedback.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if brailleContractions is available
    if (!window.brailleContractions) {
        console.error('Braille contractions module not loaded');
        return;
    }
    
    // DOM elements
    const contractionsGrid = document.querySelector('.contractions-grid');
    const gradeButtons = document.querySelectorAll('.grade-button');
    const categoryButtons = document.querySelectorAll('.category-button');
    const currentContraction = document.getElementById('current-contraction');
    const contractionDescription = document.getElementById('contraction-description');
    const contractionDots = Array.from({ length: 6 }, (_, i) => document.getElementById(`contraction-dot${i+1}`));
    
    // Current state
    let activeGrade = '2'; // Default to Grade 2
    let activeCategory = 'two-letter'; // Default to two-letter contractions
    
    // Initialize contractions display
    initializeContractions();
    
    /**
     * Initialize the contractions grid and event listeners
     */
    function initializeContractions() {
        // Set up grade buttons
        gradeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const grade = this.getAttribute('data-grade');
                setActiveGrade(grade);
            });
        });
        
        // Set up category buttons
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                setActiveCategory(category);
            });
        });
        
        // Initial display
        populateContractionsGrid();
    }
    
    /**
     * Set the active grade and update UI
     * @param {string} grade - The grade to set active ('1' or '2')
     */
    function setActiveGrade(grade) {
        activeGrade = grade;
        
        // Update button states
        gradeButtons.forEach(button => {
            if (button.getAttribute('data-grade') === grade) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update grid
        populateContractionsGrid();
    }
    
    /**
     * Set the active category and update UI
     * @param {string} category - The category to set active
     */
    function setActiveCategory(category) {
        activeCategory = category;
        
        // Update button states
        categoryButtons.forEach(button => {
            if (button.getAttribute('data-category') === category) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update grid
        populateContractionsGrid();
    }
    
    /**
     * Populate the contractions grid based on active grade and category
     */
    function populateContractionsGrid() {
        // Clear existing grid
        contractionsGrid.innerHTML = '';
        
        // If Grade 1 is selected, show a message
        if (activeGrade === '1') {
            const message = document.createElement('div');
            message.className = 'contractions-message';
            message.innerHTML = `
                <h3>Grade 1 Braille</h3>
                <p>Grade 1 Braille is uncontracted, meaning each letter is represented by its own braille character.</p>
                <p>To learn Grade 1 Braille, visit the <a href="#" data-section="learn">Learn</a> section.</p>
            `;
            contractionsGrid.appendChild(message);
            
            // Add click event to the link
            message.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelector('nav a[data-section="learn"]').click();
            });
            
            return;
        }
        
        // Get contractions based on category
        let contractions = [];
        switch (activeCategory) {
            case 'two-letter':
                contractions = Object.keys(window.brailleContractions.getTwoLetterContractions());
                break;
            case 'whole-word':
                contractions = Object.keys(window.brailleContractions.getWholeWordContractions());
                break;
            case 'partial':
                // For partial contractions, we need to handle them differently
                contractions = Object.keys(window.brailleContractions.partialContractions || {});
                break;
            case 'prefix-suffix':
                // Combine prefix and suffix contractions
                contractions = [
                    ...Object.keys(window.brailleContractions.prefixContractions || {}),
                    ...Object.keys(window.brailleContractions.suffixContractions || {})
                ];
                break;
        }
        
        // Create contraction elements
        contractions.forEach(contraction => {
            const contractionElement = document.createElement('div');
            contractionElement.className = 'contraction-item';
            contractionElement.setAttribute('data-contraction', contraction);
            
            // Add type badge based on category
            let typeBadge = '';
            switch (activeCategory) {
                case 'two-letter':
                    typeBadge = 'Two-Letter';
                    break;
                case 'whole-word':
                    typeBadge = 'Word';
                    break;
                case 'partial':
                    typeBadge = 'Partial';
                    break;
                case 'prefix-suffix':
                    // Determine if it's a prefix or suffix
                    if (window.brailleContractions.prefixContractions && 
                        contraction in window.brailleContractions.prefixContractions) {
                        typeBadge = 'Prefix';
                    } else {
                        typeBadge = 'Suffix';
                    }
                    break;
            }
            
            // Create the contraction element content
            contractionElement.innerHTML = `
                <span class="contraction-type">${typeBadge}</span>
                <span class="contraction-text">${contraction}</span>
            `;
            
            // Add click event
            contractionElement.addEventListener('click', () => {
                document.querySelectorAll('.contraction-item').forEach(el => {
                    el.classList.remove('active');
                });
                contractionElement.classList.add('active');
                displayBrailleContraction(contraction);
            });
            
            contractionsGrid.appendChild(contractionElement);
        });
        
        // If no contractions found, show a message
        if (contractions.length === 0) {
            const message = document.createElement('div');
            message.className = 'contractions-message';
            message.innerHTML = `<p>No contractions available for this category.</p>`;
            contractionsGrid.appendChild(message);
        }
    }
    
    /**
     * Display braille representation of a contraction
     * @param {string} contraction - The contraction to display
     */
    function displayBrailleContraction(contraction) {
        // Get the pattern for this contraction
        const pattern = window.brailleContractions.getContractionPattern(contraction);
        
        if (!pattern) {
            console.error(`No pattern found for contraction: ${contraction}`);
            return;
        }
        
        // Update dots
        contractionDots.forEach((dot, index) => {
            if (pattern[index] === 1) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Update info
        currentContraction.textContent = contraction;
        contractionDescription.textContent = window.brailleContractions.getContractionDescription(contraction);
        
        // Provide haptic feedback for the contraction
        if (window.hapticFeedback && 
            window.progressTracker && 
            window.progressTracker.userData.settings.hapticFeedback !== false) {
            window.hapticFeedback.provideFeedback(contraction);
        }
        
        // Record that this contraction has been learned
        if (window.brailleContractions) {
            window.brailleContractions.recordContractionLearned(contraction);
        }
        
        // Record progress if progress tracker is available
        if (window.progressTracker) {
            progressTracker.recordContractionLearned(contraction);
            if (typeof checkForNewAchievements === 'function') {
                checkForNewAchievements();
            }
        }
    }
    
    // Add click event for contractions section link in Grade 1 message
    document.addEventListener('click', function(e) {
        if (e.target.matches('a[data-section]')) {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            document.querySelector(`nav a[data-section="${section}"]`).click();
        }
    });
});
