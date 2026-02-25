# BrailleBuddy Test Suite

Comprehensive automated testing for BrailleBuddy using Playwright.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run install:playwright

# Run all tests
npm test
```

## Test Files

- **playwright.config.js** - Test configuration and browser setup
- **braille-buddy.spec.js** - Main test suite (46+ tests)

## Test Categories

### 1. Main Application (3 tests)
- Homepage loading
- Navigation tabs
- Tab switching

### 2. Learn Mode (4 tests)
- Alphabet display
- Number display
- Braille pattern rendering
- Audio playback

### 3. Contractions (3 tests)
- Category display
- Search functionality
- Braille rendering

### 4. Practice Mode (3 tests)
- Mode selection
- Session start
- Score tracking

### 5. Games (3 tests)
- Game availability
- Memory Match
- Progress tracking

### 6. Settings (3 tests)
- Settings panel
- Haptic toggle
- Language selection

### 7. 8-Dot Braille (5 tests)
- Demo page loading
- 8-dot cell display
- Dot toggling
- Mode switching
- Context examples

### 8. Braille Translator (5 tests)
- Text to braille
- Braille to text
- Contraction lookup
- Batch conversion
- Copy to clipboard

### 9. Demo Pages (6 tests)
- All demo pages load
- No console errors

### 10. Mobile (3 tests)
- Responsive design
- Touch gestures
- Touch target sizes

### 11. Accessibility (3 tests)
- ARIA labels
- Keyboard navigation
- Color contrast

### 12. Performance (3 tests)
- Page load time
- Memory management
- Rapid interactions

### 13. Data Persistence (2 tests)
- localStorage
- Settings persistence

## Browser Coverage

- ✅ Chromium (Desktop Chrome/Edge)
- ✅ Firefox (Desktop)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## Running Tests

### All Tests
```bash
npm test
```

### Specific Browser
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Mobile Only
```bash
npm run test:mobile
```

### Interactive UI Mode
```bash
npm run test:ui
```

### Debug Mode
```bash
npm run test:debug
```

### Headed Mode (See Browser)
```bash
npm run test:headed
```

### View Report
```bash
npm run test:report
```

## Test Results

Results are saved in:
- `test-results/` - Screenshots, videos, traces
- `test-results/html/` - HTML report
- `test-results/results.json` - JSON results

## Writing New Tests

```javascript
test('should do something', async ({ page }) => {
  await page.goto('/');
  
  // Your test code here
  const element = page.locator('#my-element');
  await expect(element).toBeVisible();
});
```

## Best Practices

1. **Use descriptive test names**
2. **Keep tests independent**
3. **Use proper selectors** (prefer data-testid)
4. **Wait for elements** (use await expect)
5. **Clean up after tests**
6. **Take screenshots on failure** (automatic)

## Troubleshooting

### Tests failing?
```bash
# Clear browser data
npx playwright clean

# Reinstall browsers
npx playwright install --force

# Check server
curl http://localhost:8000
```

### Need help?
- [Playwright Documentation](https://playwright.dev/)
- [Test Examples](./braille-buddy.spec.js)
- [TESTING-GUIDE.md](../TESTING-GUIDE.md)

## CI/CD Integration

Tests are configured to run in CI with:
- Retries on failure
- Parallel execution
- Artifact collection
- HTML reports

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure all tests pass
3. Add to appropriate test category
4. Update this README if needed

---

**Total Tests**: 46+  
**Browser Coverage**: 5 browsers  
**Last Updated**: October 10, 2025
