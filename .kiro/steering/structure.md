# Project Structure & Organization

## Directory Layout

```text
bolt-driver-api/
├── src/                    # Source code
│   ├── BoltDriverAPI.ts   # Main API class
│   ├── Logger.ts          # Logging system
│   ├── TokenStorage.ts    # Token persistence
│   ├── index.ts           # Main exports
│   └── types/             # Type definitions
│       └── index.ts       # All TypeScript interfaces
├── examples/              # Usage examples
│   ├── index.ts           # Interactive menu
│   ├── auth.ts            # Basic authentication
│   ├── enhanced.ts        # Full-featured example
│   ├── magic-link-example.ts # Magic link auth
│   └── bolt-driver-endpoints.ts # Driver endpoints
├── tests/                 # Test suite
│   ├── setup.ts           # Test configuration
│   └── *.test.ts          # Test files
├── dist/                  # Compiled output (generated)
└── .example_requests/     # HAR files and API documentation
```

## Architecture Patterns

### Main API Class

- `BoltDriverAPI` is the primary entry point
- Handles authentication, token management, and all API endpoints
- Uses dependency injection for token storage and logging
- Implements axios interceptors for request/response handling

### Type System

- All types centralized in `src/types/index.ts`
- Comprehensive interfaces for API requests/responses
- Custom error classes for different failure scenarios
- Strict TypeScript configuration enforces type safety

### Token Management

- Abstract `TokenStorage` interface with file and memory implementations
- Automatic token persistence and restoration
- JWT token parsing for session information extraction

### Logging System

- Configurable logging with multiple levels (debug, info, warn, error)
- Request/response logging with timing information
- File and console output options

## Code Organization Principles

### Single Responsibility

- Each class has a focused purpose (API, logging, storage)
- Methods are focused on specific operations
- Clear separation between authentication and API operations

### Dependency Injection

- Constructor injection for storage and logging dependencies
- Default implementations provided for ease of use
- Easy to mock for testing

### Error Handling

- Custom error classes for different API failure types
- Comprehensive error information with status codes and response data
- Graceful degradation for network issues

## File Naming Conventions

- PascalCase for class files (`BoltDriverAPI.ts`, `TokenStorage.ts`)
- camelCase for utility files (`index.ts`)
- kebab-case for example files (`magic-link-example.ts`)
- Test files match source files with `.test.ts` suffix

## Import/Export Patterns

- Main exports through `src/index.ts`
- Re-export commonly used types for convenience
- Barrel exports for clean API surface
- Examples use relative imports from `../src`
