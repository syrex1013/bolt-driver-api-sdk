# Complete API Reference

This document provides a comprehensive reference for all methods available in the Bolt Driver API SDK.

## Table of Contents

- [Authentication Methods](#authentication-methods)
- [Driver State Methods](#driver-state-methods)
- [Ride Management Methods](#ride-management-methods)
- [Earnings Methods](#earnings-methods)
- [Support Methods](#support-methods)
- [Navigation Methods](#navigation-methods)
- [Utility Methods](#utility-methods)

## Authentication Methods

### startAuthentication

Initiates SMS-based authentication for a driver.

```typescript
startAuthentication(
  deviceParams: DeviceInfo,
  authConfig: AuthConfig,
  credentials: Credentials
): Promise<StartAuthResponse>
```

**Parameters:**

- `deviceParams`: Device information (ID, type, OS, app version)
- `authConfig`: Authentication settings (country, language, brand)
- `credentials`: Driver credentials (phone, driver_id, session_id)

**Returns:** `StartAuthResponse` with session ID for confirmation

**Throws:**

- `SmsLimitError` (299): SMS sending limit reached
- `InvalidPhoneError` (300): Invalid phone number format
- `DatabaseError` (301): Database-related error

### confirmAuthentication

Confirms authentication with SMS verification code.

```typescript
confirmAuthentication(
  sessionId: string,
  smsCode: string
): Promise<ConfirmAuthResponse>
```

**Parameters:**

- `sessionId`: Session ID from startAuthentication
- `smsCode`: SMS verification code

**Returns:** `ConfirmAuthResponse` with authentication tokens

**Throws:**

- `InvalidSmsCodeError` (302): Invalid or expired SMS code
- `NotAuthorizedError` (503): Authorization failed

### sendMagicLink

Sends magic link to email for authentication.

```typescript
sendMagicLink(email: string): Promise<MagicLinkResponse>
```

**Parameters:**

- `email`: Email address to send magic link

**Returns:** `MagicLinkResponse` with success status

### authenticateWithMagicLink

Completes authentication using magic link.

```typescript
authenticateWithMagicLink(
  magicLinkUrl: string
): Promise<MagicLinkVerificationResponse>
```

**Parameters:**

- `magicLinkUrl`: Full magic link URL from email

**Returns:** `MagicLinkVerificationResponse` with driver information

## Driver State Methods

### getDriverState

Gets current driver state and polling information.

```typescript
getDriverState(
  gpsInfo: GpsInfo,
  appState?: string
): Promise<DriverState>
```

**Parameters:**

- `gpsInfo`: GPS location and accuracy
- `appState`: Application state ('background' or 'foreground')

**Returns:** `DriverState` with status, active orders, polling intervals

### getDriverHomeScreen

Gets driver home screen data.

```typescript
getDriverHomeScreen(
  gpsInfo: GpsInfo
): Promise<HomeScreenData>
```

**Parameters:**

- `gpsInfo`: GPS location and accuracy

**Returns:** `HomeScreenData` with layout, items, polling interval

### getDriverLoggedInConfiguration

Gets logged-in driver configuration.

```typescript
getDriverLoggedInConfiguration(): Promise<any>
```

**Returns:** Driver configuration including vehicle and personal info

### getWorkingTimeInfo

Gets driver working time statistics.

```typescript
getWorkingTimeInfo(
  gpsInfo: GpsInfo
): Promise<WorkingTimeInfo>
```

**Parameters:**

- `gpsInfo`: GPS location and accuracy

**Returns:** `WorkingTimeInfo` with hours worked, breaks

## Ride Management Methods

### getScheduledRideRequests

Gets scheduled ride requests.

```typescript
getScheduledRideRequests(
  gpsInfo: GpsInfo,
  groupBy?: string
): Promise<ApiResponse>
```

**Parameters:**

- `gpsInfo`: GPS location and accuracy
- `groupBy`: Grouping option ('upcoming', 'accepted')

**Returns:** List of scheduled rides

### getOrderHistory

Gets driver's order history.

```typescript
getOrderHistory(
  gpsInfo: GpsInfo,
  limit: number,
  offset: number
): Promise<OrderHistoryResponse>
```

**Parameters:**

- `gpsInfo`: GPS location and accuracy
- `limit`: Number of orders to fetch
- `offset`: Pagination offset

**Returns:** `OrderHistoryResponse` with orders and cursor

### getRideDetails

Gets detailed information about a specific ride.

```typescript
getRideDetails(
  gpsInfo: GpsInfo,
  orderHandle: OrderHandle
): Promise<RideDetailsResponse>
```

**Parameters:**

- `gpsInfo`: GPS location and accuracy
- `orderHandle`: Order identification object

**Returns:** `RideDetailsResponse` with complete ride information

### getActivityRides

Gets driver activity and ride statistics.

```typescript
getActivityRides(
  gpsInfo: GpsInfo,
  groupBy?: string
): Promise<ApiResponse>
```

**Parameters:**

- `gpsInfo`: GPS location and accuracy
- `groupBy`: Grouping option ('all', 'hourly', 'daily')

**Returns:** Activity statistics and ride counts

## Earnings Methods

### getEarningsLandingScreen

Gets earnings overview screen data.

```typescript
getEarningsLandingScreen(
  gpsInfo: GpsInfo
): Promise<EarningsLandingScreen>
```

**Returns:** Earnings summary with charts and breakdowns

### getEarningsBreakdown

Gets detailed earnings breakdown.

```typescript
getEarningsBreakdown(
  gpsInfo: GpsInfo
): Promise<EarningsBreakdown>
```

**Returns:** Detailed earnings by category

### getEarningsChart

Gets earnings chart data.

```typescript
getEarningsChart(
  gpsInfo: GpsInfo,
  chartType: EarningsChartType
): Promise<EarningsChart>
```

**Parameters:**

- `chartType`: Chart type ('weekly', 'monthly')

**Returns:** Chart data with earnings over time

### getEarningsDailyBreakdown

Gets earnings breakdown for specific day.

```typescript
getEarningsDailyBreakdown(
  gpsInfo: GpsInfo,
  date: string
): Promise<DailyEarningsBreakdown>
```

**Parameters:**

- `date`: Date in YYYY-MM-DD format

**Returns:** Detailed earnings for the specified day

### getCashOutOptions

Gets available cash out options.

```typescript
getCashOutOptions(
  gpsInfo: GpsInfo
): Promise<CashOutOptions>
```

**Returns:** Available cash out methods and limits

### getBalanceHistory

Gets driver balance history.

```typescript
getBalanceHistory(
  gpsInfo: GpsInfo
): Promise<BalanceHistory>
```

**Returns:** Historical balance changes and transactions

## Support Methods

### getHelpDetails

Gets help and support information.

```typescript
getHelpDetails(
  gpsInfo: GpsInfo
): Promise<HelpDetails>
```

**Returns:** Help sections, FAQs, contact options

### getSupportChatConversations

Gets support chat conversations.

```typescript
getSupportChatConversations(
  gpsInfo: GpsInfo
): Promise<ChatConversations>
```

**Returns:** List of support chat threads

### getDriverStories

Gets driver stories and guides.

```typescript
getDriverStories(
  gpsInfo: GpsInfo
): Promise<DriverStories>
```

**Returns:** Educational content and driver guides

### getNewsList

Gets news and announcements.

```typescript
getNewsList(
  gpsInfo: GpsInfo
): Promise<NewsList>
```

**Returns:** Latest news and updates

## Navigation Methods

### getMapsConfigs

Gets maps configuration.

```typescript
getMapsConfigs(
  gpsInfo: GpsInfo
): Promise<MapsConfig>
```

**Returns:** Map settings and configuration

### getEmergencyAssistProvider

Gets emergency assistance provider info.

```typescript
getEmergencyAssistProvider(
  gpsInfo: GpsInfo
): Promise<ExternalHelpProvider>
```

**Returns:** Emergency contact information

### getOtherActiveDrivers

Gets nearby active drivers.

```typescript
getOtherActiveDrivers(
  gpsInfo: GpsInfo
): Promise<OtherActiveDrivers>
```

**Returns:** List of nearby active drivers

### getMapTile

Gets map tile data.

```typescript
getMapTile(
  tileRequest: MapTileRequest
): Promise<any>
```

**Parameters:**

- `tileRequest`: Tile coordinates and zoom level

**Returns:** Map tile data

## Utility Methods

### isAuthenticated

Checks if client is authenticated.

```typescript
isAuthenticated(): boolean
```

**Returns:** `true` if authenticated

### validateToken

Validates current authentication token.

```typescript
validateToken(): Promise<boolean>
```

**Returns:** `true` if token is valid

### clearAuthentication

Clears authentication tokens.

```typescript
clearAuthentication(): void
```

### getSessionInfo

Gets current session information.

```typescript
getSessionInfo(): SessionInfo | undefined
```

**Returns:** Current session details or undefined

### getCurrentAccessToken

Gets current access token.

```typescript
getCurrentAccessToken(): string | undefined
```

**Returns:** Current access token or undefined

### getCurrentRefreshToken

Gets current refresh token.

```typescript
getCurrentRefreshToken(): string | undefined
```

**Returns:** Current refresh token or undefined

### setLoggingConfig

Updates logging configuration.

```typescript
setLoggingConfig(config: Partial<LoggingConfig>): void
```

**Parameters:**

- `config`: Logging configuration options

### getLogger

Gets the logger instance.

```typescript
getLogger(): Logger
```

**Returns:** Logger instance for custom logging

## Error Handling

All methods may throw `BoltApiError` with the following structure:

```typescript
class BoltApiError extends Error {
  code: number;      // Error code
  message: string;   // Error message
  data?: any;        // Additional error data
}
```

Common error codes:

- `299`: SMS limit reached
- `300`: Invalid phone number
- `301`: Database error
- `302`: Invalid SMS code
- `401`: Unauthorized
- `503`: Not authorized

## Type Definitions

For complete type definitions, see [TypeScript Types](TypeScript-Types.md).

## Examples

For usage examples, see:

- [Authentication Examples](Examples-Authentication.md)
- [Ride Tracking Examples](Examples-Ride-Tracking.md)
- [Earnings Examples](Examples-Earnings.md)
