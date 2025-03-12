// URL Parameter Handler for PWA Shortcuts
document.addEventListener('DOMContentLoaded', () => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    
    // If a section parameter is present, navigate to that section
    if (section) {
        const validSections = ['learn', 'contractions', 'practice', 'games', 'about'];
        
        if (validSections.includes(section)) {
            // Find the section link and click it
            const sectionLink = document.querySelector(`a[data-section="${section}"]`);
            if (sectionLink) {
                // Slight delay to ensure the page is fully loaded
                setTimeout(() => {
                    sectionLink.click();
                }, 100);
            }
        }
    }
});
