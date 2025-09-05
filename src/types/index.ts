// Device and Platform Information

/**
 * Device information required for Bolt API authentication and requests.
 *
 * This interface defines the device-specific parameters that are sent with every API request
 * to simulate a real mobile application. The Bolt API uses these parameters to identify
 * the client device and provide appropriate responses.
 *
 * @example
 * ```typescript
 * const deviceInfo: DeviceInfo = {
 *   deviceId: '550e8400-e29b-41d4-a716-446655440000',
 *   deviceType: 'iphone',
 *   deviceName: 'iPhone17,3',
 *   deviceOsVersion: 'iOS18.6',
 *   appVersion: 'DI.116.0'
 * };
 * ```
 *
 * @since 1.0.0
 * @author Bolt Driver API Team
 */
export interface DeviceInfo {
  /** Unique device identifier (UUID format recommended) */
  deviceId: string;
  /** Device platform type */
  deviceType: "iphone" | "android";
  /** Human-readable device model name */
  deviceName: string;
  /** Operating system version (e.g., "iOS18.6", "Android14") */
  deviceOsVersion: string;
  /** Bolt app version (e.g., "DI.116.0") */
  appVersion: string;
}

// GPS and Location Information

/**
 * GPS location information including coordinates, speed, and accuracy data.
 *
 * This interface defines the comprehensive GPS data structure used by Bolt's location-based
 * services. It includes both raw GPS readings and processed values that are sent with
 * location-aware API requests.
 *
 * @example
 * ```typescript
 * const gpsInfo: GpsInfo = {
 *   latitude: 52.237049,
 *   longitude: 21.017532,
 *   accuracy: 5.0,
 *   bearing: 90.5,
 *   speed: 25.3,
 *   timestamp: Math.floor(Date.now() / 1000),
 *   age: 2.5,
 *   accuracyMeters: 5.0,
 *   adjustedBearing: 90.5,
 *   bearingAccuracyDeg: 2.0,
 *   speedAccuracyMps: 1.5
 * };
 * ```
 *
 * @since 1.0.0
 * @author Bolt Driver API Team
 */
export interface GpsInfo {
  /** Latitude in decimal degrees (-90 to 90) */
  latitude: number;
  /** Longitude in decimal degrees (-180 to 180) */
  longitude: number;
  /** GPS accuracy in meters */
  accuracy: number;
  /** Bearing/direction in degrees (0-360) */
  bearing: number;
  /** Speed in meters per second */
  speed: number;
  /** Unix timestamp of GPS reading */
  timestamp: number;
  /** Age of GPS data in seconds */
  age: number;
  /** Accuracy in meters (alternative property) */
  accuracyMeters: number;
  /** Bearing adjusted for device orientation */
  adjustedBearing: number;
  /** Bearing accuracy in degrees */
  bearingAccuracyDeg: number;
  /** Speed accuracy in meters per second */
  speedAccuracyMps: number;
}

// Authentication and Session

/**
 * Authentication configuration for Bolt API requests.
 *
 * This interface defines the authentication parameters that determine how the Bolt API
 * client behaves, including the authentication method, regional settings, and UI theme.
 *
 * @example
 * ```typescript
 * const authConfig: AuthConfig = {
 *   authMethod: 'phone',
 *   brand: 'bolt',
 *   country: 'pl',
 *   language: 'en-GB',
 *   theme: 'dark'
 * };
 * ```
 *
 * @since 1.0.0
 * @author Bolt Driver API Team
 */
export interface AuthConfig {
  /** Authentication method to use */
  authMethod: "phone" | "email";
  /** Brand identifier (usually 'bolt') */
  brand: string;
  /** Country code in ISO 3166-1 alpha-2 format (e.g., 'pl', 'de', 'fr') */
  country: string;
  /** Language code in BCP 47 format (e.g., 'en-GB', 'pl-PL', 'de-DE') */
  language: string;
  /** UI theme preference */
  theme: "light" | "dark";
}

/**
 * Driver session information including authentication tokens and driver details.
 *
 * This interface contains all the information about an authenticated driver session,
 * including tokens, driver identification, and associated company/partner information.
 *
 * @example
 * ```typescript
 * const sessionInfo: SessionInfo = {
 *   sessionId: 'session-123456',
 *   driverId: 789012,
 *   partnerId: 345678,
 *   companyId: 901234,
 *   companyCityId: 567890,
 *   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   refreshToken: 'refresh-token-123',
 *   tokenType: 'driver',
 *   expiresAt: Date.now() + 3600000
 * };
 * ```
 *
 * @since 1.0.0
 * @author Bolt Driver API Team
 */
export interface SessionInfo {
  /** Unique session identifier */
  sessionId: string;
  /** Driver's unique identifier */
  driverId: number;
  /** Partner company identifier */
  partnerId: number;
  /** Company identifier */
  companyId?: number;
  /** Company city identifier */
  companyCityId?: number;
  /** JWT access token for API authentication */
  accessToken?: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken?: string;
  /** Type of token (usually 'driver') */
  tokenType?: string;
  /** Token expiration timestamp in milliseconds */
  expiresAt: number;
  /** Data property for token access (alternative structure) */
  data?: {
    token?: {
      access_token?: string;
      refresh_token?: string;
    };
  };
  /** Token property (alternative structure) */
  token?: {
    access_token?: string;
    refresh_token?: string;
  };
}

// API Response Types

/**
 * Standard API response wrapper used by all Bolt Driver API endpoints.
 *
 * All Bolt API responses follow this consistent structure, with a status code,
 * human-readable message, and optional data payload. This wrapper provides
 * a standardized way to handle both successful and error responses.
 *
 * @example
 * ```typescript
 * // Successful response
 * const successResponse: ApiResponse<HomeScreenData> = {
 *   code: 0,
 *   message: 'OK',
 *   data: {
 *     earnings: { today: 25.50, week: 180.75 },
 *     activity: { activeRides: 1, completedToday: 12 }
 *   }
 * };
 *
 * // Error response
 * const errorResponse: ApiResponse = {
 *   code: 293,
 *   message: 'SMS_CODE_NOT_FOUND',
 *   data: null,
 *   error_data: { text: 'Invalid SMS code provided' }
 * };
 * ```
 *
 * @template T - The type of data contained in the response (optional)
 * @since 1.0.0
 * @author Bolt Driver API Team
 */
export interface ApiResponse<T = any> {
  /** Response status code (0 for success, non-zero for errors) */
  code: number;
  /** Human-readable status message */
  message: string;
  /** Response data payload (can be null for errors) */
  data: T;
  /** Optional error details for failed requests */
  error_data?: {
    /** Human-readable error description */
    text?: string;
    /** Additional error metadata */
    [key: string]: any;
  };
}

// Magic Link Authentication
export interface MagicLinkRequest {
  device_name: string;
  version: string;
  device_uid: string;
  email: string;
  device_os_version: string;
  brand: string;
}

export interface MagicLinkResponse {
  code: number;
  message: string;
}

// Magic Link Verification
export interface MagicLinkVerificationRequest {
  device_os_version: string;
  device_name: string;
  device_uid: string;
  version: string;
  token: string;
}

export interface MagicLinkVerificationResponse {
  code: number;
  message: string;
  data: {
    refresh_token: string;
  };
}

// Navigation Bar Badges
export interface NavBarBadges {
  is_help_badge_present: boolean;
}

// External Help Provider
export interface ExternalHelpProvider {
  external_help_provider: any;
}

// Map Tile Request
export interface MapTileRequest {
  tiles_collection_id: string;
  x: number;
  y: number;
  zoom: number;
}

// Push Profile Request
export interface PushProfileRequest {
  apn: Array<{
    bundleId: string;
    deviceToken: string;
    environment: string;
    tokenType: string;
  }>;
  maxPayloadSize: number;
}

// Other Active Drivers
export interface OtherActiveDrivers {
  list: any[];
}

// Modal Information
export interface ModalInfo {
  data: any;
}

// Maps Configuration
export interface MapsConfig {
  tile_collections: {
    surge_heatmap: {
      show_on_picker: boolean;
      tiles_collection_id: string;
      label_per_category: any;
      default_properties: any;
      icons: any;
    };
  };
  tile_collections_picker_ui: {
    options: Array<{
      tile_collection: string;
      picker_option_icon: {
        type: string;
        light_url: { url: string };
      };
      is_default: boolean;
      badge_icon: {
        type: string;
        light_url: { url: string };
      };
      title: string;
      description: string;
    }>;
  };
}

// Driver State and Status
export interface DriverState {
  driverState: "inactive" | "active" | "busy" | "offline";
  takeNewOrdersDuringOrder: boolean;
  orderAcceptance: "auto" | "manual";
  maxClientDistance: number;
  orders: any[];
  driverDestinationId: number;
  categoriesHash: string;
  pollIntervalSec: number;
  emergencyAssistProviderHash: string;
  pendingBusyState: boolean;
}

// Home Screen Data
export interface HomeScreenData {
  layout: {
    maxRow: number;
    maxColumn: number;
  };
  items: HomeScreenItem[];
  pollIntervalSec: number;
  driverSidebarHash: string;
}

export interface HomeScreenItem {
  type: "banner" | "tile" | "simple_tile";
  payload: any;
  layout: {
    row: number;
    column: number;
    height: number;
    width: number;
  };
}

// Working Time Information
export interface WorkingTimeInfo {
  workingTimeLeftInSeconds: number;
  timeLeftUntilWorkingTimeResetInSeconds: number;
  workingTimeLimitInHours: number;
  offlineTimeLimitInHours: number;
  isWorkingTimeTicking: boolean;
  isRestTimeTicking: boolean;
}

// Dispatch Preferences
export interface DispatchPreferences {
  searchCategories: {
    data: CategoryInfo[];
  };
  combinedStatus: string;
  orderAcceptance: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  selected: boolean;
  optOutDisabled: boolean;
}

// Maps Configuration
export interface MapsConfig {
  tileCollections: {
    surgeHeatmap: {
      showOnPicker: boolean;
      tilesCollectionId: string;
      labelPerCategory: Record<string, string>;
      defaultProperties: Record<string, any>;
      icons: Record<string, any>;
    };
  };
  tileCollectionsPickerUi: {
    options: TileCollectionOption[];
  };
}

export interface TileCollectionOption {
  tileCollection: string;
  pickerOptionIcon: {
    type: string;
    lightUrl: {
      url: string;
    };
  };
  isDefault: boolean;
  badgeIcon?: {
    type: string;
    lightUrl: {
      url: string;
    };
  };
  title: string;
  description: string;
}

// Authentication Flow
export interface StartAuthRequest {
  phone: string;
  device_uid: string;
  version: string;
  device_os_version: string;
}

export interface StartAuthResponse {
  code: number;
  message: string;
  data: {
    verification_token: string;
    verification_code_channel: string;
    verification_code_target: string;
    verification_code_length: number;
    resend_wait_time_seconds: number;
    available_verification_code_channels: string[];
  };
}

export interface ConfirmAuthRequest {
  verification_token: string;
  verification_code: string;
  device_uid: string;
  version: string;
  device_os_version: string;
}

export interface ConfirmAuthResponse {
  code: number;
  message: string;
  data?: {
    type: string;
    token: {
      refresh_token: string;
      token_type: string;
    };
  };
  error_data?: {
    text?: string;
    [key: string]: any;
  };
}

// Credentials interface for authentication
export interface Credentials {
  driver_id: string;
  session_id: string;
  phone: string;
  verification_token?: string;
  verification_code?: string;
  refresh_token?: string;
  access_token?: string;
}

// API Configuration
export interface BoltApiConfig {
  baseUrl: string;
  driverBaseUrl?: string;
  companyBaseUrl?: string;
  timeout: number;
  retries: number;
  userAgent: string;
}

// Request Parameters - Updated to include all necessary properties
export interface RequestParams {
  brand: string;
  country: string;
  deviceId: string;
  deviceType: string;
  device_name: string;
  device_os_version: string;
  driver_id: number;
  language: string;
  session_id: string;
  theme: string;
  version: string;
  // GPS parameters (optional for non-location requests)
  gps_accuracy_meters?: number;
  gps_adjusted_bearing?: number;
  gps_age?: number;
  gps_lat?: number;
  gps_lng?: number;
  gps_speed?: number;
  gps_timestamp?: number;
  // Additional properties for specific endpoints
  lat?: number;
  lng?: number;
  tiles_collection_id?: string;
  x?: number;
  y?: number;
  zoom?: number;
  event?: string;
  group_by?: string;
  limit?: number;
  offset?: number;
  app_platform_provider?: string;
}

// Error Types
export class BoltApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = "BoltApiError";
  }
}

/**
 * Represents a "NOT_AUTHORIZED" error from the Bolt Driver API.
 */
export class NotAuthorizedError extends BoltApiError {
  constructor(message: string, response?: any) {
    super(message, 503, response);
    this.name = "NotAuthorizedError";
  }
}

export class AuthenticationError extends BoltApiError {
  constructor(message: string, statusCode: number, response?: any) {
    super(message, statusCode, response);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends BoltApiError {
  constructor(message: string, statusCode: number, response?: any) {
    super(message, statusCode, response);
    this.name = "ValidationError";
  }
}

export class SmsLimitError extends BoltApiError {
  constructor(message: string, response?: any) {
    super(message, 200, response);
    this.name = "SmsLimitError";
  }
}

export class InvalidSmsCodeError extends BoltApiError {
  constructor(message: string, response?: any) {
    super(message, 200, response);
    this.name = "InvalidSmsCodeError";
  }
}

export class InvalidPhoneError extends BoltApiError {
  constructor(message: string, response?: any) {
    super(message, 200, response);
    this.name = "InvalidPhoneError";
  }
}

export class DatabaseError extends BoltApiError {
  constructor(message: string, response?: any) {
    super(message, 200, response);
    this.name = "DatabaseError";
  }
}

// Token Persistence
export interface TokenStorage {
  saveToken(token: string, sessionInfo: SessionInfo): Promise<void>;
  loadToken(): Promise<{ token: string; sessionInfo: SessionInfo } | null>;
  clearToken(): Promise<void>;
  hasValidToken(): Promise<boolean>;
}

export interface FileTokenStorage extends TokenStorage {
  filePath: string;
}

// Logging Configuration
export interface LoggingConfig {
  enabled: boolean;
  level: "debug" | "info" | "warn" | "error";
  logRequests: boolean;
  logResponses: boolean;
  logErrors: boolean;
  logToFile?: boolean;
  logFilePath?: string | undefined;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  method: string;
  url: string;
  requestData?: any;
  responseData?: any;
  error?: any;
  duration?: number;
}
