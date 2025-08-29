# CollisionOS Testing Guide

This guide provides comprehensive information about the testing infrastructure and practices for CollisionOS.

## Table of Contents

1. [Testing Architecture](#testing-architecture)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Coverage Requirements](#coverage-requirements)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

## Testing Architecture

CollisionOS uses a multi-layered testing approach:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test API endpoints and service interactions
- **End-to-End Tests**: Test complete user workflows using Playwright

### Tech Stack

- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing utilities
- **Playwright**: End-to-end browser testing
- **Supertest**: HTTP assertion library for API testing

## Test Types

### Unit Tests (`tests/unit/`)

Located in `tests/unit/`, these tests focus on:

- React components (`tests/unit/components/`)
- Context providers (`tests/unit/contexts/`)
- Custom hooks (`tests/unit/hooks/`)
- Utility functions (`tests/unit/services/`)

#### Example Structure:
```
tests/unit/
├── components/
│   ├── Auth/
│   │   ├── Login.test.js
│   │   └── ProtectedRoute.test.js
│   ├── Dashboard/
│   │   ├── KpiCard.test.js
│   │   └── ModernStatsCard.test.js
│   └── ...
├── contexts/
│   └── AuthContext.test.js
└── ...
```

### Integration Tests (`tests/integration/`)

Located in `tests/integration/`, these tests focus on:

- API endpoint testing (`tests/integration/api/`)
- Database interactions
- Socket.io functionality
- Service layer integration

#### Example Structure:
```
tests/integration/
└── api/
    ├── auth.test.js
    ├── customers.test.js
    ├── jobs.test.js
    └── ...
```

### End-to-End Tests (`tests/`)

Located in project root `tests/`, these use Playwright for:

- Complete user workflows
- Cross-browser testing
- UI interaction testing
- Authentication flows

## Running Tests

### All Tests
```bash
npm test                    # Run all Jest tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

### Specific Test Types
```bash
npm run test:unit          # Run only unit tests
npm run test:integration   # Run only integration tests
npm run test:playwright    # Run Playwright e2e tests
```

### Playwright Tests
```bash
npm run test:playwright    # Run all Playwright tests
npm run test:ui           # Run with Playwright UI
npm run test:headed       # Run in headed mode (visible browser)
npm run test:debug        # Run in debug mode
```

### Coverage
```bash
npm run test:coverage     # Generate coverage report
```

Coverage reports are generated in the `coverage/` directory with multiple formats:
- HTML report: `coverage/lcov-report/index.html`
- Console summary
- LCOV format for CI/CD

## Writing Tests

### Unit Test Example

```javascript
// tests/unit/components/Example.test.js
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../src/utils/testUtils';
import ExampleComponent from '../../../src/components/ExampleComponent';

describe('ExampleComponent', () => {
  test('renders correctly', () => {
    renderWithProviders(<ExampleComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Integration Test Example

```javascript
// tests/integration/api/example.test.js
const request = require('supertest');
const app = require('../../../server/app');

describe('Example API', () => {
  test('GET /api/example returns data', async () => {
    const response = await request(app)
      .get('/api/example')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

### Testing Utilities

The `src/utils/testUtils.js` provides helpful utilities:

- `renderWithProviders()`: Render components with all necessary providers
- `createMockUser()`: Generate mock user data
- `createMockJob()`: Generate mock job data
- `mockFetchSuccess()` / `mockFetchError()`: Mock API responses
- `fillForm()` / `submitForm()`: Helper functions for form testing

## Coverage Requirements

### Minimum Coverage Targets

- **Global Coverage**: 80%
  - Lines: 80%
  - Functions: 70%
  - Branches: 70%
  - Statements: 80%

### Critical Components (Higher Standards)

- **Authentication (`src/contexts/`, `src/components/Auth/`)**: 85-90%
- **Services (`src/services/`)**: 85%

### Coverage Reports

Generate coverage reports:
```bash
npm run test:coverage
```

View HTML report:
```bash
# Open coverage/lcov-report/index.html in browser
```

## CI/CD Integration

### GitHub Actions Workflow

The CI pipeline (`.github/workflows/ci.yml`) includes:

1. **Lint & Format Check**: ESLint and Prettier validation
2. **Unit & Integration Tests**: Run on multiple Node.js versions
3. **E2E Tests**: Playwright browser testing
4. **Type Checking**: TypeScript validation
5. **Build Test**: Ensure application builds successfully
6. **Security Audit**: npm audit for vulnerabilities
7. **Bundle Analysis**: Bundle size analysis

### Test Environment Variables

```bash
NODE_ENV=test
JWT_SECRET=test-jwt-secret-for-ci
JWT_EXPIRES_IN=1h
DATABASE_URL=./data/collisionos-test.db
```

### Coverage Integration

- Coverage reports are uploaded to Codecov
- Pull requests show coverage diff
- Coverage badges available in README

## Troubleshooting

### Common Issues

#### 1. Module Resolution Errors

```bash
Error: Cannot resolve module '@/components/...'
```

**Solution**: Check `jest.config.js` moduleNameMapping configuration.

#### 2. Canvas/Chart Testing Issues

```bash
Error: Cannot read property 'getContext' of null
```

**Solution**: Mock chart components or use the mocks in `setupTests.js`.

#### 3. LocalStorage Errors

```bash
Error: localStorage is not defined
```

**Solution**: Use the `mockLocalStorage()` utility from `testUtils.js`.

#### 4. Async Test Timeouts

```bash
Error: Timeout - Async callback was not invoked within the 5000ms timeout
```

**Solution**: Use `await waitFor()` for async assertions and increase timeout if needed.

#### 5. Material-UI Testing Issues

```bash
Warning: useLayoutEffect does nothing on the server
```

**Solution**: Mocks are provided in `setupTests.js` for Material-UI components.

### Debug Mode

Run tests in debug mode:
```bash
npm run test -- --detectOpenHandles --forceExit
```

For Playwright debugging:
```bash
npm run test:debug
```

### Selective Test Runs

Run specific test files:
```bash
npm test -- AuthContext.test.js
npm test -- --testPathPattern=Dashboard
```

Run tests matching a pattern:
```bash
npm test -- --testNamePattern="login"
```

## Best Practices

### 1. Test Structure
- Use descriptive test names
- Group related tests with `describe` blocks
- Follow AAA pattern: Arrange, Act, Assert

### 2. Mocking
- Mock external dependencies
- Use Jest's built-in mocking features
- Keep mocks close to tests or in `__mocks__` directories

### 3. Async Testing
- Always use `await` with async operations
- Use `waitFor` for DOM updates
- Avoid arbitrary timeouts

### 4. Component Testing
- Test behavior, not implementation
- Focus on user interactions
- Test edge cases and error states

### 5. API Testing
- Test all HTTP methods
- Verify request/response formats
- Test authentication and authorization
- Include error scenarios

## Test Data Management

### Mock Data Factories

Use the factory functions in `testUtils.js`:

```javascript
const mockUser = createMockUser({ role: 'admin' });
const mockJob = createMockJob({ status: 'completed' });
const mockCustomer = createMockCustomer();
```

### Test Database

For integration tests, use a separate test database:
- `data/collisionos-test.db`
- Migrate and seed before tests
- Clean up after test runs

## Performance Testing

### Bundle Size Monitoring

```bash
npm run build:analyze
```

### Test Performance

Monitor test execution times:
```bash
npm test -- --verbose --passWithNoTests
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

**Note**: This testing infrastructure provides a solid foundation for ensuring code quality and preventing regressions. Regular testing and high coverage are essential for maintaining a robust application.