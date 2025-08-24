# Technology Stack & Build System

## Core Technologies

- **Language**: TypeScript 5.2.2 with strict mode enabled
- **Runtime**: Node.js >=16.0.0
- **Package Manager**: npm with package-lock.json
- **HTTP Client**: Axios for API requests
- **Testing**: Jest with ts-jest preset
- **Linting**: ESLint with TypeScript plugin

## Build System

- **Compiler**: TypeScript compiler (tsc)
- **Output**: CommonJS modules in `dist/` directory
- **Source Maps**: Enabled for debugging
- **Declarations**: Generated TypeScript declaration files

## Key Dependencies

- `axios`: HTTP client for API requests
- `uuid`: Device ID generation
- `chalk`: Terminal styling for examples
- `boxen`: Terminal UI boxes for examples
- `inquirer`: Interactive CLI prompts
- `dotenv`: Environment variable management

## Common Commands

### Development

```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Watch mode compilation
npm run clean          # Remove dist/ directory
```

### Testing

```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

### Code Quality

```bash
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues automatically
```

### Examples

```bash
npm run examples                    # Interactive example menu
npm run examples:auth              # Basic authentication
npm run examples:enhanced          # Full-featured example
npm run examples:magic-link        # Magic link authentication
npm run examples:bolt-driver       # Bolt driver endpoints
```

## TypeScript Configuration

- Target: ES2020
- Strict mode enabled with comprehensive type checking
- Declaration files generated for library consumers
- Source maps for debugging
- Exact optional property types enforced

## Testing Setup

- Jest with ts-jest preset
- 30-second timeout for API tests
- Console mocking to reduce test noise
- Coverage collection from src/ directory
- Setup file for test configuration
