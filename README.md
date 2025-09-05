# Bolt Driver API SDK

<p align="center">

![Bolt Driver API](https://img.shields.io/badge/Bolt-Driver%20API-00D100?style=for-the-badge&logo=bolt&logoColor=white)
![npm version](https://img.shields.io/npm/v/bolt-driver-api?style=for-the-badge)
![License](https://img.shields.io/npm/l/bolt-driver-api?style=for-the-badge)
![Build Status](https://img.shields.io/github/actions/workflow/status/bolt-driver-api/bolt-driver-api-sdk/test.yml?style=for-the-badge)
![Coverage](https://img.shields.io/codecov/c/github/bolt-driver-api/bolt-driver-api-sdk?style=for-the-badge)

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
import { BoltDriverAPI } from 'bolt-driver-api';

// Initialize the API client
const api = new BoltDriverAPI(
  {
    deviceId: 'unique-device-id',
    deviceType: 'iphone',
    deviceName: 'iPhone 15 Pro',
    deviceOsVersion: 'iOS 17.0',
    appVersion: 'DI.116.0'
  },
  {
    country: 'pl',
    language: 'en-GB',
    brand: 'bolt'
  }
);

// Start authentication
const authResponse = await api.startAuthentication(
  deviceInfo,
  authConfig,
  {
    phone: '+48123456789',
    driver_id: 'driver_123',
    session_id: 'session_123'
  }
);

// Confirm with SMS code
await api.confirmAuthentication(authResponse.sessionId, '1234');

// Now you can use all API methods
const driverState = await api.getDriverState({
  latitude: 52.237049,
  longitude: 21.017532,
  accuracy: 10
});
```

### Magic Link Authentication (Alternative)

```typescript
// When SMS limit is reached, use magic link
try {
  await api.startAuthentication(...);
} catch (error) {
  if (error.code === 299) { // SMS_LIMIT_REACHED
    // Send magic link to email
    await api.sendMagicLink('driver@example.com');
    
    // After receiving the magic link email
    const magicLink = 'https://partners.bolt.eu/...';
    await api.authenticateWithMagicLink(magicLink);
  }
}
```

## 📚 Documentation

### Authentication

The SDK supports two authentication methods:

#### 1. SMS Authentication

```typescript
// Start SMS authentication
const { sessionId } = await api.startAuthentication(
  deviceInfo,
  authConfig,
  credentials
);

// Confirm with SMS code
await api.confirmAuthentication(sessionId, smsCode);
```

#### 2. Magic Link Authentication

```typescript
// Send magic link
await api.sendMagicLink(email);

// Authenticate with received link
await api.authenticateWithMagicLink(magicLinkUrl);
```

### Driver State Management

```typescript
// Get current driver state
const state = await api.getDriverState(gpsInfo);
console.log(`Status: ${state.driver_status}`); // 'online', 'offline', 'busy'
console.log(`Active order: ${state.active_order_handle}`);

// Update driver location
const gpsInfo = {
  latitude: 52.237049,
  longitude: 21.017532,
  accuracy: 10,
  speed: 0,
  heading: 0,
  altitude: 100,
  timestamp: Date.now()
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
  ScheduledRideRequestGroupBy.Upcoming
);

// Get ride history
const history = await api.getOrderHistory(gpsInfo, 10, 0);

// Get ride details
const rideDetails = await api.getRideDetails(gpsInfo, orderHandle);

// Track active ride
if (state.active_order_handle) {
  const activeRide = await api.getRideDetails(
    gpsInfo,
    state.active_order_handle
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
  EarningsChartType.Weekly
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
  country: 'pl',          // ISO country code
  language: 'en-GB',      // Language-region code
  brand: 'bolt'           // Always 'bolt'
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
    maskSensitiveData: true  // Mask sensitive information
  }
);
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
  startAuthentication(...): Promise<StartAuthResponse>
  confirmAuthentication(...): Promise<ConfirmAuthResponse>
  sendMagicLink(email: string): Promise<MagicLinkResponse>
  authenticateWithMagicLink(url: string): Promise<MagicLinkVerificationResponse>
  
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
git clone https://github.com/bolt-driver-api/bolt-driver-api-sdk.git
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

- [GitHub Repository](https://github.com/bolt-driver-api/bolt-driver-api-sdk)
- [NPM Package](https://www.npmjs.com/package/bolt-driver-api)
- [API Documentation](https://github.com/bolt-driver-api/bolt-driver-api-sdk/wiki)
- [Issue Tracker](https://github.com/bolt-driver-api/bolt-driver-api-sdk/issues)

## 💬 Support

For support, please open an issue in the [GitHub repository](https://github.com/bolt-driver-api/bolt-driver-api-sdk/issues) or contact us at <team@boltdriverapi.com>.

---

<p align="center">

Made with ❤️ by the Bolt Driver API Team

</p>
