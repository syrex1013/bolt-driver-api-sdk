# CI/CD Setup Guide

This guide explains how to set up the GitHub Actions CI/CD pipeline for the Bolt Driver API SDK.

## Overview

The CI/CD pipeline includes:
- **Automated Testing**: Runs on every push and pull request
- **Security Audits**: Checks for vulnerabilities in dependencies
- **Automated Publishing**: Publishes to NPM on releases
- **Dependency Updates**: Automated dependency updates via Dependabot

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)
- Runs tests on Node.js 16.x, 18.x, and 20.x
- Performs linting and type checking
- Generates test coverage reports
- Builds the package
- Uploads coverage to Codecov

### 2. PR Check (`.github/workflows/pr-check.yml`)
- Quality checks for pull requests
- Checks for TODO/FIXME comments
- Validates code quality
- Runs dependency checks

### 3. Release (`.github/workflows/release.yml`)
- Triggers on version tags (v*)
- Creates GitHub releases
- Publishes to NPM
- Verifies publication

## Setup Instructions

### 1. GitHub Repository Setup

1. Create a new repository on GitHub:
   ```
   https://github.com/syrex1013/bolt-driver-api-sdk
   ```

2. Push your code to the repository:
   ```bash
   git remote add origin https://github.com/syrex1013/bolt-driver-api-sdk.git
   git push -u origin main
   ```

### 2. NPM Token Setup

1. Go to [NPM Account Settings](https://www.npmjs.com/settings/tokens)
2. Create a new "Automation" token
3. Copy the token value
4. Go to your GitHub repository settings
5. Navigate to "Secrets and variables" → "Actions"
6. Add a new repository secret:
   - Name: `NPM_TOKEN`
   - Value: Your NPM automation token

### 3. Codecov Setup (Optional)

1. Go to [Codecov](https://codecov.io)
2. Sign in with GitHub
3. Add your repository
4. The CI pipeline will automatically upload coverage reports

### 4. Branch Protection Rules

1. Go to repository settings → "Branches"
2. Add a rule for the `main` branch:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Select the required status checks:
     - `Test Suite (16.x)`
     - `Test Suite (18.x)`
     - `Test Suite (20.x)`
     - `Build Package`
     - `Security Audit`

## Workflow Triggers

### Push Events
- **main/develop branches**: Runs full CI pipeline
- **Other branches**: No automatic triggers

### Pull Request Events
- **main/develop branches**: Runs PR quality checks
- **All PRs**: Runs comprehensive testing

### Release Events
- **Tag push (v*)**: Creates release and publishes to NPM
- **Manual dispatch**: Allows manual release creation

## Manual Release Process

### Option 1: Using GitHub CLI
```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# This will trigger the release workflow
```

### Option 2: Using GitHub Web Interface
1. Go to "Releases" in your repository
2. Click "Create a new release"
3. Choose a tag version (e.g., v1.0.0)
4. Add release notes
5. Click "Publish release"

### Option 3: Using Workflow Dispatch
1. Go to "Actions" → "Release" workflow
2. Click "Run workflow"
3. Enter the version number
4. Click "Run workflow"

## Monitoring and Troubleshooting

### Check Workflow Status
1. Go to "Actions" tab in your repository
2. View workflow runs and their status
3. Click on individual jobs to see detailed logs

### Common Issues

#### NPM Publishing Fails
- Check that `NPM_TOKEN` secret is set correctly
- Verify the package name is available on NPM
- Ensure the version number is unique

#### Tests Fail
- Check the test logs for specific error messages
- Ensure all dependencies are properly installed
- Verify Node.js version compatibility

#### Security Audit Fails
- Review the audit report for vulnerable dependencies
- Update or replace vulnerable packages
- Use `npm audit fix` for automatic fixes

## Customization

### Adding New Workflows
1. Create a new `.yml` file in `.github/workflows/`
2. Define the workflow triggers and jobs
3. Commit and push to trigger the workflow

### Modifying Existing Workflows
1. Edit the workflow files in `.github/workflows/`
2. Test changes on a feature branch first
3. Merge to main when ready

### Environment Variables
Add custom environment variables in repository settings:
1. Go to "Secrets and variables" → "Actions"
2. Add repository variables or secrets as needed
3. Reference them in workflows using `${{ secrets.SECRET_NAME }}`

## Best Practices

1. **Keep workflows fast**: Optimize for speed by using caching
2. **Test thoroughly**: Run workflows on feature branches before merging
3. **Monitor security**: Regularly review dependency updates
4. **Document changes**: Update this guide when modifying workflows
5. **Use meaningful commit messages**: Helps with debugging failed workflows

## Support

If you encounter issues with the CI/CD setup:
1. Check the workflow logs for error messages
2. Review this guide for common solutions
3. Open an issue in the repository for help
4. Contact the maintainers at [remix3030303@hotmail.com](mailto:remix3030303@hotmail.com)
