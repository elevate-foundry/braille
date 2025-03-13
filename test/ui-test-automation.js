// BBID UI Automated Testing Script
// This script uses Selenium WebDriver to test the BBID UI across different browsers

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const safari = require('selenium-webdriver/safari');
const edge = require('selenium-webdriver/edge');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'https://braillebuddy-q1yej25s0-elevate-foundry1s-projects.vercel.app',
  pages: {
    recognition: '/bbid-recognition.html',
    loginDemo: '/bbid-login-demo.html'
  },
  browsers: ['chrome', 'firefox', 'edge'],
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },
  screenshotDir: path.join(__dirname, 'screenshots')
};

// Ensure screenshot directory exists
if (!fs.existsSync(config.screenshotDir)) {
  fs.mkdirSync(config.screenshotDir, { recursive: true });
}

// Helper function to take screenshots
async function takeScreenshot(driver, name) {
  const screenshot = await driver.takeScreenshot();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${name}_${timestamp}.png`;
  fs.writeFileSync(path.join(config.screenshotDir, fileName), screenshot, 'base64');
  console.log(`Screenshot saved: ${fileName}`);
}

// Test suite for tabbed interface
async function testTabbedInterface(driver, device, browser, page) {
  console.log(`Testing tabbed interface on ${device} using ${browser} for ${page}`);
  
  try {
    // Navigate to the page
    await driver.get(`${config.baseUrl}${config.pages[page]}`);
    await driver.wait(until.elementLocated(By.css('.tab-button')), 10000);
    
    // Test each tab
    const tabs = await driver.findElements(By.css('.tab-button'));
    
    for (let i = 0; i < tabs.length; i++) {
      const tabName = await tabs[i].getText();
      console.log(`Testing tab: ${tabName}`);
      
      // Click on the tab
      await tabs[i].click();
      await driver.sleep(500); // Wait for animation
      
      // Verify tab is active
      const isActive = await tabs[i].getAttribute('class');
      if (isActive.includes('active')) {
        console.log(`✅ Tab ${tabName} is active`);
      } else {
        console.log(`❌ Tab ${tabName} is not active`);
      }
      
      // Verify tab content is visible
      const tabId = await tabs[i].getAttribute('data-tab');
      const tabContent = await driver.findElement(By.id(`${tabId}-tab`));
      const isDisplayed = await tabContent.isDisplayed();
      
      if (isDisplayed) {
        console.log(`✅ Tab content for ${tabName} is visible`);
      } else {
        console.log(`❌ Tab content for ${tabName} is not visible`);
      }
      
      // Take a screenshot
      await takeScreenshot(driver, `${page}_${device}_${browser}_${tabName}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error testing tabbed interface: ${error.message}`);
    await takeScreenshot(driver, `${page}_${device}_${browser}_error`);
    return false;
  }
}

// Test suite for responsive design
async function testResponsiveDesign(driver, device, browser, page) {
  console.log(`Testing responsive design on ${device} using ${browser} for ${page}`);
  
  try {
    // Navigate to the page
    await driver.get(`${config.baseUrl}${config.pages[page]}`);
    await driver.wait(until.elementLocated(By.css('.device-info')), 10000);
    
    // Check if all elements are properly displayed
    const elements = [
      '.device-info',
      '.fingerprint-display',
      '.tab-navigation',
      '.tab-content'
    ];
    
    for (const selector of elements) {
      try {
        const element = await driver.findElement(By.css(selector));
        const isDisplayed = await element.isDisplayed();
        
        if (isDisplayed) {
          console.log(`✅ Element ${selector} is properly displayed`);
        } else {
          console.log(`❌ Element ${selector} is not displayed`);
        }
      } catch (error) {
        console.log(`❌ Element ${selector} not found`);
      }
    }
    
    // Take a screenshot
    await takeScreenshot(driver, `${page}_${device}_${browser}_responsive`);
    
    return true;
  } catch (error) {
    console.error(`Error testing responsive design: ${error.message}`);
    await takeScreenshot(driver, `${page}_${device}_${browser}_responsive_error`);
    return false;
  }
}

// Test suite for behavioral tracking
async function testBehavioralTracking(driver, device, browser, page) {
  console.log(`Testing behavioral tracking on ${device} using ${browser} for ${page}`);
  
  try {
    // Navigate to the page
    await driver.get(`${config.baseUrl}${config.pages[page]}`);
    await driver.wait(until.elementLocated(By.css('.behavioral-tab')), 10000);
    
    // Click on the behavioral tab
    const behavioralTab = await driver.findElement(By.css('[data-tab="behavioral"]'));
    await behavioralTab.click();
    await driver.sleep(1000); // Wait for animation
    
    // Simulate user interactions to generate behavioral data
    
    // 1. Mouse movements
    const canvas = await driver.findElement(By.tagName('body'));
    const actions = driver.actions({ async: true });
    
    // Move the mouse in a pattern
    await actions.move({ origin: canvas }).perform();
    for (let i = 0; i < 5; i++) {
      await actions.move({ x: 100, y: 100, origin: 'pointer' }).perform();
      await actions.move({ x: -50, y: 50, origin: 'pointer' }).perform();
      await actions.move({ x: -50, y: -50, origin: 'pointer' }).perform();
      await actions.move({ x: 50, y: -50, origin: 'pointer' }).perform();
    }
    
    // 2. Keyboard input
    const inputs = await driver.findElements(By.css('input'));
    if (inputs.length > 0) {
      await inputs[0].click();
      await inputs[0].sendKeys('This is a test of keyboard dynamics');
      await driver.sleep(500);
    }
    
    // 3. Scrolling
    await driver.executeScript('window.scrollTo(0, 500)');
    await driver.sleep(500);
    await driver.executeScript('window.scrollTo(0, 0)');
    await driver.sleep(500);
    
    // Wait for behavioral data to be processed
    await driver.sleep(3000);
    
    // Check if behavioral metrics are displayed
    const behavioralElements = [
      '#typingPattern',
      '#mouseMovement',
      '#touchGestures',
      '#deviceMotion',
      '#uiInteraction'
    ];
    
    for (const selector of behavioralElements) {
      try {
        const element = await driver.findElement(By.css(selector));
        const text = await element.getText();
        
        if (text && text !== 'N/A') {
          console.log(`✅ Behavioral metric ${selector} is populated: ${text}`);
        } else {
          console.log(`⚠️ Behavioral metric ${selector} may not be populated: ${text}`);
        }
      } catch (error) {
        console.log(`❌ Behavioral metric ${selector} not found`);
      }
    }
    
    // Take a screenshot
    await takeScreenshot(driver, `${page}_${device}_${browser}_behavioral`);
    
    return true;
  } catch (error) {
    console.error(`Error testing behavioral tracking: ${error.message}`);
    await takeScreenshot(driver, `${page}_${device}_${browser}_behavioral_error`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('Starting BBID UI automated tests');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  // Create test report directory
  const reportDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportFile = path.join(reportDir, `test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const testResults = [];
  
  // Run tests for each browser, device, and page combination
  for (const browser of config.browsers) {
    let driver;
    
    try {
      // Setup WebDriver for the current browser
      switch (browser) {
        case 'chrome':
          driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new chrome.Options().headless())
            .build();
          break;
        case 'firefox':
          driver = await new Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(new firefox.Options().headless())
            .build();
          break;
        case 'edge':
          driver = await new Builder()
            .forBrowser('MicrosoftEdge')
            .setEdgeOptions(new edge.Options().headless())
            .build();
          break;
        default:
          console.log(`Skipping unsupported browser: ${browser}`);
          continue;
      }
      
      // Run tests for each device viewport
      for (const [device, viewport] of Object.entries(config.viewports)) {
        // Set the viewport size
        await driver.manage().window().setRect(viewport);
        
        // Run tests for each page
        for (const page of Object.keys(config.pages)) {
          // Run each test suite
          const testSuites = [
            { name: 'Tabbed Interface', fn: testTabbedInterface },
            { name: 'Responsive Design', fn: testResponsiveDesign },
            { name: 'Behavioral Tracking', fn: testBehavioralTracking }
          ];
          
          for (const suite of testSuites) {
            results.total++;
            
            const startTime = Date.now();
            const success = await suite.fn(driver, device, browser, page);
            const endTime = Date.now();
            
            if (success) {
              results.passed++;
              console.log(`✅ ${suite.name} test passed for ${page} on ${device} using ${browser}`);
            } else {
              results.failed++;
              console.log(`❌ ${suite.name} test failed for ${page} on ${device} using ${browser}`);
            }
            
            // Record test result
            testResults.push({
              suite: suite.name,
              page,
              device,
              browser,
              success,
              duration: endTime - startTime
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error setting up tests for ${browser}: ${error.message}`);
    } finally {
      // Quit the driver
      if (driver) {
        await driver.quit();
      }
    }
  }
  
  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      passRate: `${(results.passed / results.total * 100).toFixed(2)}%`
    },
    results: testResults
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`Test report saved to ${reportFile}`);
  
  // Print summary
  console.log('\nTest Summary:');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Pass Rate: ${(results.passed / results.total * 100).toFixed(2)}%`);
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testTabbedInterface,
  testResponsiveDesign,
  testBehavioralTracking
};
