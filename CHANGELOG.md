# Changelog

All notable changes to the Bolt Driver API SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-05

### 🎉 Initial Release

#### Added
- **Authentication**
  - SMS-based authentication with phone number verification
  - Magic link authentication via email
  - Automatic token management and refresh
  - Custom token storage interface

- **Driver Management**
  - Real-time driver state tracking
  - Home screen data retrieval
  - Working time information
  - Driver configuration management

- **Ride Management**
  - Scheduled ride requests
  - Order history with pagination
  - Detailed ride information
  - Activity statistics

- **Earnings & Payments**
  - Earnings overview and breakdown
  - Weekly/monthly earnings charts
  - Cash out options
  - Balance history tracking

- **Navigation & Maps**
  - Maps configuration
  - Nearby active drivers
  - Emergency assistance provider info
  - Map tile support

- **Support Features**
  - Help section content
  - Support chat conversations
  - Driver stories and guides
  - News and announcements

- **Developer Features**
  - Comprehensive TypeScript types
  - Built-in request/response logging
  - Configurable retry logic
  - Error handling with custom error types

- **Examples**
  - Interactive authentication example
  - CLI tool for testing endpoints
  - Navigation and ride tracking demo
  - Automated test suite
  - Magic link authentication example

- **Documentation**
  - Comprehensive README
  - API reference documentation
  - Wiki with detailed guides
  - JSDoc comments for all public APIs

#### Security
- Secure token storage with encryption support
- Sensitive data masking in logs
- HTTPS-only communication

#### Testing
- Unit tests with 80%+ coverage
- Integration tests for all endpoints
- Example test suite

---

## [Unreleased]

### Planned Features
- WebSocket support for real-time updates
- Batch API operations
- Offline mode with request queuing
- React Native integration guide
- Dashboard web application example

### Known Issues
- Rate limiting needs better backoff strategy
- Some endpoints may return inconsistent data types
- GPS accuracy validation could be improved

---

## Version History

- **1.0.0** - Initial release with full API coverage
- **0.9.0** - Beta release for testing (internal only)
- **0.1.0** - Alpha release with basic functionality (internal only)

---

For more information on upgrading between versions, see the [Migration Guide](https://github.com/syrex1013/bolt-driver-api-sdk/wiki/Migration-Guide).
