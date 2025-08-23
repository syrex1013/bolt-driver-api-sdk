// Device and Platform Information
export interface DeviceInfo {
  deviceId: string;
  deviceType: 'iphone' | 'android';
  deviceName: string;
  deviceOsVersion: string;
  appVersion: string;
}

// GPS and Location Information
export interface GpsInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  bearing: number;
  speed: number;
  timestamp: number;
  age: number;
  // Additional properties required by authenticateWithMagicLink
  accuracyMeters: number;
  adjustedBearing: number;
  bearingAccuracyDeg: number;
  speedAccuracyMps: number;
}

// Authentication and Session
export interface AuthConfig {
  authMethod: 'phone' | 'email';
  brand: string;
  country: string;
  language: string;
  theme: 'light' | 'dark';
}

export interface SessionInfo {
  sessionId: string;
  driverId: number;
  partnerId: number;
  companyId: number;
  companyCityId: number;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
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
  driverState: 'inactive' | 'active' | 'busy' | 'offline';
  takeNewOrdersDuringOrder: boolean;
  orderAcceptance: 'auto' | 'manual';
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
  type: 'banner' | 'tile' | 'simple_tile';
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
  verification_token: string;
  verification_code_channel: string;
  verification_code_target: string;
  verification_code_length: number;
  resend_wait_time_seconds: number;
  available_verification_code_channels: string[];
}

export interface ConfirmAuthRequest {
  verification_token: string;
  verification_code: string;
  device_uid: string;
  version: string;
  device_os_version: string;
}

export interface ConfirmAuthResponse {
  type: string;
  token: {
    refresh_token: string;
    token_type: string;
  };
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
  gps_accuracy_meters: number;
  gps_adjusted_bearing: number;
  gps_age: number;
  gps_lat: number;
  gps_lng: number;
  gps_speed: number;
  gps_timestamp: number;
  language: string;
  session_id: string;
  theme: string;
  version: string;
  // Additional properties for specific endpoints
  lat?: number;
  lng?: number;
  tiles_collection_id?: string;
  x?: number;
  y?: number;
  zoom?: number;
  event?: string;
}

// Error Types
export class BoltApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'BoltApiError';
  }
}

export class AuthenticationError extends BoltApiError {
  constructor(message: string, statusCode: number, response?: any) {
    super(message, statusCode, response);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends BoltApiError {
  constructor(message: string, statusCode: number, response?: any) {
    super(message, statusCode, response);
    this.name = 'ValidationError';
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
  level: 'debug' | 'info' | 'warn' | 'error';
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
