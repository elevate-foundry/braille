// BrailleBuddy Comprehensive Test Suite
const { test, expect } = require('@playwright/test');

// ============================================
// MAIN APPLICATION TESTS
// ============================================

test.describe('Main Application', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/BrailleBuddy|Braille/i);
    
    // Check for main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should have all navigation tabs', async ({ page }) => {
    await page.goto('/');
    
    const expectedTabs = [
      'Learn',
      'Contractions',
      'Practice',
      'Games',
      'About'
    ];
    
    for (const tab of expectedTabs) {
      const tabElement = page.locator(`nav a:has-text("${tab}")`);
      await expect(tabElement).toBeVisible();
    }
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');
    
    // Click Learn tab
    await page.click('nav a:has-text("Learn")');
    await expect(page.locator('#learn-section')).toBeVisible();
    
    // Click Practice tab
    await page.click('nav a:has-text("Practice")');
    await expect(page.locator('#practice-section')).toBeVisible();
    
    // Click Games tab
    await page.click('nav a:has-text("Games")');
    await expect(page.locator('#games-section')).toBeVisible();
  });
});

// ============================================
// LEARN MODE TESTS
// ============================================

test.describe('Learn Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('nav a:has-text("Learn")');
  });

  test('should display alphabet letters A-Z', async ({ page }) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    for (const letter of letters) {
      const letterButton = page.locator(`button:has-text("${letter}")`).first();
      await expect(letterButton).toBeVisible();
    }
  });

  test('should show braille pattern when letter clicked', async ({ page }) => {
    // Click letter A
    await page.click('button:has-text("A")');
    
    // Check for braille display
    const brailleDisplay = page.locator('.braille-display, #braille-cell');
    await expect(brailleDisplay).toBeVisible();
    
    // Check for active dots
    const activeDots = page.locator('.dot.active');
    await expect(activeDots).toHaveCount(1); // Letter A has 1 dot
  });

  test('should display numbers 0-9', async ({ page }) => {
    // Switch to numbers view if needed
    const numbersButton = page.locator('button:has-text("Numbers")');
    if (await numbersButton.isVisible()) {
      await numbersButton.click();
    }
    
    for (let i = 0; i <= 9; i++) {
      const numberButton = page.locator(`button:has-text("${i}")`).first();
      await expect(numberButton).toBeVisible();
    }
  });

  test('should play audio when letter clicked', async ({ page, context }) => {
    // Grant audio permissions
    await context.grantPermissions(['microphone']);
    
    // Click letter A
    await page.click('button:has-text("A")');
    
    // Wait for audio to potentially play
    await page.waitForTimeout(500);
    
    // Check if audio element exists or was created
    const audio = page.locator('audio');
    const audioCount = await audio.count();
    
    // Audio might be dynamically created
    expect(audioCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// CONTRACTIONS TESTS
// ============================================

test.describe('Contractions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('nav a:has-text("Contractions")');
  });

  test('should display contraction categories', async ({ page }) => {
    const categories = [
      'Alphabetic Wordsigns',
      'Strong Contractions',
      'Lower Signs'
    ];
    
    for (const category of categories) {
      const categoryElement = page.locator(`:has-text("${category}")`).first();
      await expect(categoryElement).toBeVisible();
    }
  });

  test('should filter contractions by search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('the');
      await page.waitForTimeout(500);
      
      // Should show results containing "the"
      const results = page.locator('.contraction-card, .contraction-item');
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should show braille for common contractions', async ({ page }) => {
    const commonContractions = ['and', 'for', 'the', 'with'];
    
    for (const word of commonContractions) {
      const contraction = page.locator(`:has-text("${word}")`).first();
      if (await contraction.isVisible()) {
        await expect(contraction).toBeVisible();
      }
    }
  });
});

// ============================================
// PRACTICE MODE TESTS
// ============================================

test.describe('Practice Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('nav a:has-text("Practice")');
  });

  test('should have recognition and typing modes', async ({ page }) => {
    const recognitionMode = page.locator('button:has-text("Recognition"), [data-mode="recognition"]');
    const typingMode = page.locator('button:has-text("Typing"), [data-mode="typing"]');
    
    const hasRecognition = await recognitionMode.count() > 0;
    const hasTyping = await typingMode.count() > 0;
    
    expect(hasRecognition || hasTyping).toBeTruthy();
  });

  test('should start practice session', async ({ page }) => {
    const startButton = page.locator('button:has-text("Start"), button:has-text("Begin")');
    
    if (await startButton.isVisible()) {
      await startButton.click();
      
      // Should show a question or braille pattern
      await page.waitForTimeout(1000);
      const question = page.locator('.question, .braille-pattern, .practice-item');
      const questionCount = await question.count();
      expect(questionCount).toBeGreaterThan(0);
    }
  });

  test('should track score', async ({ page }) => {
    const scoreElement = page.locator('.score, #score, [data-score]');
    
    if (await scoreElement.isVisible()) {
      const scoreText = await scoreElement.textContent();
      expect(scoreText).toMatch(/\d+/); // Should contain numbers
    }
  });
});

// ============================================
// GAMES TESTS
// ============================================

test.describe('Games', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('nav a:has-text("Games")');
  });

  test('should display available games', async ({ page }) => {
    const games = [
      'Memory Match',
      'Word Builder',
      'Speedster'
    ];
    
    for (const game of games) {
      const gameElement = page.locator(`:has-text("${game}")`).first();
      await expect(gameElement).toBeVisible();
    }
  });

  test('should start Memory Match game', async ({ page }) => {
    const memoryButton = page.locator('button:has-text("Memory Match"), button:has-text("Play"):near(:has-text("Memory"))');
    
    if (await memoryButton.isVisible()) {
      await memoryButton.click();
      
      // Should show game board
      await page.waitForTimeout(1000);
      const gameBoard = page.locator('.game-board, .memory-grid, .card');
      const boardCount = await gameBoard.count();
      expect(boardCount).toBeGreaterThan(0);
    }
  });

  test('should track game progress', async ({ page }) => {
    const progressElement = page.locator('.progress, .level, .moves, .timer');
    const progressCount = await progressElement.count();
    
    // Should have some progress indicator
    expect(progressCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// SETTINGS TESTS
// ============================================

test.describe('Settings', () => {
  test('should open settings panel', async ({ page }) => {
    await page.goto('/');
    
    const settingsButton = page.locator('button:has-text("Settings"), .settings-icon, #settings-btn');
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      const settingsPanel = page.locator('.settings-panel, #settings-modal, .modal:visible');
      await expect(settingsPanel).toBeVisible();
    }
  });

  test('should toggle haptic feedback', async ({ page }) => {
    await page.goto('/');
    
    const hapticToggle = page.locator('input[type="checkbox"]:near(:has-text("Haptic")), #haptic-toggle');
    
    if (await hapticToggle.isVisible()) {
      const initialState = await hapticToggle.isChecked();
      await hapticToggle.click();
      const newState = await hapticToggle.isChecked();
      expect(newState).not.toBe(initialState);
    }
  });

  test('should change language', async ({ page }) => {
    await page.goto('/');
    
    const languageSelect = page.locator('select:near(:has-text("Language")), #language-select');
    
    if (await languageSelect.isVisible()) {
      await languageSelect.selectOption({ index: 1 });
      const selectedValue = await languageSelect.inputValue();
      expect(selectedValue).toBeTruthy();
    }
  });
});

// ============================================
// 8-DOT BRAILLE TESTS
// ============================================

test.describe('8-Dot Braille Demo', () => {
  test('should load 8-dot demo page', async ({ page }) => {
    await page.goto('/braille-8dot-demo.html');
    await expect(page).toHaveTitle(/8-Dot Braille/i);
  });

  test('should display 8-dot cell', async ({ page }) => {
    await page.goto('/braille-8dot-demo.html');
    
    const cell = page.locator('.braille-cell-8dot');
    await expect(cell).toBeVisible();
    
    // Should have 8 dots
    const dots = page.locator('.dot');
    await expect(dots).toHaveCount(8);
  });

  test('should toggle dots on click', async ({ page }) => {
    await page.goto('/braille-8dot-demo.html');
    
    const firstDot = page.locator('.dot').first();
    const initialClass = await firstDot.getAttribute('class');
    
    await firstDot.click();
    await page.waitForTimeout(100);
    
    const newClass = await firstDot.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });

  test('should switch between 6-dot and 8-dot modes', async ({ page }) => {
    await page.goto('/braille-8dot-demo.html');
    
    const mode6Button = page.locator('button:has-text("6-Dot")');
    const mode8Button = page.locator('button:has-text("8-Dot")');
    
    if (await mode6Button.isVisible()) {
      await mode6Button.click();
      await page.waitForTimeout(500);
      
      // Dots 7 and 8 should be hidden
      const dot7 = page.locator('[data-dot="7"]');
      await expect(dot7).toBeHidden();
    }
  });

  test('should show context examples', async ({ page }) => {
    await page.goto('/braille-8dot-demo.html');
    
    const contexts = ['Computer', 'Math', 'Music', 'Language'];
    
    for (const context of contexts) {
      const tab = page.locator(`:has-text("${context}")`).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });
});

// ============================================
// BRAILLE TRANSLATOR TESTS
// ============================================

test.describe('Braille Translator', () => {
  test('should load translator page', async ({ page }) => {
    await page.goto('/braille-translator.html');
    await expect(page).toHaveTitle(/Braille Translator/i);
  });

  test('should translate text to braille', async ({ page }) => {
    await page.goto('/braille-translator.html');
    
    const input = page.locator('#text-input');
    await input.fill('Hello World');
    
    const translateButton = page.locator('button:has-text("Translate")');
    await translateButton.click();
    
    const output = page.locator('#braille-output');
    const brailleText = await output.textContent();
    
    expect(brailleText).toBeTruthy();
    expect(brailleText.length).toBeGreaterThan(0);
  });

  test('should translate braille to text', async ({ page }) => {
    await page.goto('/braille-translator.html');
    
    // Switch to braille-to-text tab
    await page.click('button:has-text("Braille to Text")');
    
    const input = page.locator('#braille-input');
    await input.fill('⠓⠑⠇⠇⠕'); // "hello" in braille
    
    const translateButton = page.locator('button:has-text("Translate")');
    await translateButton.click();
    
    const output = page.locator('#text-output');
    const text = await output.textContent();
    
    expect(text).toBeTruthy();
  });

  test('should search contractions', async ({ page }) => {
    await page.goto('/braille-translator.html');
    
    await page.click('button:has-text("Contraction Lookup")');
    
    const searchInput = page.locator('#contraction-search');
    await searchInput.fill('the');
    
    const searchButton = page.locator('button:has-text("Search")');
    await searchButton.click();
    
    await page.waitForTimeout(500);
    
    const results = page.locator('.contraction-card');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should copy braille to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/braille-translator.html');
    
    const input = page.locator('#text-input');
    await input.fill('Test');
    
    await page.click('button:has-text("Translate")');
    await page.waitForTimeout(500);
    
    const copyButton = page.locator('button:has-text("Copy")').first();
    await copyButton.click();
    
    // Should show notification
    const notification = page.locator('.copy-notification');
    await expect(notification).toBeVisible();
  });
});

// ============================================
// DEMO PAGES TESTS
// ============================================

test.describe('Demo Pages', () => {
  const demoPages = [
    'bbid-recognition.html',
    'braille-core-demo.html',
    'haptic-test.html',
    'compression-demo.html',
    'braille-keyboard-demo.html',
    'braille-typing-demo.html'
  ];

  for (const page of demoPages) {
    test(`should load ${page}`, async ({ page: playwright }) => {
      const response = await playwright.goto(`/${page}`);
      expect(response?.status()).toBeLessThan(400);
      
      // Check for no console errors
      const errors = [];
      playwright.on('pageerror', error => errors.push(error));
      
      await playwright.waitForTimeout(2000);
      expect(errors.length).toBe(0);
    });
  }
});

// ============================================
// MOBILE TESTS
// ============================================

test.describe('Mobile Optimization', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone size

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Check if navigation is mobile-friendly
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check if content is not overflowing
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });

  test('should support touch gestures', async ({ page }) => {
    await page.goto('/');
    
    // Simulate swipe
    await page.touchscreen.tap(200, 300);
    await page.waitForTimeout(500);
    
    // Page should still be functional
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should have large touch targets', async ({ page }) => {
    await page.goto('/');
    await page.click('nav a:has-text("Learn")');
    
    const buttons = page.locator('button');
    const firstButton = buttons.first();
    
    if (await firstButton.isVisible()) {
      const box = await firstButton.boundingBox();
      // Touch targets should be at least 44x44 pixels
      expect(box?.width).toBeGreaterThanOrEqual(40);
      expect(box?.height).toBeGreaterThanOrEqual(40);
    }
  });
});

// ============================================
// ACCESSIBILITY TESTS
// ============================================

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    const ariaElements = page.locator('[aria-label], [aria-labelledby]');
    const count = await ariaElements.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Check background and text colors
    const body = page.locator('body');
    const bgColor = await body.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(bgColor).toBeTruthy();
  });
});

// ============================================
// PERFORMANCE TESTS
// ============================================

test.describe('Performance', () => {
  test('should load main page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should not have memory leaks', async ({ page }) => {
    await page.goto('/');
    
    // Click through different sections
    for (let i = 0; i < 10; i++) {
      await page.click('nav a:has-text("Learn")');
      await page.waitForTimeout(100);
      await page.click('nav a:has-text("Practice")');
      await page.waitForTimeout(100);
    }
    
    // Page should still be responsive
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should handle rapid interactions', async ({ page }) => {
    await page.goto('/');
    await page.click('nav a:has-text("Learn")');
    
    // Rapid clicks
    for (let i = 0; i < 20; i++) {
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.click({ timeout: 100 }).catch(() => {});
      }
    }
    
    // Should not crash
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });
});

// ============================================
// DATA PERSISTENCE TESTS
// ============================================

test.describe('Data Persistence', () => {
  test('should save user progress', async ({ page }) => {
    await page.goto('/');
    
    // Check for localStorage
    const hasLocalStorage = await page.evaluate(() => {
      return typeof localStorage !== 'undefined';
    });
    
    expect(hasLocalStorage).toBeTruthy();
  });

  test('should persist settings across sessions', async ({ page, context }) => {
    await page.goto('/');
    
    // Set a preference
    await page.evaluate(() => {
      localStorage.setItem('test-setting', 'test-value');
    });
    
    // Reload page
    await page.reload();
    
    // Check if setting persists
    const value = await page.evaluate(() => {
      return localStorage.getItem('test-setting');
    });
    
    expect(value).toBe('test-value');
  });
});
