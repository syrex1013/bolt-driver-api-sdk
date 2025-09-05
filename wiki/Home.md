# Bolt Driver API SDK

Welcome to the official Bolt Driver API SDK documentation. This Node.js SDK allows you to communicate with Bolt's driver platform just like the mobile app.

## 🚀 Quick Start

```bash
npm install bolt-driver-api
```

```typescript
import { BoltDriverAPI, FileTokenStorage } from 'bolt-driver-api';

const api = new BoltDriverAPI(deviceInfo, authConfig);
```

## 📚 Documentation

### Core Guides
- **[Authentication Guide](Authentication-Guide)** - Complete authentication setup and flows
- **[API Reference](API-Reference)** - Complete method and type documentation
- **[Error Codes](Error-Codes)** - Error handling and troubleshooting

### Key Features
- 🔐 **SMS & Magic Link Authentication** - Multiple authentication methods
- 📱 **Device Management** - iOS and Android device support
- 🗺️ **GPS Integration** - Real-time location tracking
- 💰 **Earnings & Analytics** - Driver earnings and performance data
- 🚗 **Ride Management** - Complete ride lifecycle management
- 📊 **Real-time Updates** - Live driver state and ride updates

## 🛠️ Installation

```bash
npm install bolt-driver-api
```

## 📖 Basic Usage

```typescript
import { BoltDriverAPI, FileTokenStorage, DeviceInfo, AuthConfig } from 'bolt-driver-api';

// Device information
const deviceInfo: DeviceInfo = {
  deviceId: 'your-device-id',
  deviceType: 'iphone',
  deviceName: 'iPhone 15 Pro',
  deviceOsVersion: 'iOS 17.0',
  appVersion: '1.0.0'
};

// Authentication configuration
const authConfig: AuthConfig = {
  authMethod: 'phone',
  brand: 'bolt',
  country: 'pl',
  language: 'en-GB',
  theme: 'dark'
};

// Initialize API
const api = new BoltDriverAPI(deviceInfo, authConfig);

// Start authentication
const authResponse = await api.startAuthentication(authConfig, deviceInfo, credentials);
```

## 🔗 Links

- **NPM Package**: [bolt-driver-api](https://www.npmjs.com/package/bolt-driver-api)
- **GitHub Repository**: [bolt-driver-api-sdk](https://github.com/syrex1013/bolt-driver-api-sdk)
- **Issue Tracker**: [GitHub Issues](https://github.com/syrex1013/bolt-driver-api-sdk/issues)
- **Changelog**: [CHANGELOG.md](https://github.com/syrex1013/bolt-driver-api-sdk/blob/main/CHANGELOG.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/syrex1013/bolt-driver-api-sdk/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](https://github.com/syrex1013/bolt-driver-api-sdk/blob/main/LICENSE) for details.

---

**Need help?** Check out our [Authentication Guide](Authentication-Guide) or [API Reference](API-Reference) for detailed documentation.