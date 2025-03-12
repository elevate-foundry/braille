/**
 * BrailleBuddy Mobile Optimization
 * 
 * This module provides mobile-specific enhancements:
 * 1. Touch gesture support for braille interaction
 * 2. Mobile UI optimizations
 * 3. Device orientation handling
 * 4. Bluetooth hardware connectivity preparation
 */

class MobileOptimization {
    constructor() {
        // Check if touch is supported
        this.isTouchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check if mobile device
        this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Mobile UI state
        this.uiState = {
            fullscreen: false,
            orientation: window.orientation || 0,
            touchZones: []
        };
        
        // Bluetooth connection state
        this.bluetoothState = {
            available: 'bluetooth' in navigator,
            connected: false,
            device: null,
            characteristics: {}
        };
        
        // Initialize if on mobile device
        if (this.isMobileDevice) {
            this.initializeMobileOptimizations();
        }
    }
    
    /**
     * Initialize mobile optimizations
     */
    initializeMobileOptimizations() {
        // Add mobile-specific CSS class to body
        document.body.classList.add('mobile-device');
        
        // Add viewport meta tag if not present
        this.ensureViewportMeta();
        
        // Set up orientation change listener
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
        
        // Set up touch gesture handlers
        this.setupTouchGestures();
        
        // Initialize touch zones for braille input
        this.initializeTouchZones();
        
        // Add fullscreen toggle button
        this.addFullscreenButton();
        
        console.log('Mobile optimizations initialized');
    }
    
    /**
     * Ensure viewport meta tag is present
     */
    ensureViewportMeta() {
        if (!document.querySelector('meta[name="viewport"]')) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
        }
    }
    
    /**
     * Handle device orientation change
     */
    handleOrientationChange() {
        this.uiState.orientation = window.orientation || 0;
        
        // Reinitialize touch zones based on new orientation
        this.initializeTouchZones();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('braille-orientation-change', { 
            detail: { orientation: this.uiState.orientation } 
        }));
    }
    
    /**
     * Set up touch gesture handlers
     */
    setupTouchGestures() {
        if (!this.isTouchSupported) return;
        
        // Swipe detection
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, false);
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY);
        }, false);
        
        // Prevent zoom on double tap
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        });
    }
    
    /**
     * Handle swipe gestures
     */
    handleSwipeGesture(startX, startY, endX, endY) {
        const minDistance = 50; // Minimum distance for a swipe
        
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minDistance) {
                if (deltaX > 0) {
                    // Right swipe
                    this.handleRightSwipe();
                } else {
                    // Left swipe
                    this.handleLeftSwipe();
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minDistance) {
                if (deltaY > 0) {
                    // Down swipe
                    this.handleDownSwipe();
                } else {
                    // Up swipe
                    this.handleUpSwipe();
                }
            }
        }
    }
    
    /**
     * Handle right swipe
     */
    handleRightSwipe() {
        // Navigate to next section
        const navLinks = document.querySelectorAll('nav a');
        const activeLink = document.querySelector('nav a.active');
        
        if (activeLink) {
            const activeIndex = Array.from(navLinks).indexOf(activeLink);
            const nextIndex = (activeIndex + 1) % navLinks.length;
            navLinks[nextIndex].click();
        }
    }
    
    /**
     * Handle left swipe
     */
    handleLeftSwipe() {
        // Navigate to previous section
        const navLinks = document.querySelectorAll('nav a');
        const activeLink = document.querySelector('nav a.active');
        
        if (activeLink) {
            const activeIndex = Array.from(navLinks).indexOf(activeLink);
            const prevIndex = (activeIndex - 1 + navLinks.length) % navLinks.length;
            navLinks[prevIndex].click();
        }
    }
    
    /**
     * Handle up swipe
     */
    handleUpSwipe() {
        // Toggle fullscreen
        this.toggleFullscreen();
    }
    
    /**
     * Handle down swipe
     */
    handleDownSwipe() {
        // Open settings
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.style.display = 'block';
        }
    }
    
    /**
     * Initialize touch zones for braille input
     */
    initializeTouchZones() {
        // Clear existing touch zones
        this.uiState.touchZones = [];
        
        // Get screen dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Create touch zones for 6-dot braille input
        // Layout depends on orientation
        if (this.uiState.orientation === 0 || this.uiState.orientation === 180) {
            // Portrait orientation - 3x2 grid
            const zoneWidth = screenWidth / 2;
            const zoneHeight = screenHeight / 3;
            
            // Left column (dots 1, 2, 3)
            this.uiState.touchZones.push({
                id: 'dot1',
                x: 0,
                y: 0,
                width: zoneWidth,
                height: zoneHeight
            });
            
            this.uiState.touchZones.push({
                id: 'dot2',
                x: 0,
                y: zoneHeight,
                width: zoneWidth,
                height: zoneHeight
            });
            
            this.uiState.touchZones.push({
                id: 'dot3',
                x: 0,
                y: zoneHeight * 2,
                width: zoneWidth,
                height: zoneHeight
            });
            
            // Right column (dots 4, 5, 6)
            this.uiState.touchZones.push({
                id: 'dot4',
                x: zoneWidth,
                y: 0,
                width: zoneWidth,
                height: zoneHeight
            });
            
            this.uiState.touchZones.push({
                id: 'dot5',
                x: zoneWidth,
                y: zoneHeight,
                width: zoneWidth,
                height: zoneHeight
            });
            
            this.uiState.touchZones.push({
                id: 'dot6',
                x: zoneWidth,
                y: zoneHeight * 2,
                width: zoneWidth,
                height: zoneHeight
            });
        } else {
            // Landscape orientation - 2x3 grid
            const zoneWidth = screenWidth / 3;
            const zoneHeight = screenHeight / 2;
            
            // Top row (dots 1, 4)
            this.uiState.touchZones.push({
                id: 'dot1',
                x: 0,
                y: 0,
                width: zoneWidth,
                height: zoneHeight
            });
            
            this.uiState.touchZones.push({
                id: 'dot4',
                x: 0,
                y: zoneHeight,
                width: zoneWidth,
                height: zoneHeight
            });
            
            // Middle row (dots 2, 5)
            this.uiState.touchZones.push({
                id: 'dot2',
                x: zoneWidth,
                y: 0,
                width: zoneWidth,
                height: zoneHeight
            });
            
            this.uiState.touchZones.push({
                id: 'dot5',
                x: zoneWidth,
                y: zoneHeight,
                width: zoneWidth,
                height: zoneHeight
            });
            
            // Bottom row (dots 3, 6)
            this.uiState.touchZones.push({
                id: 'dot3',
                x: zoneWidth * 2,
                y: 0,
                width: zoneWidth,
                height: zoneHeight
            });
            
            this.uiState.touchZones.push({
                id: 'dot6',
                x: zoneWidth * 2,
                y: zoneHeight,
                width: zoneWidth,
                height: zoneHeight
            });
        }
    }
    
    /**
     * Add fullscreen toggle button
     */
    addFullscreenButton() {
        // Check if fullscreen is supported
        if (!document.fullscreenEnabled && 
            !document.webkitFullscreenEnabled && 
            !document.mozFullScreenEnabled && 
            !document.msFullscreenEnabled) {
            return;
        }
        
        // Create fullscreen button
        const fullscreenButton = document.createElement('button');
        fullscreenButton.id = 'fullscreen-toggle';
        fullscreenButton.className = 'fullscreen-button';
        fullscreenButton.innerHTML = '<span>⛶</span>';
        fullscreenButton.setAttribute('aria-label', 'Toggle fullscreen');
        
        // Add click event
        fullscreenButton.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Add to document
        document.body.appendChild(fullscreenButton);
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {
            // Enter fullscreen
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
            this.uiState.fullscreen = true;
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.uiState.fullscreen = false;
        }
    }
    
    /**
     * Initialize Bluetooth connectivity for future hardware integration
     */
    async initializeBluetooth() {
        if (!this.bluetoothState.available) {
            console.log('Bluetooth API not available on this device');
            return false;
        }
        
        try {
            // Request device with specific service
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['battery_service'] } // Example service, replace with your device's service
                ]
            });
            
            this.bluetoothState.device = device;
            
            // Set up disconnect listener
            device.addEventListener('gattserverdisconnected', () => {
                this.bluetoothState.connected = false;
                console.log('Bluetooth device disconnected');
                
                // Dispatch event
                window.dispatchEvent(new CustomEvent('braille-bluetooth-disconnected'));
            });
            
            // Connect to GATT server
            const server = await device.gatt.connect();
            
            // Get service
            const service = await server.getPrimaryService('battery_service');
            
            // Get characteristic
            const characteristic = await service.getCharacteristic('battery_level');
            
            // Store characteristic
            this.bluetoothState.characteristics.batteryLevel = characteristic;
            this.bluetoothState.connected = true;
            
            console.log('Bluetooth device connected');
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('braille-bluetooth-connected', {
                detail: { device: device.name }
            }));
            
            return true;
        } catch (error) {
            console.error('Bluetooth connection error:', error);
            return false;
        }
    }
    
    /**
     * Send data to Bluetooth device
     */
    async sendBluetoothData(characteristicName, data) {
        if (!this.bluetoothState.connected || !this.bluetoothState.characteristics[characteristicName]) {
            return false;
        }
        
        try {
            await this.bluetoothState.characteristics[characteristicName].writeValue(data);
            return true;
        } catch (error) {
            console.error('Error sending data to Bluetooth device:', error);
            return false;
        }
    }
    
    /**
     * Check if device is mobile
     */
    isMobile() {
        return this.isMobileDevice;
    }
    
    /**
     * Check if touch is supported
     */
    isTouch() {
        return this.isTouchSupported;
    }
    
    /**
     * Get the current touch zones
     */
    getTouchZones() {
        return this.uiState.touchZones;
    }
    
    /**
     * Check if a point is within a touch zone
     */
    getTouchZoneAtPoint(x, y) {
        for (const zone of this.uiState.touchZones) {
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                return zone;
            }
        }
        return null;
    }
}

// Initialize mobile optimization if window is loaded
if (typeof window !== 'undefined') {
    window.mobileOptimization = new MobileOptimization();
}
