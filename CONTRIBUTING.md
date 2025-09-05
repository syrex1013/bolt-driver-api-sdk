# Contributing to Bolt Driver API SDK

First off, thank you for considering contributing to the Bolt Driver API SDK! It's people like you that make this SDK a great tool for the developer community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to <team@boltdriverapi.com>.

## Getting Started

Before you begin:

- Have you read the [documentation](https://github.com/bolt-driver-api/bolt-driver-api-sdk/wiki)?
- Check if your issue/idea has already been reported/discussed in [Issues](https://github.com/bolt-driver-api/bolt-driver-api-sdk/issues)
- Check if your idea fits with the scope and aims of the project

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**Bug Report Template:**

```markdown
### Description
[Clear and concise description of the bug]

### Steps to Reproduce
1. Initialize API with '...'
2. Call method '...'
3. See error

### Expected Behavior
[What you expected to happen]

### Actual Behavior
[What actually happened]

### Environment
- SDK Version: [e.g., 1.0.0]
- Node.js Version: [e.g., 18.0.0]
- Operating System: [e.g., macOS 13.0]

### Additional Context
[Any other information that might be helpful]
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Code Contributions

#### Local Development

1. Fork the repo
2. Clone your fork:

   ```bash
   git clone https://github.com/your-username/bolt-driver-api-sdk.git
   cd bolt-driver-api-sdk
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

5. Make your changes and ensure tests pass:

   ```bash
   npm test
   npm run lint
   ```

## Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0
- TypeScript knowledge
- Understanding of Bolt's driver platform

### Project Structure

```text
bolt-driver-api-sdk/
├── src/                  # Source code
│   ├── index.ts         # Main export
│   ├── BoltDriverAPI.ts # Main API class
│   ├── types/           # TypeScript types
│   ├── Logger.ts        # Logging utility
│   └── TokenStorage.ts  # Token management
├── tests/               # Test files
├── examples/            # Example implementations
├── dist/                # Compiled output
└── wiki/                # Documentation
```

### Building

```bash
# Build the project
npm run build

# Watch mode for development
npm run dev
```

## Coding Guidelines

### TypeScript Style Guide

- Use TypeScript strict mode
- Always specify return types
- Use interfaces over type aliases when possible
- Document all public APIs with JSDoc
- Prefer `const` over `let`
- Use meaningful variable names

### Code Style

```typescript
// ✅ Good
export interface DriverInfo {
  driverId: number;
  firstName: string;
  lastName: string;
}

/**
 * Get driver information
 * @param driverId - The driver's unique identifier
 * @returns Promise resolving to driver information
 */
async function getDriverInfo(driverId: number): Promise<DriverInfo> {
  // Implementation
}

// ❌ Bad
export type driver_info = {
  driver_id: any;
  first_name: any;
  last_name: any;
}

async function get_driver(id) {
  // Implementation
}
```

### Error Handling

Always use custom error types:

```typescript
// ✅ Good
throw new BoltApiError('Authentication failed', 401, responseData);

// ❌ Bad
throw new Error('Auth failed');
```

### Logging

Use the built-in logger:

```typescript
this.logger.info('Operation started', { param1, param2 });
this.logger.error('Operation failed', error);
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

### Examples

```bash
feat(auth): add magic link authentication support

- Implement sendMagicLink method
- Add authenticateWithMagicLink method
- Update types for magic link flow

Closes #123
```

```bash
fix(api): handle rate limiting correctly

The API now properly respects X-RateLimit headers and implements
exponential backoff when rate limited.
```

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the wiki documentation if you're adding new features
3. Add tests for any new functionality
4. Ensure all tests pass: `npm test`
5. Ensure code follows the style guide: `npm run lint`
6. Update the version numbers if applicable
7. Create a Pull Request with a clear title and description

### PR Template

```markdown
## Description
[Describe your changes]

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged and published

## Screenshots (if appropriate)
[Add screenshots]
```

## Testing

### Writing Tests

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Test both success and error cases

```typescript
describe('BoltDriverAPI', () => {
  describe('startAuthentication', () => {
    it('should send SMS when valid phone number provided', async () => {
      // Test implementation
    });

    it('should throw InvalidPhoneError when phone format is invalid', async () => {
      // Test implementation
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- authentication.test.ts
```

## Documentation

### Code Documentation

All public APIs must have JSDoc comments:

```typescript
/**
 * Start SMS authentication for a driver
 * 
 * @param deviceParams - Device information including ID and type
 * @param authConfig - Authentication configuration with country and language
 * @param credentials - Driver credentials including phone number
 * @returns Promise resolving to authentication response with session ID
 * @throws {SmsLimitError} When SMS limit has been reached
 * @throws {InvalidPhoneError} When phone number format is invalid
 * 
 * @example
 * ```typescript
 * const response = await api.startAuthentication(
 *   deviceInfo,
 *   { country: 'PL', language: 'en-GB' },
 *   { phone: '+48123456789', driver_id: '123' }
 * );
 * ```
 */
```

### Wiki Documentation

When adding new features:

1. Update relevant wiki pages
2. Add examples to the examples directory
3. Update the API Reference

## Questions?

Feel free to open an issue with the `question` label or contact us at <team@boltdriverapi.com>.

## Recognition

Contributors will be recognized in:

- The project README
- Release notes
- Our website (with permission)

Thank you for contributing! 🚀
