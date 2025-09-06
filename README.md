# Bolt Driver API SDK

<p align="center">

![Bolt Driver API](https://img.shields.io/badge/Bolt-Driver%20API-00D100?style=for-the-badge&logo=bolt&logoColor=white)
![npm version](https://img.shields.io/npm/v/bolt-driver-api?style=for-the-badge)
![License](https://img.shields.io/npm/l/bolt-driver-api?style=for-the-badge)
![Build Status](https://img.shields.io/github/actions/workflow/status/syrex1013/bolt-driver-api-sdk/test.yml?style=for-the-badge)
![Coverage](https://img.shields.io/codecov/c/github/syrex1013/bolt-driver-api-sdk?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)

## The official Node.js SDK for integrating with Bolt's driver platform API

- [Documentation](#-documentation)
- [Quick Start](#-quick-start)
- [Examples](#-examples)
- [API Reference](#️-api-reference)
- [Contributing](#-contributing)

</p>

---

## 🚀 Overview

The Bolt Driver API SDK provides complete access to Bolt's driver platform, enabling developers to build applications that interact with Bolt's ride-hailing services. This SDK offers the same functionality as the official Bolt Driver mobile application, including authentication, ride management, earnings tracking, and real-time GPS updates.

### ✨ Key Features

- 🔐 **Complete Authentication Flow** - SMS and magic link authentication support
- 🚗 **Real-time Driver Management** - Update status, location, and availability
- 📍 **GPS Tracking** - Continuous location updates with accuracy metrics
- 💰 **Earnings & Analytics** - Track earnings, view statistics, and payment history
- 🎯 **Ride Management** - Accept, reject, and manage ride requests
- 📊 **Comprehensive Logging** - Built-in request/response logging for debugging
- 🔄 **Automatic Token Management** - Handles token refresh and persistence
- 🌍 **Multi-region Support** - Works with all Bolt operating regions

## 📦 Installation

```bash
npm install bolt-driver-api
```

or using yarn:

```bash
yarn add bolt-driver-api
```

## 🎯 Quick Start

### Basic Usage

```typescript
import { BoltDriverAPI, DeviceInfo, AuthConfig, GpsInfo } from 'bolt-driver-api';

// Device information
const deviceInfo: DeviceInfo = {
  deviceId: '550e8400-e29b-41d4-a716-446655440000',
  deviceType: 'iphone',
  deviceName: 'iPhone17,3',
  deviceOsVersion: 'iOS18.6',
  appVersion: 'DI.116.0'
};

// Authentication configuration
const authConfig: AuthConfig = {
  authMethod: 'phone',
  brand: 'bolt',
  country: 'pl',
  language: 'en-GB',
  theme: 'dark'
};

// Initialize the API client
const api = new BoltDriverAPI(deviceInfo, authConfig);

// Start authentication
const authResponse = await api.startAuthentication(
  authConfig,
  deviceInfo,
  {
    phone: '+48123456789',
    driver_id: 'driver_123',
    session_id: 'session_123'
  }
);

// Confirm with SMS code
await api.confirmAuthentication(
  authConfig,
  deviceInfo,
  {
    phone: '+48123456789',
    driver_id: 'driver_123',
    session_id: 'session_123',
    verification_token: authResponse.data?.verification_token,
    verification_code: '123456'
  },
  '123456'
);

// Now you can use all API methods
const gpsInfo: GpsInfo = {
  latitude: 52.237049,
  longitude: 21.017532,
  accuracy: 10,
  bearing: 0,
  speed: 0,
  timestamp: Math.floor(Date.now() / 1000),
  age: 0,
  accuracyMeters: 10,
  adjustedBearing: 0,
  bearingAccuracyDeg: 0,
  speedAccuracyMps: 0,
  gps_speed_accuracy: 0
};

const driverState = await api.getDriverState(gpsInfo);
```

### Magic Link Authentication (Alternative)

```typescript
// When SMS limit is reached, use magic link
try {
  await api.startAuthentication(authConfig, deviceInfo, credentials);
} catch (error) {
  if (error.code === 299) { // SMS_LIMIT_REACHED
    // Send magic link to email
    await api.sendMagicLink('driver@example.com');
    
    // After receiving the magic link email
    const magicLinkUrl = 'https://partners.bolt.eu/...';
    const token = BoltDriverAPI.extractTokenFromMagicLink(magicLinkUrl);
    
    // Authenticate with magic link
    const gpsInfo: GpsInfo = {
      latitude: 52.237049,
      longitude: 21.017532,
      accuracy: 10,
      bearing: 0,
      speed: 0,
      timestamp: Math.floor(Date.now() / 1000),
      age: 0,
      accuracyMeters: 10,
      adjustedBearing: 0,
      bearingAccuracyDeg: 0,
      speedAccuracyMps: 0,
      gps_speed_accuracy: 0
    };
    
    await api.authenticateWithMagicLink(token, deviceInfo, gpsInfo);
  }
}
```

## 📚 Documentation

### Authentication

The SDK supports two authentication methods:

#### 1. SMS Authentication

```typescript
// Start SMS authentication
const authResponse = await api.startAuthentication(
  authConfig,
  deviceInfo,
  credentials
);

// Confirm with SMS code
await api.confirmAuthentication(
  authConfig,
  deviceInfo,
  {
    ...credentials,
    verification_token: authResponse.data?.verification_token,
    verification_code: smsCode
  },
  smsCode
);
```

#### 2. Magic Link Authentication

```typescript
// Send magic link
await api.sendMagicLink(email);

// Extract token from magic link URL
const token = BoltDriverAPI.extractTokenFromMagicLink(magicLinkUrl);

// Authenticate with received link
await api.authenticateWithMagicLink(token, deviceInfo, gpsInfo);
```

### Driver State Management

```typescript
// Get current driver state
const state = await api.getDriverState(gpsInfo);
console.log(`Status: ${state.driver_status}`); // 'online', 'offline', 'busy'
console.log(`Active order: ${state.active_order_handle}`);

// Update driver location
const gpsInfo: GpsInfo = {
  latitude: 52.237049,
  longitude: 21.017532,
  accuracy: 10,
  bearing: 0,
  speed: 0,
  timestamp: Math.floor(Date.now() / 1000),
  age: 0,
  accuracyMeters: 10,
  adjustedBearing: 0,
  bearingAccuracyDeg: 0,
  speedAccuracyMps: 0,
  gps_speed_accuracy: 0
};

// Poll for updates based on state.next_polling_in_sec
setInterval(async () => {
  const newState = await api.getDriverState(gpsInfo);
  // Handle state updates
}, state.next_polling_in_sec * 1000);
```

### Ride Management

```typescript
// Get scheduled rides
const scheduledRides = await api.getScheduledRideRequests(
  gpsInfo,
  'upcoming' // or 'accepted'
);

// Get ride history
const history = await api.getOrderHistory(gpsInfo, 10, 0);

// Get ride details
const orderHandle = { order_handle: 'order_123' };
const rideDetails = await api.getRideDetails(gpsInfo, orderHandle);

// Track active ride
if (state.active_order_handle) {
  const activeRide = await api.getRideDetails(
    gpsInfo,
    { order_handle: state.active_order_handle }
  );
}
```

### Earnings & Analytics

```typescript
// Get earnings overview
const earnings = await api.getEarningsLandingScreen(gpsInfo);

// Get detailed breakdown
const breakdown = await api.getEarningsBreakdown(gpsInfo);

// Get weekly/monthly charts
const weeklyChart = await api.getEarningsChart(
  gpsInfo,
  'weekly' // or 'monthly'
);

// Get cash out options
const cashOutOptions = await api.getCashOutOptions(gpsInfo);

// View balance history
const balanceHistory = await api.getBalanceHistory(gpsInfo);
```

### Navigation & Maps

```typescript
// Get maps configuration
const mapsConfig = await api.getMapsConfigs(gpsInfo);

// Get other active drivers nearby
const nearbyDrivers = await api.getOtherActiveDrivers(gpsInfo);

// Get emergency assist provider
const emergencyProvider = await api.getEmergencyAssistProvider(gpsInfo);
```

### Support & Help

```typescript
// Get help sections
const helpDetails = await api.getHelpDetails(gpsInfo);

// Get support chat conversations
const conversations = await api.getSupportChatConversations(gpsInfo);

// Get driver stories/guides
const stories = await api.getDriverStories(gpsInfo);

// Get news and updates
const news = await api.getNewsList(gpsInfo);
```

## 🧪 Examples

The SDK includes comprehensive examples demonstrating various use cases:

### Interactive Examples

```bash
# Main example - Full authentication and API demo
npm run examples

# Authentication flow example
npm run examples:auth

# CLI tool for testing endpoints
npm run examples:cli

# Enhanced features demo
npm run examples:enhanced

# Navigation and ride tracking
npm run examples:navigation

# Magic link authentication
npm run examples:magic-link

# Bolt driver endpoints showcase
npm run examples:bolt-driver

# Response inspection tool
npm run examples:inspect

# Logging control example
npm run examples:logging
```

### Automated Testing

```bash
# Run all examples automatically (no interaction)
npm run test:examples

# Run all tests including unit and integration tests
npm run test:all
```

## 🔧 Configuration

### Device Configuration

```typescript
const deviceInfo: DeviceInfo = {
  deviceId: 'unique-device-id',    // Unique identifier (UUID recommended)
  deviceType: 'iphone',             // 'iphone' or 'android'
  deviceName: 'iPhone 15 Pro',      // Device model name
  deviceOsVersion: 'iOS 17.0',      // OS version
  appVersion: 'DI.116.0'            // Bolt app version
};
```

### Authentication Configuration

```typescript
const authConfig: AuthConfig = {
  authMethod: 'phone',    // Authentication method
  brand: 'bolt',          // Always 'bolt'
  country: 'pl',          // ISO country code
  language: 'en-GB',      // Language-region code
  theme: 'dark'           // UI theme preference
};
```

### Logging Configuration

```typescript
const api = new BoltDriverAPI(
  deviceInfo,
  authConfig,
  { /* api config */ },
  null, // default token storage
  {
    level: 'info',           // 'debug' | 'info' | 'warn' | 'error'
    logRequests: true,       // Log outgoing requests
    logResponses: true,      // Log incoming responses
    logErrors: true,         // Log errors
    maskSensitiveData: true  // Mask sensitive information
  }
);

// Or update logging config after initialization
api.updateLoggingConfig({
  logRequests: false,
  logResponses: false,
  logErrors: true
});
```

### Custom Token Storage

```typescript
import { TokenStorage } from 'bolt-driver-api';

class CustomTokenStorage implements TokenStorage {
  async saveToken(token: string, sessionInfo: SessionInfo): Promise<void> {
    // Your implementation
  }
  
  async loadToken(): Promise<{ token: string; sessionInfo: SessionInfo } | null> {
    // Your implementation
  }
  
  async clearToken(): Promise<void> {
    // Your implementation
  }
}

const api = new BoltDriverAPI(
  deviceInfo,
  authConfig,
  {},
  new CustomTokenStorage()
);
```

## 🛠️ API Reference

### Main Classes

#### BoltDriverAPI

The main API client class that provides access to all Bolt driver endpoints.

```typescript
class BoltDriverAPI {
  constructor(
    deviceInfo: DeviceInfo,
    authConfig: AuthConfig,
    config?: Partial<BoltApiConfig>,
    tokenStorage?: TokenStorage,
    loggingConfig?: Partial<LoggingConfig>
  );
  
  // Authentication methods
  startAuthentication(authConfig: AuthConfig, deviceInfo: DeviceInfo, credentials: Credentials): Promise<StartAuthResponse>
  confirmAuthentication(authConfig: AuthConfig, deviceInfo: DeviceInfo, credentials: Credentials, smsCode: string): Promise<ConfirmAuthResponse>
  sendMagicLink(email: string): Promise<MagicLinkResponse>
  authenticateWithMagicLink(token: string, deviceInfo: DeviceInfo, gpsInfo: GpsInfo): Promise<MagicLinkVerificationResponse>
  static extractTokenFromMagicLink(url: string): string
  
  // Driver state methods
  getDriverState(gpsInfo: GpsInfo): Promise<DriverState>
  getDriverHomeScreen(gpsInfo: GpsInfo): Promise<HomeScreenData>
  
  // Ride management methods
  getScheduledRideRequests(...): Promise<ApiResponse>
  getOrderHistory(...): Promise<OrderHistoryResponse>
  getRideDetails(...): Promise<RideDetailsResponse>
  
  // Earnings methods
  getEarningsLandingScreen(...): Promise<EarningsLandingScreen>
  getEarningsBreakdown(...): Promise<EarningsBreakdown>
  
  // ... and many more
}
```

### Types & Interfaces

All TypeScript types are exported and fully documented:

```typescript
import {
  DeviceInfo,
  AuthConfig,
  GpsInfo,
  DriverState,
  OrderHandle,
  SessionInfo,
  // ... and more
} from 'bolt-driver-api';
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run all tests including examples
npm run test:all
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/syrex1013/bolt-driver-api-sdk.git
cd bolt-driver-api-sdk

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/syrex1013/bolt-driver-api-sdk)
- [NPM Package](https://www.npmjs.com/package/bolt-driver-api)
- [API Documentation](https://github.com/syrex1013/bolt-driver-api-sdk/wiki)
- [Issue Tracker](https://github.com/syrex1013/bolt-driver-api-sdk/issues)

## 💬 Support

For support, please open an issue in the [GitHub repository](https://github.com/syrex1013/bolt-driver-api-sdk/issues) or contact us at <remix3030303@hotmail.com>.

## About the author & sponsorship

This SDK was built by **Adrian Dacka** as a solo reverse-engineering effort of the Bolt Driver app to document and expose the underlying APIs for developers and researchers. I'm not affiliated with Bolt — this project is for educational and development purposes only. Use responsibly.

If you'd like to support my individual work (no team), please click the **Sponsor** button on this repo or donate via your preferred platform — it helps me keep improving the project.
[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-GitHub-181717?logo=github)](https://github.com/sponsors/YOUR-USERNAME)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-Donate-FF813F?logo=buy-me-a-coffee)](https://www.buymeacoffee.com/YOUR-USERNAME)


</p>
