/**
 * Custom Browser Fingerprinting Solution
 * 
 * This module provides a custom implementation for browser fingerprinting
 * without relying on external APIs. It collects various browser attributes
 * and creates a unique hash to identify users while respecting privacy.
 */

import CryptoJS from 'crypto-js';

interface FingerprintOptions {
  enableWebGL?: boolean;
  enableCanvas?: boolean;
  enableAudio?: boolean;
  enableFonts?: boolean;
  hashAlgorithm?: string;
  storageKey?: string;
}

interface FingerprintComponents {
  userAgent: string;
  language: string;
  colorDepth: number;
  deviceMemory?: number;
  hardwareConcurrency: number;
  screenResolution: string;
  availableScreenResolution: string;
  timezoneOffset: number;
  timezone: string;
  sessionStorage: boolean;
  localStorage: boolean;
  indexedDb: boolean;
  plugins: string;
  canvas?: string;
  webgl?: string;
  webglVendor?: string;
  webglRenderer?: string;
  audioFingerprint?: string;
  fonts?: string[];
}

/**
 * BrailleBuddy custom fingerprinting solution
 * Creates a unique identifier for users based on browser characteristics
 * without collecting personally identifiable information
 */
export class CustomFingerprint {
  private options: FingerprintOptions;
  private components: FingerprintComponents | null = null;
  private fingerprint: string | null = null;
  
  constructor(options: FingerprintOptions = {}) {
    this.options = {
      enableWebGL: options.enableWebGL ?? true,
      enableCanvas: options.enableCanvas ?? true,
      enableAudio: options.enableAudio ?? false, // Disabled by default for performance
      enableFonts: options.enableFonts ?? false, // Disabled by default for performance
      hashAlgorithm: options.hashAlgorithm ?? 'sha256',
      storageKey: options.storageKey ?? 'braille_buddy_fingerprint'
    };
  }
  
  /**
   * Get or generate a fingerprint for the current browser
   */
  async getFingerprint(): Promise<string> {
    // Check if we already have a fingerprint
    if (this.fingerprint) {
      return this.fingerprint;
    }
    
    // Check if we have a stored fingerprint
    const storedFingerprint = this.getStoredFingerprint();
    if (storedFingerprint) {
      this.fingerprint = storedFingerprint;
      return storedFingerprint;
    }
    
    // Generate a new fingerprint
    await this.collectComponents();
    this.fingerprint = this.generateHash();
    
    // Store the fingerprint
    this.storeFingerprint(this.fingerprint);
    
    return this.fingerprint;
  }
  
  /**
   * Collect browser components for fingerprinting
   */
  private async collectComponents(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('CustomFingerprint can only be used in browser environments');
    }
    
    const nav = window.navigator;
    const screen = window.screen;
    
    // Basic components available in all browsers
    this.components = {
      userAgent: nav.userAgent,
      language: nav.language,
      colorDepth: screen.colorDepth,
      deviceMemory: (nav as any).deviceMemory,
      hardwareConcurrency: nav.hardwareConcurrency || 1,
      screenResolution: `${screen.width}x${screen.height}`,
      availableScreenResolution: `${screen.availWidth}x${screen.availHeight}`,
      timezoneOffset: new Date().getTimezoneOffset(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sessionStorage: !!window.sessionStorage,
      localStorage: !!window.localStorage,
      indexedDb: !!window.indexedDB,
      plugins: this.getPluginsString()
    };
    
    // Optional components based on configuration
    if (this.options.enableCanvas) {
      this.components.canvas = await this.getCanvasFingerprint();
    }
    
    if (this.options.enableWebGL) {
      const webglData = this.getWebGLFingerprint();
      this.components.webgl = webglData.webgl;
      this.components.webglVendor = webglData.vendor;
      this.components.webglRenderer = webglData.renderer;
    }
    
    if (this.options.enableAudio) {
      this.components.audioFingerprint = await this.getAudioFingerprint();
    }
    
    if (this.options.enableFonts) {
      this.components.fonts = await this.getFontsFingerprint();
    }
  }
  
  /**
   * Get a string representation of browser plugins
   */
  private getPluginsString(): string {
    if (!navigator.plugins) {
      return '';
    }
    
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push(plugin.name);
    }
    
    return plugins.sort().join(',');
  }
  
  /**
   * Get canvas fingerprint
   */
  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return '';
      }
      
      // Set canvas size
      canvas.width = 200;
      canvas.height = 50;
      
      // Draw background
      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.font = '18px Arial';
      ctx.textBaseline = 'top';
      ctx.fillText('BrailleBuddy 👋', 10, 10);
      
      // Draw shapes
      ctx.fillStyle = 'rgb(255, 0, 0)';
      ctx.beginPath();
      ctx.arc(50, 30, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Get canvas data
      return canvas.toDataURL();
    } catch (e) {
      return '';
    }
  }
  
  /**
   * Get WebGL fingerprint
   */
  private getWebGLFingerprint(): { webgl: string, vendor: string, renderer: string } {
    try {
      const canvas = document.createElement('canvas');
      // Use type assertion to specify WebGLRenderingContext
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null || 
                canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      
      if (!gl) {
        return { webgl: '', vendor: '', renderer: '' };
      }
      
      const vendor = gl.getParameter(gl.VENDOR);
      const renderer = gl.getParameter(gl.RENDERER);
      
      // Get WebGL supported extensions
      const extensions = gl.getSupportedExtensions() || [];
      
      return {
        webgl: extensions.join(','),
        vendor: vendor || '',
        renderer: renderer || ''
      };
    } catch (e) {
      return { webgl: '', vendor: '', renderer: '' };
    }
  }
  
  /**
   * Get audio fingerprint
   */
  private async getAudioFingerprint(): Promise<string> {
    try {
      if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
        return '';
      }
      
      const audioContext = new (AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const oscillator = audioContext.createOscillator();
      const dynamicsCompressor = audioContext.createDynamicsCompressor();
      
      // Connect nodes
      oscillator.connect(dynamicsCompressor);
      dynamicsCompressor.connect(analyser);
      analyser.connect(audioContext.destination);
      
      // Set properties
      oscillator.type = 'triangle';
      oscillator.frequency.value = 440;
      
      // Start oscillator
      oscillator.start(0);
      
      // Get frequency data
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);
      
      // Stop oscillator
      oscillator.stop(0);
      
      // Close audio context
      if (audioContext.close) {
        await audioContext.close();
      }
      
      return Array.from(frequencyData).join(',');
    } catch (e) {
      return '';
    }
  }
  
  /**
   * Get fonts fingerprint
   */
  private async getFontsFingerprint(): Promise<string[]> {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const fontList = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Cambria Math',
      'Comic Sans MS', 'Courier', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
      'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype',
      'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana'
    ];
    
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const h = document.getElementsByTagName('body')[0];
    
    // Create a span to test fonts
    const s = document.createElement('span');
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    
    // Create spans for base fonts
    const defaultWidth: Record<string, number> = {};
    const defaultHeight: Record<string, number> = {};
    
    for (const baseFont of baseFonts) {
      s.style.fontFamily = baseFont;
      h.appendChild(s);
      defaultWidth[baseFont] = s.offsetWidth;
      defaultHeight[baseFont] = s.offsetHeight;
      h.removeChild(s);
    }
    
    // Check available fonts
    const available: string[] = [];
    for (const font of fontList) {
      let detected = false;
      for (const baseFont of baseFonts) {
        s.style.fontFamily = `${font},${baseFont}`;
        h.appendChild(s);
        
        const match = (
          s.offsetWidth !== defaultWidth[baseFont] ||
          s.offsetHeight !== defaultHeight[baseFont]
        );
        
        h.removeChild(s);
        
        if (match) {
          detected = true;
          break;
        }
      }
      
      if (detected) {
        available.push(font);
      }
    }
    
    return available;
  }
  
  /**
   * Generate a hash from the collected components
   */
  private generateHash(): string {
    if (!this.components) {
      throw new Error('Components not collected');
    }
    
    const json = JSON.stringify(this.components);
    // Use CryptoJS for browser compatibility
    let hashOutput;
    
    switch (this.options.hashAlgorithm) {
      case 'sha256':
        hashOutput = CryptoJS.SHA256(json);
        break;
      case 'sha1':
        hashOutput = CryptoJS.SHA1(json);
        break;
      case 'md5':
        hashOutput = CryptoJS.MD5(json);
        break;
      default:
        hashOutput = CryptoJS.SHA256(json);
    }
    
    return hashOutput.toString(CryptoJS.enc.Hex);
  }
  
  /**
   * Store fingerprint in localStorage
   */
  private storeFingerprint(fingerprint: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(this.options.storageKey as string, fingerprint);
      } catch (e) {
        // localStorage might be disabled or full
      }
    }
  }
  
  /**
   * Get stored fingerprint from localStorage
   */
  private getStoredFingerprint(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(this.options.storageKey as string);
      } catch (e) {
        // localStorage might be disabled
        return null;
      }
    }
    return null;
  }
  
  /**
   * Clear stored fingerprint
   */
  public clearStoredFingerprint(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(this.options.storageKey as string);
      } catch (e) {
        // localStorage might be disabled
      }
    }
    this.fingerprint = null;
  }
}

/**
 * Create and get a fingerprint with default options
 */
export async function getFingerprint(): Promise<string> {
  const fingerprinter = new CustomFingerprint();
  return fingerprinter.getFingerprint();
}

/**
 * Create and get a fingerprint with custom options
 */
export async function getFingerprintWithOptions(options: FingerprintOptions): Promise<string> {
  const fingerprinter = new CustomFingerprint(options);
  return fingerprinter.getFingerprint();
}
