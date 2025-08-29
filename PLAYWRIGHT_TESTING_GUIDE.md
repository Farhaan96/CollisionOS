# CollisionOS Playwright Testing Guide

This guide covers end-to-end testing of the CollisionOS application using Playwright, including Supabase integration testing with seeded data.

## 🚀 Quick Start

### Prerequisites

1. **Application Running**: Make sure the CollisionOS application is running on `http://localhost:3000`
2. **Supabase Setup**: Ensure your Supabase project is configured and seeded with test data
3. **Environment Variables**: Verify your `.env` file contains Supabase credentials

### Run All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Or use the test runner directly
node tests/run-e2e-tests.js
```

### Run Specific Test Suites

```bash
# Smoke tests (quick validation)
npm run test:e2e:smoke

# Supabase integration tests
npm run test:e2e:supabase

# Complete workflow tests
npm run test:e2e:workflows

# Authentication tests only
npm run test:e2e:auth

# Customer management tests
npm run test:e2e:customers

# Job management tests
npm run test:e2e:jobs
```

## 📁 Test Structure

```
tests/
├── e2e/
│   ├── collisionos-workflows.spec.js    # Complete workflow tests
│   ├── supabase-integration.spec.js     # Supabase-specific tests
│   └── smoke-tests.spec.js              # Quick smoke tests
├── run-e2e-tests.js                     # Test runner script
└── [existing test files...]
```

## 🧪 Test Categories

### 1. Smoke Tests (`smoke-tests.spec.js`)
**Purpose**: Quick validation of critical functionality
- Login page loads correctly
- Authentication works
- Basic navigation functions
- Responsive design works
- Seeded data displays

**Run**: `npm run test:e2e:smoke`

### 2. Supabase Integration Tests (`supabase-integration.spec.js`)
**Purpose**: Test Supabase-specific functionality
- Data loading from Supabase
- Real-time updates
- API integration
- Data relationships
- Performance with Supabase
- Authentication & authorization

**Run**: `npm run test:e2e:supabase`

### 3. Complete Workflow Tests (`collisionos-workflows.spec.js`)
**Purpose**: End-to-end user workflows
- Authentication & login
- Dashboard & navigation
- Customer management (CRUD operations)
- Job management (CRUD operations)
- Parts management
- Reports & analytics
- Responsive design
- Error handling

**Run**: `npm run test:e2e:workflows`

## 🔧 Test Configuration

### Playwright Config (`playwright.config.js`)
```javascript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Data
Tests use seeded data from the Supabase database:
- **Shop ID**: `550e8400-e29b-41d4-a716-446655440001`
- **Customers**: John Doe, Acme Corp, State Farm Insurance, Sarah Wilson, Mike Johnson
- **Jobs**: Front Bumper Repair, Side Panel Replacement, Full Paint Job
- **Parts**: Front Bumper, Headlight Assembly, Paint - Red

## 🎯 Test Scenarios

### Authentication Tests
- ✅ Login with valid credentials
- ❌ Login with invalid credentials
- ✅ Required field validation
- ✅ Password visibility toggle
- ✅ Authentication state persistence

### Dashboard Tests
- ✅ KPI cards display correctly
- ✅ Navigation menu works
- ✅ Real-time data loading
- ✅ Responsive design

### Customer Management Tests
- ✅ Display seeded customers
- ✅ Create new customer
- ✅ View customer details
- ✅ Search customers
- ✅ Customer data validation

### Job Management Tests
- ✅ Display production board
- ✅ Create new job
- ✅ Update job status
- ✅ Filter jobs by status
- ✅ Job-customer relationships

### Parts Management Tests
- ✅ Display parts inventory
- ✅ Add new part
- ✅ Parts categorization
- ✅ Parts-job relationships

### Supabase Integration Tests
- ✅ Data loading from Supabase
- ✅ Real-time updates
- ✅ API error handling
- ✅ Authentication headers
- ✅ Performance metrics

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm run test:e2e

# Run with browser visible
npm run test:headed

# Run with UI mode (interactive)
npm run test:ui

# Run in debug mode
npm run test:debug

# Run specific test file
npx playwright test tests/e2e/smoke-tests.spec.js
```

### Advanced Commands

```bash
# Run tests with specific browser
npx playwright test --project=chromium

# Run tests with custom timeout
npx playwright test --timeout=60000

# Run tests with specific reporter
npx playwright test --reporter=html,line

# Run tests in parallel
npx playwright test --workers=4

# Run tests with custom base URL
npx playwright test --base-url=http://localhost:3001
```

## 📊 Test Reports

### HTML Report
After running tests, view the HTML report:
```bash
# Open the HTML report
npx playwright show-report
```

The report includes:
- Test results and status
- Screenshots on failure
- Video recordings
- Trace files for debugging
- Performance metrics

### Console Output
The test runner provides colored console output:
- ✅ Green: Success
- ❌ Red: Errors
- ⚠️ Yellow: Warnings
- ℹ️ Blue: Information

## 🔍 Debugging Tests

### Debug Mode
```bash
# Run tests in debug mode
npm run test:debug
```

This opens the browser in headed mode and pauses execution, allowing you to:
- Step through test execution
- Inspect elements
- Debug network requests
- View console logs

### Trace Files
Enable trace files for detailed debugging:
```bash
npx playwright test --trace=on
```

View trace files:
```bash
npx playwright show-trace trace.zip
```

### Screenshots
Tests automatically capture screenshots on failure. View them in:
- `test-results/` directory
- HTML report
- Console output

## 🛠️ Troubleshooting

### Common Issues

#### 1. Application Not Running
**Error**: `Application is not running on http://localhost:3000`

**Solution**:
```bash
# Start the application
npm start

# Or in development mode
npm run dev
```

#### 2. Supabase Configuration Missing
**Error**: `Supabase configuration not found`

**Solution**:
1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

#### 3. Tests Failing Due to Missing Data
**Error**: `Expected element not found`

**Solution**:
1. Ensure Supabase is seeded with test data:
   ```bash
   cd supabase-migration
   npm run seed
   npm run test-seeded
   ```

#### 4. Network Timeouts
**Error**: `Timeout waiting for element`

**Solution**:
1. Increase timeout in test:
   ```javascript
   await expect(element).toBeVisible({ timeout: 10000 });
   ```
2. Check network connectivity
3. Verify API endpoints are responding

#### 5. Element Not Found
**Error**: `Element not found`

**Solution**:
1. Check if the element selector is correct
2. Verify the element is visible and not hidden
3. Add wait conditions:
   ```javascript
   await page.waitForSelector('selector', { timeout: 5000 });
   ```

### Performance Issues

#### Slow Test Execution
1. Run tests in parallel:
   ```bash
   npx playwright test --workers=4
   ```
2. Use headless mode for faster execution
3. Optimize test data setup

#### Memory Issues
1. Reduce number of concurrent workers
2. Close browser contexts between tests
3. Clean up test data after each test

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm start &
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Variables for CI
```bash
# Required for CI
CI=true
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Best Practices

### Test Organization
1. **Group related tests** using `test.describe()`
2. **Use descriptive test names** that explain the scenario
3. **Keep tests independent** - each test should be able to run alone
4. **Use beforeEach/afterEach** for setup and cleanup

### Selectors
1. **Prefer data attributes** over CSS classes:
   ```javascript
   // Good
   await page.click('[data-testid="add-customer"]');
   
   // Avoid
   await page.click('.btn-primary');
   ```
2. **Use text content** when appropriate:
   ```javascript
   await page.click('text=Add Customer');
   ```
3. **Avoid fragile selectors** like nth-child or complex CSS

### Assertions
1. **Use specific assertions**:
   ```javascript
   // Good
   await expect(page.locator('text=Customer created')).toBeVisible();
   
   // Avoid
   await expect(page).toHaveText('Customer created');
   ```
2. **Add meaningful error messages**:
   ```javascript
   await expect(element).toBeVisible({ timeout: 5000 });
   ```

### Data Management
1. **Use seeded test data** for consistent results
2. **Clean up test data** after tests that create new data
3. **Use unique identifiers** for test data to avoid conflicts

### Performance
1. **Minimize page loads** by reusing browser contexts
2. **Use efficient selectors** to reduce wait times
3. **Batch related operations** when possible

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Supabase Documentation](https://supabase.com/docs)
- [CollisionOS Migration Guide](./SUPABASE_EXECUTION_GUIDE.md)

## 🤝 Contributing

When adding new tests:
1. Follow the existing test structure
2. Use descriptive test names
3. Include appropriate assertions
4. Add comments for complex scenarios
5. Update this guide if adding new test categories

## 📞 Support

For issues with:
- **Playwright setup**: Check the [Playwright documentation](https://playwright.dev/docs/intro)
- **Supabase integration**: Refer to the [Supabase migration guide](./SUPABASE_EXECUTION_GUIDE.md)
- **Test failures**: Check the troubleshooting section above
- **Application issues**: Review the application logs and documentation
