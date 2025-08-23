# Publishing Guide for Bolt Driver API

This guide explains how to publish the Bolt Driver API package to NPM.

## 📋 Prerequisites

Before publishing, ensure you have:

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **NPM CLI**: Install and configure the NPM CLI
3. **Git Repository**: A clean Git repository with proper versioning
4. **Build Access**: Ability to build the TypeScript project

## 🔧 Setup Steps

### 1. NPM Login

```bash
# Login to your NPM account
npm login

# Verify you're logged in
npm whoami
```

### 2. Configure Package

Update the following fields in `package.json`:

```json
{
  "name": "bolt-driver-api",
  "version": "1.0.0",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/bolt-driver-api.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/bolt-driver-api/issues"
  },
  "homepage": "https://github.com/yourusername/bolt-driver-api#readme"
}
```

### 3. Build the Package

```bash
# Clean previous builds
npm run clean

# Build TypeScript to JavaScript
npm run build

# Verify the build output
ls -la dist/
```

### 4. Test the Build

```bash
# Run tests to ensure everything works
npm test

# Run linting
npm run lint

# Test the examples
npm run examples
```

## 🚀 Publishing Process

### 1. Version Management

Choose the appropriate version bump:

```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major
```

### 2. Dry Run (Recommended)

Test the package without publishing:

```bash
# Pack the package locally
npm pack

# This creates a .tgz file you can inspect
ls -la *.tgz
```

### 3. Publish to NPM

```bash
# Publish the package
npm publish

# Or publish with specific tag
npm publish --tag beta
```

### 4. Verify Publication

```bash
# Check if the package is published
npm view bolt-driver-api

# Install the published package in a test directory
mkdir test-install && cd test-install
npm init -y
npm install bolt-driver-api
```

## 🏷️ Version Tags

Use appropriate tags for different release types:

```bash
# Latest stable release
npm publish

# Beta release
npm publish --tag beta

# Alpha release
npm publish --tag alpha

# Release candidate
npm publish --tag rc
```

## 📦 Package Contents

Ensure your package includes only necessary files:

```json
{
  "files": [
    "dist/**/*",
    "README.md",
    "LICENSE"
  ]
}
```

The `dist/` folder should contain:
- `index.js` - Main JavaScript file
- `index.d.ts` - TypeScript declarations
- `BoltDriverAPI.js` - Main class file
- `types/index.js` - Type definitions
- Source maps (optional)

## 🔍 Pre-Publish Checklist

Before publishing, verify:

- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build is successful (`npm run build`)
- [ ] Examples work (`npm run examples`)
- [ ] Package.json is properly configured
- [ ] README.md is up to date
- [ ] LICENSE file is included
- [ ] .gitignore excludes unnecessary files
- [ ] Version number is appropriate
- [ ] No sensitive information is included

## 🚨 Common Issues and Solutions

### 1. Package Name Already Taken

If `bolt-driver-api` is taken, use a scoped package:

```json
{
  "name": "@yourusername/bolt-driver-api"
}
```

### 2. Build Failures

```bash
# Clean and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 3. TypeScript Declaration Issues

```bash
# Regenerate declarations
npm run build
# Check dist/index.d.ts exists and is valid
```

### 4. NPM Authentication Issues

```bash
# Re-login to NPM
npm logout
npm login
```

## 🔄 Updating Published Package

### 1. Make Changes

```bash
# Make your code changes
# Update tests if needed
# Update documentation
```

### 2. Version Bump

```bash
# Choose appropriate version bump
npm version patch  # or minor/major
```

### 3. Build and Test

```bash
npm run clean
npm run build
npm test
```

### 4. Publish Update

```bash
npm publish
```

## 📊 Post-Publish Tasks

After successful publication:

1. **Create Git Tag**: `git push --tags`
2. **Update Documentation**: Ensure README reflects current version
3. **Monitor Installation**: Check package download statistics
4. **Respond to Issues**: Monitor GitHub issues and NPM feedback
5. **Plan Next Release**: Document planned features for next version

## 🎯 Best Practices

### 1. Semantic Versioning

Follow [semver.org](https://semver.org/) guidelines:
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### 2. Release Notes

Create detailed release notes for each version:

```markdown
## [1.1.0] - 2025-01-15

### Added
- New method: `getEmergencyAssistProvider()`
- Enhanced error handling with custom error classes

### Changed
- Improved GPS accuracy handling
- Updated request timeout defaults

### Fixed
- Bug in authentication flow
- Memory leak in map tile requests
```

### 3. Testing Strategy

- **Unit Tests**: Test individual methods
- **Integration Tests**: Test API interactions
- **End-to-End Tests**: Test complete workflows
- **Real API Tests**: Use actual endpoints (as per your preference)

### 4. Documentation

- Keep README.md current
- Include code examples
- Document breaking changes
- Provide migration guides for major versions

## 🔐 Security Considerations

1. **No Secrets**: Never include API keys or secrets
2. **Dependencies**: Regularly update dependencies for security patches
3. **Vulnerability Scanning**: Use `npm audit` before publishing
4. **Access Control**: Limit who can publish to your package

## 📈 Monitoring and Maintenance

### 1. Package Analytics

Monitor your package:
- [NPM Package Page](https://www.npmjs.com/package/bolt-driver-api)
- Download statistics
- User feedback and issues

### 2. Regular Updates

- Keep dependencies updated
- Monitor for security vulnerabilities
- Respond to user issues promptly
- Plan regular feature releases

### 3. Community Engagement

- Respond to GitHub issues
- Accept and review pull requests
- Engage with users on NPM
- Share updates on social media

## 🆘 Troubleshooting

### Publishing Fails

```bash
# Check NPM status
npm ping

# Verify authentication
npm whoami

# Check package.json validity
npm run build
npm pack
```

### Build Issues

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Verify dependencies
npm ls

# Clean rebuild
npm run clean && npm install && npm run build
```

### Test Failures

```bash
# Run tests with verbose output
npm test -- --verbose

# Check test environment
node --version
npm --version
```

## 📚 Additional Resources

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [TypeScript Compiler Options](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

---

**Happy Publishing! 🚀**

Remember: Quality over quantity. Take your time to ensure each release is solid and well-tested.
