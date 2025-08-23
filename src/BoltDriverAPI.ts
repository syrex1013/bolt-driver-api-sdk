import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  BoltApiConfig,
  DeviceInfo,
  GpsInfo,
  AuthConfig,
  SessionInfo,
  RequestParams,
  ApiResponse,
  DriverState,
  HomeScreenData,
  WorkingTimeInfo,
  DispatchPreferences,
  MapsConfig,
  StartAuthResponse,
  ConfirmAuthResponse,
  BoltApiError,
  AuthenticationError,
  ValidationError,
  ConfirmAuthRequest,
  TokenStorage,
  LoggingConfig,
  MagicLinkRequest,
  MagicLinkResponse,
  MagicLinkVerificationRequest,
  MagicLinkVerificationResponse,
  NavBarBadges,
  ExternalHelpProvider,
  MapTileRequest,
  PushProfileRequest,
  OtherActiveDrivers,
  ModalInfo
} from './types';
import { FileTokenStorage } from './TokenStorage';
import { Logger } from './Logger';

/**
 * Main API class for interacting with Bolt Driver API
 * Handles authentication, token management, and all API endpoints
 */
export class BoltDriverAPI {
  private readonly client: AxiosInstance;
  private readonly config: BoltApiConfig;
  private accessToken: string | undefined;
  private refreshToken: string | undefined;
  private sessionInfo: SessionInfo | undefined;
  private deviceInfo: DeviceInfo;
  private authConfig: AuthConfig;
  private tokenStorage: TokenStorage;
  private logger: Logger;

  /**
   * Create a new BoltDriverAPI instance
   * @param deviceInfo - Device information (ID, type, name, OS version, app version)
   * @param authConfig - Authentication configuration (brand, country, language, theme)
   * @param config - Optional API configuration (base URLs, timeouts, etc.)
   * @param tokenStorage - Optional token storage implementation (defaults to file-based)
   * @param loggingConfig - Optional logging configuration
   */
  constructor(
    deviceInfo: DeviceInfo,
    authConfig: AuthConfig,
    config?: Partial<BoltApiConfig>,
    tokenStorage?: TokenStorage,
    loggingConfig?: Partial<LoggingConfig>
  ) {
    this.deviceInfo = deviceInfo;
    this.authConfig = authConfig;
    
    this.config = {
      baseUrl: 'https://partnerdriver.live.boltsvc.net/partnerDriver',
      driverBaseUrl: 'https://driver.live.boltsvc.net/driver',
      companyBaseUrl: 'https://europe-company.taxify.eu',
      timeout: 30000,
      retries: 3,
      userAgent: 'Bolt Driver/181158215 CFNetwork/3826.600.31 Darwin/24.6.0',
      ...config
    };

    // Initialize token storage
    this.tokenStorage = tokenStorage || new FileTokenStorage();

    // Initialize logger
    this.logger = new Logger(loggingConfig);

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': '*/*',
        'Accept-Language': authConfig.language,
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    });

    // Add request interceptor for authentication and logging
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        
        // Log request
        this.logger.logRequest(config.method?.toUpperCase() || 'UNKNOWN', config.url || '', config.data);
        
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling and logging
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response
        this.logger.logResponse(
          response.config.method?.toUpperCase() || 'UNKNOWN',
          response.config.url || '',
          response.data
        );
        return response;
      },
      (error) => {
        const startTime = error.config?.metadata?.startTime;
        const duration = startTime ? Date.now() - startTime : undefined;
        
        // Log error
        this.logger.logError(
          error.config?.method?.toUpperCase() || 'UNKNOWN',
          error.config?.url || '',
          error,
          duration
        );

        if (error.response) {
          const { status, data } = error.response;
          if (status === 401) {
            throw new AuthenticationError('Authentication failed', status, data);
          } else if (status === 400) {
            throw new ValidationError('Invalid request', status, data);
          } else {
            throw new BoltApiError(`API request failed: ${data?.message || error.message}`, status, data);
          }
        }
        throw new BoltApiError(`Network error: ${error.message}`, 0);
      }
    );

    // Initialize authentication from stored token
    this.initializeFromStoredToken();
  }

  /**
   * Initialize authentication from stored token
   * @private
   */
  private async initializeFromStoredToken(): Promise<void> {
    try {
      const tokenData = await this.tokenStorage.loadToken();
      if (tokenData) {
        this.accessToken = tokenData.token;
        this.sessionInfo = tokenData.sessionInfo;
        this.logger.info('Restored authentication from stored token');
      }
    } catch (error) {
      this.logger.warn('Failed to restore authentication from stored token', error);
    }
  }

  /**
   * Start authentication process with phone number
   * @param phoneNumber - Phone number in international format (e.g., +48123456789)
   * @returns Promise resolving to authentication start response
   * @throws {BoltApiError} When authentication fails
   */
  async startAuthentication(phoneNumber: string): Promise<StartAuthResponse> {
    // Try different endpoint variations
    const endpoints = [
      `${this.config.baseUrl}/startAuthentication`,
      `${this.config.baseUrl}/v2/startAuthentication`,
      `${this.config.baseUrl}/v1/startAuthentication`
    ];
    
    const params = this.buildAuthParams();
    const data = {
      phone: phoneNumber,
      device_uid: this.deviceInfo.deviceId,
      version: this.deviceInfo.appVersion,
      device_os_version: this.deviceInfo.deviceOsVersion
    };

    let lastError: any;
    
    // Try each endpoint until one works
    for (const url of endpoints) {
      try {
        this.logger.info('Starting authentication', { phoneNumber: phoneNumber.substring(0, 6) + '***' });
        this.logger.debug('Authentication request data', { url, params, data });
        
        // Use axios directly for authentication to avoid base URL conflicts
        const response = await axios.post(url, data, { 
          params,
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': '*/*',
            'Accept-Language': this.authConfig.language,
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Content-Type': 'application/json'
          },
          timeout: this.config.timeout
        });
        
        this.logger.debug('Raw authentication response', { 
          status: response.status, 
          statusText: response.statusText,
          headers: response.headers,
          data: response.data 
        });
        
        // Handle different response formats
        let authData: StartAuthResponse;
        
        if (response.data && response.data.data) {
          // Standard ApiResponse format
          authData = response.data.data;
        } else if (response.data && response.data.verification_token) {
          // Direct StartAuthResponse format
          authData = response.data;
        } else {
          // Log the actual response for debugging
          this.logger.error('Unexpected response format', { 
            responseData: response.data,
            responseStatus: response.status 
          });
          throw new BoltApiError(
            `Invalid response format from authentication server. Expected StartAuthResponse but got: ${JSON.stringify(response.data)}`, 
            response.status, 
            response.data
          );
        }
        
        // Validate the response has required fields
        if (!authData.verification_token) {
          throw new BoltApiError(
            'Response missing verification_token field', 
            response.status, 
            authData
          );
        }
        
        this.logger.info('Authentication started successfully', { 
          verificationTokenLength: authData.verification_token?.length || 0,
          channels: authData.available_verification_code_channels || []
        });
        return authData;
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`Authentication failed for endpoint ${url}`, error);
        
        // If this is a BoltApiError, don't retry
        if (error instanceof BoltApiError) {
          throw error;
        }
        
        // Continue to next endpoint if this one failed
        continue;
      }
    }
    
    // If we get here, all endpoints failed
    this.logger.error('All authentication endpoints failed', { lastError });
    
    // Enhanced error handling for the last error
    if (lastError && typeof lastError === 'object' && 'isAxiosError' in lastError && lastError.isAxiosError) {
      const axiosError = lastError as any;
      if (axiosError.response) {
        const { status, data } = axiosError.response;
        this.logger.error('Axios error response', { status, data });
        
        if (status === 404) {
          throw new BoltApiError('Authentication endpoint not found. Please check if the API is available.', status, data);
        } else if (status === 400) {
          throw new BoltApiError(`Invalid request: ${data?.message || 'Bad request'}`, status, data);
        } else if (status === 429) {
          throw new BoltApiError('Too many authentication attempts. Please wait before trying again.', status, data);
        } else if (status >= 500) {
          throw new BoltApiError('Authentication server error. Please try again later.', status, data);
        } else {
          throw new BoltApiError(`Authentication failed with status ${status}: ${JSON.stringify(data)}`, status, data);
        }
      } else if (axiosError.request) {
        throw new BoltApiError('Unable to reach authentication server. Please check your internet connection.', 0);
      }
    }
    
    throw new BoltApiError(`Failed to start authentication: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`, 0);
  }

  /**
   * Confirm authentication with SMS code
   * @param verificationToken - Token received from startAuthentication
   * @param code - SMS verification code
   * @returns Promise resolving to authentication confirmation response
   * @throws {BoltApiError} When authentication confirmation fails
   */
  async confirmAuthentication(verificationToken: string, code: string): Promise<ConfirmAuthResponse> {
    try {
      this.logger.info('Confirming authentication with SMS code');
      
      const params = this.buildAuthParams();
      
      // Ensure required parameters are present
      if (!params['deviceId'] || !params['version'] || !params['device_os_version']) {
        throw new BoltApiError('Missing required device parameters', 0);
      }
      
      const requestBody: ConfirmAuthRequest = {
        device_uid: params['deviceId'],
        verification_token: verificationToken,
        version: params['version'],
        verification_code: code,
        device_os_version: params['device_os_version']
      };

      this.logger.debug('Confirming authentication request', { 
        url: `${this.config.baseUrl}/v2/confirmAuthentication`,
        params, 
        requestBody 
      });

      const response = await axios.post(
        `${this.config.baseUrl}/v2/confirmAuthentication`,
        requestBody,
        { params }
      );

      this.logger.debug('Raw confirmation response', { 
        status: response.status, 
        statusText: response.statusText,
        data: response.data 
      });

      // Handle different response formats
      let authData: ConfirmAuthResponse;
      
      if (response.data && response.data.data) {
        // Standard ApiResponse format
        authData = response.data.data;
      } else if (response.data && response.data.token) {
        // Direct ConfirmAuthResponse format
        authData = response.data;
      } else {
        // Log the actual response for debugging
        this.logger.error('Unexpected confirmation response format', { 
          responseData: response.data,
          responseStatus: response.status 
        });
        throw new BoltApiError(
          `Invalid response format from authentication confirmation. Expected ConfirmAuthResponse but got: ${JSON.stringify(response.data)}`, 
          response.status, 
          response.data
        );
      }

      // Validate the response has required fields
      if (!authData.token || !authData.token.refresh_token) {
        throw new BoltApiError(
          'Response missing required token fields', 
          response.status, 
          authData
        );
      }
      
      // Store the refresh token as the access token for future requests
      // The refresh token is what we use for authenticated API calls
      this.accessToken = authData.token.refresh_token;
      this.sessionInfo = {
        sessionId: '', // Will be populated later
        driverId: 0, // Will be populated later
        partnerId: 0, // Will be populated later
        companyId: 0, // Will be populated later
        companyCityId: 0, // Will be populated later
        accessToken: authData.token.refresh_token,
        refreshToken: authData.token.refresh_token, // Same token for now
        tokenType: authData.token.token_type,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // Assume 24 hour expiry
      };

      // Save token to storage
      await this.tokenStorage.saveToken(this.accessToken, this.sessionInfo);
      this.logger.info('Authentication confirmed and token saved');

      return authData;
    } catch (error) {
      this.logger.error('Authentication confirmation failed', error);
      
      const axiosError = error as any;
      if (axiosError.response) {
        throw new BoltApiError(
          `Authentication confirmation failed: ${axiosError.response.data?.message || axiosError.response.statusText}`,
          axiosError.response.status
        );
      }
      throw new BoltApiError(`Authentication confirmation failed: ${axiosError.message}`, 0);
    }
  }

  /**
   * Get driver access token
   * @returns Promise resolving to access token string
   * @throws {AuthenticationError} When not authenticated
   * @throws {BoltApiError} When token retrieval fails
   */
  async getAccessToken(): Promise<string> {
    if (!this.sessionInfo) {
      throw new AuthenticationError('Not authenticated. Please authenticate first.', 401);
    }

    const url = `${this.config.driverBaseUrl}/getAccessToken`;
    const params = this.buildRequestParams();
    
    try {
      this.logger.info('Getting driver access token');
      const response = await this.client.post<ApiResponse<{ access_token: string }>>(url, {}, { params });
      this.accessToken = response.data.data.access_token;
      
      // Update session info and save
      if (this.sessionInfo) {
        this.sessionInfo.accessToken = this.accessToken;
        await this.tokenStorage.saveToken(this.accessToken, this.sessionInfo);
      }
      
      this.logger.info('Driver access token retrieved successfully');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get driver access token', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get access token: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Authenticate using a magic link token
   * @param token - The token extracted from the magic link
   * @param deviceInfo - Device information for authentication
   * @param gpsInfo - GPS information for the request
   * @returns Promise resolving to the authentication response
   */
  async authenticateWithMagicLink(
    token: string,
    deviceInfo: DeviceInfo,
    gpsInfo: GpsInfo
  ): Promise<MagicLinkVerificationResponse> {
    try {
      const requestData: MagicLinkVerificationRequest = {
        device_os_version: deviceInfo.deviceOsVersion,
        device_name: deviceInfo.deviceName,
        device_uid: deviceInfo.deviceId,
        version: deviceInfo.appVersion,
        token: token
      };

      // Build query parameters based on HAR entry
      const queryParams = new URLSearchParams({
        brand: 'bolt',
        deviceId: deviceInfo.deviceId,
        deviceType: deviceInfo.deviceType,
        device_name: deviceInfo.deviceName,
        device_os_version: deviceInfo.deviceOsVersion,
        gps_accuracy_meters: gpsInfo.accuracyMeters.toString(),
        gps_adjusted_bearing: gpsInfo.adjustedBearing.toString(),
        gps_age: gpsInfo.age.toString(),
        gps_bearing: gpsInfo.bearing.toString(),
        gps_bearing_accuracy_deg: gpsInfo.bearingAccuracyDeg.toString(),
        gps_lat: gpsInfo.latitude.toString(),
        gps_lng: gpsInfo.longitude.toString(),
        gps_speed: gpsInfo.speed.toString(),
        gps_speed_accuracy_mps: gpsInfo.speedAccuracyMps.toString(),
        gps_timestamp: gpsInfo.timestamp.toString(),
        language: 'en-GB',
        session_id: `${deviceInfo.deviceId}d${Date.now()}.1366549`,
        theme: 'dark',
        version: deviceInfo.appVersion
      });

      const response = await this.client.post<MagicLinkVerificationResponse>(
        `${this.config.driverBaseUrl}/authenticateWithMagicLink?${queryParams.toString()}`,
        requestData
      );

      if (response.data.code === 0) {
        if (response.data.data.refresh_token) {
          this.refreshToken = response.data.data.refresh_token;
          
          // Exchange refresh token for access token
          await this.exchangeRefreshToken(gpsInfo);
          
          // Create a minimal session info for token storage
          const sessionInfo: SessionInfo = {
            sessionId: '',
            driverId: 0,
            partnerId: 0,
            companyId: 0,
            companyCityId: 0
          };
          
          // Save the access token
          await this.tokenStorage.saveToken(this.accessToken || '', sessionInfo);
        }
      }
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to authenticate with magic link', error);
      throw new AuthenticationError('Magic link authentication failed', 0);
    }
  }

  /**
   * Get the current refresh token
   * @returns The current refresh token or undefined if not set
   */
  getCurrentRefreshToken(): string | undefined {
    return this.refreshToken;
  }

  /**
   * Get the current access token
   * @returns The current access token or undefined if not set
   */
  getCurrentAccessToken(): string | undefined {
    return this.accessToken;
  }

  /**
   * Check if currently authenticated
   * @returns True if both access token and refresh token are available
   */
  isAuthenticated(): boolean {
    return !!(this.accessToken && this.refreshToken);
  }

  /**
   * Get driver state and polling information
   * @param gpsInfo - GPS location and accuracy information
   * @param appState - Application state (default: 'background')
   * @returns Promise resolving to driver state information
   * @throws {BoltApiError} When API request fails
   */
  async getDriverState(gpsInfo: GpsInfo, appState: string = 'background'): Promise<DriverState> {
    const url = `${this.config.companyBaseUrl}/polling/driver`;
    const params = this.buildRequestParams(gpsInfo);
    const data = { app_state: appState };

    try {
      this.logger.info('Getting driver state', { appState, gpsInfo });
      const response = await this.client.post(url, data, { params });
      return this.parseApiResponse<DriverState>(response);
    } catch (error) {
      this.logger.error('Failed to get driver state', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get driver state: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Get driver home screen data
   * @param gpsInfo - GPS location and accuracy information
   * @returns Promise resolving to home screen data
   * @throws {BoltApiError} When API request fails
   */
  async getDriverHomeScreen(gpsInfo: GpsInfo): Promise<HomeScreenData> {
    const url = `${this.config.companyBaseUrl}/orderDriver/v1/getDriverHomeScreen`;
    const params = this.buildRequestParams(gpsInfo);

    try {
      this.logger.info('Getting driver home screen data', { gpsInfo });
      const response = await this.client.get(url, { params });
      return this.parseApiResponse<HomeScreenData>(response);
    } catch (error) {
      this.logger.error('Failed to get driver home screen', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get driver home screen: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Get working time information
   * @param gpsInfo - GPS location and accuracy information
   * @returns Promise resolving to working time information
   * @throws {BoltApiError} When API request fails
   */
  async getWorkingTimeInfo(gpsInfo: GpsInfo): Promise<WorkingTimeInfo> {
    const url = `${this.config.driverBaseUrl}/v2/getWorkingTimeInfo`;
    const params = this.buildRequestParams(gpsInfo);

    try {
      this.logger.info('Getting working time information', { gpsInfo });
      const response = await this.client.get(url, { params });
      return this.parseApiResponse<WorkingTimeInfo>(response);
    } catch (error) {
      this.logger.error('Failed to get working time info', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get working time info: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Get dispatch preferences and settings
   * @param gpsInfo - GPS location and accuracy information
   * @returns Promise resolving to dispatch preferences
   * @throws {BoltApiError} When API request fails
   */
  async getDispatchPreferences(gpsInfo: GpsInfo): Promise<DispatchPreferences> {
    const url = `${this.config.companyBaseUrl}/dispatchPref/v1/getSettings`;
    const params = this.buildRequestParams(gpsInfo);

    try {
      this.logger.info('Getting dispatch preferences', { gpsInfo });
      const response = await this.client.get(url, { params });
      return this.parseApiResponse<DispatchPreferences>(response);
    } catch (error) {
      this.logger.error('Failed to get dispatch preferences', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get dispatch preferences: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Get maps configuration
   * @param gpsInfo - GPS location and accuracy information
   * @returns Promise resolving to maps configuration
   * @throws {BoltApiError} When API request fails
   */
  async getMapsConfigs(gpsInfo: GpsInfo): Promise<MapsConfig> {
    const url = `${this.config.companyBaseUrl}/orderDriver/v1/getMapsConfigs`;
    const params = this.buildRequestParams(gpsInfo);
    const data = {};

    try {
      this.logger.info('Getting maps configuration', { gpsInfo });
      const response = await this.client.post(url, data, { params });
      return this.parseApiResponse<MapsConfig>(response);
    } catch (error) {
      this.logger.error('Failed to get maps configs', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get maps configs: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Get driver navigation bar badge information
   * @param gpsInfo - GPS location and accuracy information
   * @returns Promise resolving to navigation bar badge information
   * @throws {BoltApiError} When API request fails
   */
  async getDriverNavBarBadges(gpsInfo: GpsInfo): Promise<NavBarBadges> {
    const url = `${this.config.driverBaseUrl}/getDriverNavBarBadges`;
    const params = this.buildRequestParams(gpsInfo);

    try {
      this.logger.info('Getting navigation bar badges', { gpsInfo });
      const response = await this.client.get<ApiResponse<NavBarBadges>>(url, { params });
      
      // Log the actual response structure for debugging
      this.logger.info('Navigation bar badges response', {
        status: response.status,
        statusText: response.statusText,
        responseData: response.data,
        hasData: !!response.data,
        hasDataData: !!(response.data && response.data.data)
      });
      
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data) {
        // Handle case where response.data is the actual data
        this.logger.info('Response data is direct, not wrapped in ApiResponse format');
        return response.data as unknown as NavBarBadges;
      } else {
        this.logger.warn('No data in response');
        return {} as NavBarBadges;
      }
    } catch (error) {
      this.logger.error('Failed to get navigation bar badges', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get navigation bar badges: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Get emergency assist provider information
   * @param gpsInfo - GPS location and accuracy information
   * @returns Promise resolving to emergency assist provider information
   * @throws {BoltApiError} When API request fails
   */
  async getEmergencyAssistProvider(gpsInfo: GpsInfo): Promise<ExternalHelpProvider> {
    const url = `${this.config.driverBaseUrl}/safety/emergencyAssist/getExternalHelpProvider`;
    const params = this.buildRequestParams(gpsInfo);
    params.lat = gpsInfo.latitude;
    params.lng = gpsInfo.longitude;

    try {
      this.logger.info('Getting emergency assist provider', { gpsInfo });
      const response = await this.client.get<ApiResponse<ExternalHelpProvider>>(url, { params });
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to get emergency assist provider', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get emergency assist provider: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Get map tiles for surge heatmap
   * @param gpsInfo - GPS location and accuracy information
   * @param tilesCollectionId - Collection ID for the tiles
   * @param x - X coordinate of the tile
   * @param y - Y coordinate of the tile
   * @param zoom - Zoom level of the tile
   * @returns Promise resolving to tile data as ArrayBuffer
   * @throws {BoltApiError} When API request fails
   */
  async getMapTile(
    gpsInfo: GpsInfo,
    tilesCollectionId: string,
    x: number,
    y: number,
    zoom: number
  ): Promise<ArrayBuffer> {
    const url = `${this.config.driverBaseUrl}/v2/getTile`;
    const params = this.buildRequestParams(gpsInfo);
    params.tiles_collection_id = tilesCollectionId;
    params.x = x;
    params.y = y;
    params.zoom = zoom;

    try {
      this.logger.info('Getting map tile', { tilesCollectionId, x, y, zoom, gpsInfo });
      const response = await this.client.get(url, { 
        params,
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get map tile', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get map tile: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Get map tile using MapTileRequest object
   * @param gpsInfo - GPS location and accuracy information
   * @param tileRequest - Map tile request parameters
   * @returns Promise resolving to tile data as ArrayBuffer
   * @throws {BoltApiError} When API request fails
   */
  async getMapTileWithRequest(gpsInfo: GpsInfo, tileRequest: MapTileRequest): Promise<ArrayBuffer> {
    return this.getMapTile(
      gpsInfo,
      tileRequest.tiles_collection_id,
      tileRequest.x,
      tileRequest.y,
      tileRequest.zoom
    );
  }

  /**
   * Set device token for push notifications
   * @param deviceToken - Device token for push notifications
   * @returns Promise that resolves when token is set
   * @throws {BoltApiError} When API request fails
   */
  async setDeviceToken(deviceToken: string): Promise<void> {
    const url = `${this.config.driverBaseUrl}/setDeviceToken`;
    const params = this.buildRequestParams();
    const data = { device_token: deviceToken };

    try {
      this.logger.info('Setting device token for push notifications', { deviceToken: deviceToken.substring(0, 10) + '***' });
      await this.client.post<ApiResponse<void>>(url, data, { params });
      this.logger.info('Device token set successfully');
    } catch (error) {
      this.logger.error('Failed to set device token', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to set device token: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Store driver information
   * @param driverData - Driver data to store
   * @returns Promise that resolves when data is stored
   * @throws {BoltApiError} When API request fails
   */
  async storeDriverInfo(driverData: any): Promise<void> {
    const url = `${this.config.driverBaseUrl}/store`;
    const params = this.buildRequestParams();
    const data = driverData;

    try {
      this.logger.info('Storing driver information', { driverData });
      await this.client.post<ApiResponse<void>>(url, data, { params });
      this.logger.info('Driver information stored successfully');
    } catch (error) {
      this.logger.error('Failed to store driver info', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to store driver info: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Send magic link to email for authentication
   * @param email - Email address to send magic link to
   * @returns Promise resolving to magic link response
   * @throws {BoltApiError} When magic link sending fails
   */
  async sendMagicLink(email: string): Promise<MagicLinkResponse> {
    try {
      this.logger.info('Sending magic link to email', { email: email.substring(0, 3) + '***' });
      
      const requestBody: MagicLinkRequest = {
        device_name: this.deviceInfo.deviceName,
        version: this.deviceInfo.appVersion,
        device_uid: this.deviceInfo.deviceId,
        email,
        device_os_version: this.deviceInfo.deviceOsVersion,
        brand: this.authConfig.brand
      };

      const response = await axios.post(
        `${this.config.driverBaseUrl}/sendMagicLink`,
        requestBody,
        { 
          params: this.buildAuthParams(),
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': '*/*',
            'Accept-Language': this.authConfig.language,
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.info('Magic link sent successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to send magic link', error);
      throw new BoltApiError(`Failed to send magic link: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Extract token from magic link URL
   * @param magicLinkUrl - The magic link URL received via email
   * @returns Extracted token or null if not found
   * @throws {ValidationError} When URL format is invalid
   */
  static extractTokenFromMagicLink(magicLinkUrl: string): string {
    try {
      // Handle AWS tracking redirect URLs
      let actualUrl = magicLinkUrl;
      
      // If it's an AWS tracking URL, extract the actual URL
      if (magicLinkUrl.includes('awstrack.me')) {
        // Extract everything after L0/ and before any hash or tracking parameters
        const match = magicLinkUrl.match(/\/L0\/([^/]+)/);
        if (match && match[1]) {
          actualUrl = decodeURIComponent(match[1]);
        }
      }

      // Note: This is a static method, so no logger available

      // Parse the URL to extract the token parameter
      const url = new URL(actualUrl);
      const token = url.searchParams.get('token');
      
      if (!token) {
        throw new ValidationError('Token not found in magic link URL', 400);
      }

      return token;
    } catch (error) {
      const errorMsg = `Failed to extract token from magic link: ${error instanceof Error ? error.message : 'Invalid URL format'}`;
      throw new ValidationError(errorMsg, 400);
    }
  }

  /**
   * Get driver phone details
   * @param gpsInfo - GPS location and accuracy information
   * @returns Promise resolving to driver phone details
   * @throws {BoltApiError} When API request fails
   */
  async getDriverPhoneDetails(gpsInfo: GpsInfo): Promise<any> {
    const url = `${this.config.driverBaseUrl}/driverPhoneDetails`;
    const params = this.buildRequestParams(gpsInfo);
    const data = {};

    try {
      this.logger.info('Getting driver phone details', { gpsInfo });
      const response = await this.client.post<ApiResponse<any>>(url, data, { params });
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to get driver phone details', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get driver phone details: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Get other active drivers in the area
   * @param gpsInfo - GPS location and accuracy information
   * @returns Promise resolving to list of other active drivers
   * @throws {BoltApiError} When API request fails
   */
  async getOtherActiveDrivers(gpsInfo: GpsInfo): Promise<OtherActiveDrivers> {
    const url = 'https://node.bolt.eu/search/driver/getOtherActiveDrivers';
    const params = this.buildRequestParams(gpsInfo);

    try {
      this.logger.info('Getting other active drivers', { gpsInfo });
      const response = await this.client.get(url, { params });
      return this.parseApiResponse<OtherActiveDrivers>(response);
    } catch (error) {
      this.logger.error('Failed to get other active drivers', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get other active drivers: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Get modal information for home screen
   * @param gpsInfo - GPS location and accuracy information
   * @param event - Event type (e.g., 'home_screen')
   * @returns Promise resolving to modal data
   * @throws {BoltApiError} When API request fails
   */
  async getModal(gpsInfo: GpsInfo, event: string = 'home_screen'): Promise<ModalInfo> {
    const url = `${this.config.driverBaseUrl}/modal`;
    const params = this.buildRequestParams(gpsInfo);
    params.event = event;

    try {
      this.logger.info('Getting modal information', { event, gpsInfo });
      const response = await this.client.get(url, { params });
      return this.parseApiResponse<ModalInfo>(response);
    } catch (error) {
      this.logger.error('Failed to get modal information', error);
      if (error instanceof BoltApiError) {
        throw error;
      }
      throw new BoltApiError(`Failed to get modal information: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Update push profile for notifications
   * @param userId - User ID for push notifications
   * @param instanceId - Instance ID for push notifications
   * @param deviceToken - Device token for push notifications
   * @returns Promise that resolves when push profile is updated
   * @throws {BoltApiError} When API request fails
   */
  async updatePushProfile(userId: string, instanceId: string, deviceToken: string): Promise<void> {
    const url = `https://ocra-bolt.api.sinch.com/ocra/v1/users/${userId}/instances/${instanceId}/pushProfile`;
    const data: PushProfileRequest = {
      apn: [{
        bundleId: 'ee.taxify.driver',
        deviceToken: deviceToken,
        environment: 'production',
        tokenType: 'voip'
      }],
      maxPayloadSize: 4096
    };

    try {
      this.logger.info('Updating push profile', { userId, instanceId, deviceToken: deviceToken.substring(0, 10) + '***' });
      
      // Use a separate Axios instance for this request to avoid interceptors
      const sinchClient = axios.create({
        baseURL: 'https://ocra-bolt.api.sinch.com',
        timeout: this.config.timeout,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': '*/*',
          'Accept-Language': this.authConfig.language,
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json'
        }
      });

      // Attempt to update push profile
      await sinchClient.put(url, data);
      
      this.logger.info('Push profile updated successfully');
    } catch (error) {
      this.logger.error('Failed to update push profile', error);
      
      // Log the specific error details
      if (axios.isAxiosError(error)) {
        this.logger.error('Axios error details', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      
      throw new BoltApiError(`Failed to update push profile: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
    }
  }

  /**
   * Helper function to handle different API response formats
   * @param response - Axios response object
   * @returns Parsed response data or throws an error if parsing fails
   * @private
   */
  private parseApiResponse<T>(response: AxiosResponse<any>): T {
    this.logger.debug('Parsing API response', { response });
    if (response.data && response.data.data) {
      return response.data.data;
    } else if (response.data) {
      return response.data as unknown as T;
    } else {
      throw new BoltApiError('No data in response', response.status, response.data);
    }
  }

  /**
   * Build common request parameters
   * @param gpsInfo - Optional GPS information
   * @returns Request parameters object
   * @private
   */
  private buildRequestParams(gpsInfo?: GpsInfo): RequestParams {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      brand: this.authConfig.brand,
      country: this.authConfig.country,
      deviceId: this.deviceInfo.deviceId,
      deviceType: this.deviceInfo.deviceType,
      device_name: this.deviceInfo.deviceName,
      device_os_version: this.deviceInfo.deviceOsVersion,
      driver_id: this.sessionInfo?.driverId || 0,
      gps_accuracy_meters: gpsInfo?.accuracy || 0,
      gps_adjusted_bearing: gpsInfo?.bearing || 0,
      gps_age: gpsInfo?.age || 0,
      gps_lat: gpsInfo?.latitude || 0,
      gps_lng: gpsInfo?.longitude || 0,
      gps_speed: gpsInfo?.speed || 0,
      gps_timestamp: gpsInfo?.timestamp || now,
      language: this.authConfig.language,
      session_id: this.sessionInfo?.sessionId || '',
      theme: this.authConfig.theme,
      version: this.deviceInfo.appVersion
    };
  }

  /**
   * Build authentication request parameters (without session info)
   * @returns Authentication parameters object
   * @private
   */
  private buildAuthParams(): Record<string, string> {
    return {
      brand: this.authConfig.brand,
      country: this.authConfig.country,
      deviceId: this.deviceInfo.deviceId,
      deviceType: this.deviceInfo.deviceType,
      device_name: this.deviceInfo.deviceName,
      device_os_version: this.deviceInfo.deviceOsVersion,
      language: this.authConfig.language,
      version: this.deviceInfo.appVersion
    };
  }

  /**
   * Get current session information
   * @returns Current session information or undefined if not authenticated
   */
  getSessionInfo(): SessionInfo | undefined {
    return this.sessionInfo;
  }

  /**
   * Clear authentication and stored tokens
   */
  async clearAuthentication(): Promise<void> {
    this.accessToken = undefined;
    this.sessionInfo = undefined;
    await this.tokenStorage.clearToken();
    this.logger.info('Authentication cleared');
  }

  /**
   * Update GPS information for subsequent requests
   * Note: This method can be used to update GPS info for subsequent requests
   */
  updateGpsInfo(): void {
    // This method can be used to update GPS info for subsequent requests
    // Implementation depends on how you want to handle GPS updates
    this.logger.debug('GPS info update requested');
  }

  /**
   * Get the logger instance for custom logging
   * @returns Logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Update logging configuration
   * @param config - New logging configuration
   */
  updateLoggingConfig(config: Partial<LoggingConfig>): void {
    this.logger.updateConfig(config);
  }

  /**
   * Get token storage instance
   * @returns Token storage instance
   */
  getTokenStorage(): TokenStorage {
    return this.tokenStorage;
  }

  /**
   * Exchange refresh token for an access token
   * @returns Promise resolving to the new access token
   * @throws {AuthenticationError} When token exchange fails
   */
  private async exchangeRefreshToken(gpsInfo: GpsInfo): Promise<string> {
    if (!this.refreshToken) {
      throw new AuthenticationError('No refresh token available', 401);
    }

    try {
      // Build query parameters based on HAR entry
      const queryParams = new URLSearchParams({
        brand: 'bolt',
        deviceId: this.deviceInfo.deviceId,
        deviceType: this.deviceInfo.deviceType,
        device_name: this.deviceInfo.deviceName,
        device_os_version: this.deviceInfo.deviceOsVersion,
        gps_accuracy_meters: gpsInfo.accuracyMeters.toString(),
        gps_adjusted_bearing: gpsInfo.adjustedBearing.toString(),
        gps_age: gpsInfo.age.toString(),
        gps_lat: gpsInfo.latitude.toString(),
        gps_lng: gpsInfo.longitude.toString(),
        gps_speed: gpsInfo.speed.toString(),
        gps_speed_accuracy_mps: gpsInfo.speedAccuracyMps.toString(),
        gps_timestamp: gpsInfo.timestamp.toString(),
        language: 'en-GB',
        session_id: `${this.deviceInfo.deviceId}d${Date.now()}.518508`,
        theme: 'dark',
        version: this.deviceInfo.appVersion
      });

      const url = `${this.config.driverBaseUrl}/getAccessToken?${queryParams.toString()}`;
      
      const response = await this.client.post<ApiResponse<{ access_token: string, expires_timestamp: number, expires_in_seconds: number }>>(
        url, 
        {
          token_expires_in_seconds: 100,
          refresh_token: this.refreshToken,
          no_redis_cache: true,
          version: this.deviceInfo.appVersion
        }
      );

      if (response.data && response.data.data && response.data.data.access_token) {
        this.accessToken = response.data.data.access_token;
        return this.accessToken;
      } else {
        throw new AuthenticationError('Failed to exchange refresh token', 401);
      }
    } catch (error) {
      this.logger.error('Token exchange failed', error);
      throw new AuthenticationError('Token exchange failed', 401);
    }
  }
}
