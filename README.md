# Bolt Driver API

Official Node.js SDK for Bolt Driver API - communicate with Bolt's driver platform like the mobile app.

## Features

- 🔐 **Complete Authentication Flow** - SMS-based authentication with phone number verification
- 🎯 **Real API Integration** - Direct integration with Bolt's driver platform APIs
- 📱 **Device Simulation** - Mimics real mobile app behavior and device information
- 🗺️ **GPS Integration** - Location-based API calls with real-time coordinates
- 🚗 **Driver Operations** - Get driver state, home screen, working time, and more
- 💾 **Token Persistence** - Automatically save and restore authentication tokens
- 📝 **Comprehensive Logging** - Configurable logging for requests, responses, and errors
- 🧪 **Full Test Coverage** - Comprehensive test suite with real API testing
- 📚 **Multiple Examples** - Interactive examples demonstrating all features

## New in v1.1.0

- **Token Persistence**: No more re-authentication! Tokens are automatically saved and restored
- **Enhanced Logging**: Configurable logging system with file and console output
- **New API Methods**: All methods from the latest Bolt API specifications
- **Better Error Handling**: Improved error messages and debugging information
- **JSDoc Documentation**: Complete documentation for all methods and types

## Installation

```bash
npm install bolt-driver-api
```

## Quick Start

```typescript
import { BoltDriverAPI, DeviceInfo, AuthConfig } from 'bolt-driver-api';

// Configure device information
const deviceInfo: DeviceInfo = {
  deviceId: 'your-device-id',
  deviceType: 'iphone',
  deviceName: 'iPhone17,3',
  deviceOsVersion: 'iOS18.6',
  appVersion: 'DI.116.0'
};

// Configure authentication
const authConfig: AuthConfig = {
  authMethod: 'phone',
  brand: 'bolt',
  country: 'pl',
  language: 'en-GB',
  theme: 'dark'
};

// Create API instance
const boltAPI = new BoltDriverAPI(deviceInfo, authConfig);

// Start authentication
const authResponse = await boltAPI.startAuthentication('+48123456789');
console.log('SMS sent to:', authResponse.verification_code_target);

// Confirm with SMS code
const confirmResponse = await boltAPI.confirmAuthentication(
  authResponse.verification_token, 
  '123456'
);
console.log('Authenticated as:', confirmResponse.type);
```

## Token Persistence

The API now automatically saves authentication tokens to disk, so you don't need to re-authenticate every time:

```typescript
import { BoltDriverAPI, FileTokenStorage } from 'bolt-driver-api';

// Use file-based token storage (default)
const tokenStorage = new FileTokenStorage('.bolt-token.json');
const boltAPI = new BoltDriverAPI(deviceInfo, authConfig, undefined, tokenStorage);

// On first run: authenticate normally
await boltAPI.startAuthentication('+48123456789');
await boltAPI.confirmAuthentication(token, '123456');

// On subsequent runs: token is automatically restored!
// No need to authenticate again
const isAuthenticated = boltAPI.isAuthenticated(); // true
```

## Logging System

Comprehensive logging with configurable levels and output destinations:

```typescript
import { BoltDriverAPI, LoggingConfig } from 'bolt-driver-api';

const loggingConfig: LoggingConfig = {
  enabled: true,
  level: 'info',
  logRequests: true,      // Log all API requests
  logResponses: false,    // Don't log responses (can be verbose)
  logErrors: true,        // Log all errors
  logToFile: true,        // Write logs to file
  logFilePath: './bolt-api.log'
};

const boltAPI = new BoltDriverAPI(deviceInfo, authConfig, undefined, undefined, loggingConfig);

// Update logging configuration at runtime
boltAPI.updateLoggingConfig({ logResponses: true });
```

## API Methods

### Authentication

- `startAuthentication(phoneNumber)` - Start SMS verification
- `confirmAuthentication(token, code)` - Complete authentication with SMS code
- `sendMagicLink(email)` - Send magic link to email for authentication
- `authenticateWithMagicLink(token, deviceInfo)` - Authenticate using magic link token
- `getAccessToken()` - Get driver access token
- `getCurrentRefreshToken()` - Get current refresh token
- `clearAuthentication()` - Clear stored authentication

### Driver Information

- `getDriverState(gpsInfo, appState)` - Get current driver state and polling info
- `getDriverHomeScreen(gpsInfo)` - Get home screen widgets and layout
- `getWorkingTimeInfo(gpsInfo)` - Get working time limits and status
- `getDriverNavBarBadges(gpsInfo)` - Get navigation bar badge information

### Dispatch & Orders

- `getDispatchPreferences(gpsInfo)` - Get order acceptance settings
- `getMapsConfigs(gpsInfo)` - Get maps and surge heatmap configuration
- `getMapTile(gpsInfo, collectionId, x, y, zoom)` - Get map tiles for surge areas

### Safety & Support

- `getEmergencyAssistProvider(gpsInfo)` - Get emergency assistance information
- `getModal(gpsInfo, event)` - Get modal information for UI events

### Driver Network

- `getOtherActiveDrivers(gpsInfo)` - Get other active drivers in the area

### Push Notifications

- `setDeviceToken(token)` - Set device token for push notifications
- `updatePushProfile(userId, instanceId, token)` - Update push notification profile

### Device Management

- `storeDriverInfo(data)` - Store driver information
- `getDriverPhoneDetails(gpsInfo)` - Get driver phone details

## Magic Link Authentication

The package supports magic link authentication as an alternative to SMS verification:

```typescript
import { BoltDriverAPI, FileTokenStorage } from 'bolt-driver-api';

const boltAPI = new BoltDriverAPI(deviceInfo, authConfig);

// Send magic link to email
await boltAPI.sendMagicLink('your-email@example.com');

// When you receive the magic link URL via email, extract the token and authenticate:
const magicLinkUrl = 'https://partners.bolt.eu/driverapp/magic-login.html?token=...';
const token = extractTokenFromMagicLink(magicLinkUrl); // Helper function included

// Authenticate using the extracted token
const verificationResponse = await boltAPI.authenticateWithMagicLink(token, deviceInfo);

if (verificationResponse.code === 0) {
  console.log('Authentication successful!');
  console.log('Refresh token received:', verificationResponse.data.refresh_token);
} else {
  console.log('Authentication failed:', verificationResponse.message);
}
```

### Supported Magic Link URL Formats

- Direct Bolt URLs: `https://partners.bolt.eu/driverapp/magic-login.html?token=...`
- AWS Tracking URLs: `https://awstrack.me/L0/https:%2F%2Fpartners.bolt.eu%2Fdriverapp%2F...`

The `authenticateWithMagicLink` method sends the token directly to Bolt's API endpoint for verification, providing a secure and direct authentication flow.

### Helper Functions

The package includes a utility function to extract tokens from magic link URLs:

```typescript
import { extractTokenFromMagicLink } from 'bolt-driver-api';

// Extract token from various magic link formats
const token = extractTokenFromMagicLink(magicLinkUrl);
```

This function handles both direct Bolt URLs and AWS tracking redirects, automatically decoding the token for use with the authentication endpoint.

You can test the complete magic link flow with:
```bash
npm run examples:magic-link
```

## Examples

### Basic Authentication

```bash
npm run examples:auth
```

### Enhanced Features

```bash
npm run examples:enhanced
```

### Magic Link Authentication

```bash
npm run examples:magic-link
```

Interactive example demonstrating magic link authentication, token extraction, and all new API endpoints from the HAR file analysis.

### Interactive Menu

```bash
npm run examples
```

## Testing

Run the full test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Configuration

### Device Information

```typescript
interface DeviceInfo {
  deviceId: string;           // Unique device identifier
  deviceType: 'iphone' | 'android';
  deviceName: string;         // e.g., 'iPhone17,3'
  deviceOsVersion: string;    // e.g., 'iOS18.6'
  appVersion: string;         // e.g., 'DI.116.0'
}
```

### Authentication Configuration

```typescript
interface AuthConfig {
  authMethod: 'phone' | 'email';
  brand: string;              // e.g., 'bolt'
  country: string;            // e.g., 'pl', 'ee', 'lv'
  language: string;           // e.g., 'en-GB', 'pl-PL'
  theme: 'light' | 'dark';
}
```

### GPS Information

```typescript
interface GpsInfo {
  latitude: number;           // GPS latitude
  longitude: number;          // GPS longitude
  accuracy: number;           // GPS accuracy in meters
  bearing: number;            // GPS bearing in degrees
  speed: number;              // GPS speed in m/s
  timestamp: number;          // GPS timestamp (Unix)
  age: number;                // GPS data age in seconds
}
```

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```typescript
import { BoltApiError, AuthenticationError, ValidationError } from 'bolt-driver-api';

try {
  await boltAPI.startAuthentication('invalid-phone');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    console.log('Invalid request:', error.message);
  } else if (error instanceof BoltApiError) {
    console.log('API error:', error.message, 'Status:', error.statusCode);
  }
}
```

## Logging Output

When logging is enabled, you'll see detailed information about API calls:

```
[2025-01-22T10:30:15.123Z] [INFO] → GET /driver/getDriverNavBarBadges
[2025-01-22T10:30:15.456Z] [INFO] ← GET /driver/getDriverNavBarBadges (333ms)
[2025-01-22T10:30:16.789Z] [ERROR] ✗ POST /driver/getDriverState (150ms) Network error
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues and questions:

- Check the [examples](examples/) directory
- Review the [tests](tests/) for usage patterns
- Open an issue on GitHub

## Changelog

### v1.1.0

- ✨ Added token persistence with file and memory storage
- ✨ Added comprehensive logging system
- ✨ Added new API methods from latest specifications
- ✨ Added JSDoc documentation for all methods
- ✨ Enhanced error handling and debugging
- ✨ Added enhanced example with all features
- ✨ Improved test coverage

### v1.0.0

- 🎉 Initial release
- 🔐 Complete authentication flow
- 📱 Device simulation
- 🗺️ GPS integration
- 🧪 Full test coverage
