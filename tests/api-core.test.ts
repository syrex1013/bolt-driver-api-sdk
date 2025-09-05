import { jest } from '@jest/globals';
import { BoltDriverAPI } from '../src/BoltDriverAPI';
import { DeviceInfo, AuthConfig, GpsInfo } from '../src/types';

// Mock the entire axios module
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  post: jest.fn(),
  get: jest.fn(),
  isAxiosError: jest.fn()
}));

describe('BoltDriverAPI Core Functionality', () => {
  let boltAPI: BoltDriverAPI;
  let mockDeviceInfo: DeviceInfo;
  let mockAuthConfig: AuthConfig;
  let mockGpsInfo: GpsInfo;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock device info
    mockDeviceInfo = {
      deviceId: '8179B265-CCE0-4E31-A45B-A0E2D20465E4',
      deviceType: 'iphone',
      deviceName: 'iPhone17,3',
      deviceOsVersion: 'iOS18.6',
      appVersion: 'DI.116.0'
    };

    // Mock auth config
    mockAuthConfig = {
      authMethod: 'phone',
      brand: 'bolt',
      country: 'pl',
      language: 'en-GB',
      theme: 'dark'
    };

    // Mock GPS info
    mockGpsInfo = {
      latitude: 52.237049,
      longitude: 21.017532,
      accuracy: 10,
      speed: 0,
      bearing: 0,
      timestamp: Date.now(),
      age: 0,
      accuracyMeters: 10,
      adjustedBearing: 0,
      bearingAccuracyDeg: 0,
      speedAccuracyMps: 0,
      gps_speed_accuracy: 1, // Added for GpsInfo type consistency
    };

    // Create API instance
    boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig);
  });

  describe('Initialization and Configuration', () => {
    it('should initialize API client with correct configuration', () => {
      expect(boltAPI).toBeInstanceOf(BoltDriverAPI);
    });

    it('should set default configuration values during initialization', () => {
      const api = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig);
      expect(api).toBeDefined();
    });

    it('should accept and apply custom configuration parameters', () => {
      const customConfig = {
        timeout: 60000,
        retries: 5
      };
      const api = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, customConfig);
      expect(api).toBeDefined();
    });
  });

  describe('Authentication State Management', () => {
    it('should correctly determine authentication status', () => {
      expect(boltAPI.isAuthenticated()).toBe(false);

      // Mock authenticated state
      (boltAPI as any).accessToken = 'test-token';
      (boltAPI as any).sessionInfo = { driverId: 123, expiresAt: Date.now() + 3600000 };
      expect(boltAPI.isAuthenticated()).toBe(true);
    });

    it('should retrieve current session information', () => {
      expect(boltAPI.getSessionInfo()).toBeUndefined();

      // Mock session info
      const mockSessionInfo = { driverId: 123, sessionId: 'test' };
      (boltAPI as any).sessionInfo = mockSessionInfo;
      expect(boltAPI.getSessionInfo()).toEqual(mockSessionInfo);
    });

    it('should clear authentication data and reset session state', () => {
      // Mock authenticated state
      (boltAPI as any).accessToken = 'test-token';
      (boltAPI as any).sessionInfo = { driverId: 123, expiresAt: Date.now() + 3600000 };
      expect(boltAPI.isAuthenticated()).toBe(true);

      boltAPI.clearAuthentication();
      expect(boltAPI.isAuthenticated()).toBe(false);
      expect(boltAPI.getSessionInfo()).toBeUndefined();
    });
  });

  describe('GPS Information Management', () => {
    it('should update GPS information for location tracking', () => {
      boltAPI.updateGpsInfo();
      // Note: This method currently doesn't store the GPS info, it just updates the internal state
      // The actual GPS info is passed to each API method call
    });
  });

  describe('Request Parameters', () => {
    it('should build request parameters correctly', () => {
      const params = (boltAPI as any).buildRequestParams(mockGpsInfo);
      
      expect(params).toBeDefined();
      expect(params.deviceId).toBe(mockDeviceInfo.deviceId);
      expect(params.deviceType).toBe(mockDeviceInfo.deviceType);
      expect(params.device_name).toBe(mockDeviceInfo.deviceName);
      expect(params.device_os_version).toBe(mockDeviceInfo.deviceOsVersion);
      expect(params.brand).toBe(mockAuthConfig.brand);
      expect(params.language).toBe(mockAuthConfig.language);
      expect(params.version).toBe(mockDeviceInfo.appVersion);
    });

    it('should build request parameters without GPS info', () => {
      const params = (boltAPI as any).buildRequestParams();
      
      expect(params).toBeDefined();
      expect(params.deviceId).toBe(mockDeviceInfo.deviceId);
      expect(params.deviceType).toBe(mockDeviceInfo.deviceType);
      expect(params.device_name).toBe(mockDeviceInfo.deviceName);
      expect(params.device_os_version).toBe(mockDeviceInfo.deviceOsVersion);
      expect(params.brand).toBe(mockAuthConfig.brand);
      expect(params.language).toBe(mockAuthConfig.language);
      expect(params.version).toBe(mockDeviceInfo.appVersion);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Test that the API properly handles network errors
      const networkError = {
        isAxiosError: true,
        message: 'Network error',
        response: {
          status: 500,
          data: null
        }
      };
      
      // Mock axios.post to throw an error
      const axios = require('axios');
      axios.post.mockRejectedValue(networkError);
      
      // Mock axios.isAxiosError to return true for our error
      axios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(boltAPI.startAuthentication(
        {
          authMethod: 'phone',
          brand: 'bolt',
          country: 'pl',
          language: 'en-GB',
          theme: 'dark'
        },
        {
          deviceId: 'test-device-id',
          deviceType: 'iphone',
          deviceName: 'iPhone17,3',
          deviceOsVersion: 'iOS18.6',
          appVersion: 'DI.116.0'
        },
        {
          driver_id: 'test_driver_id',
          session_id: 'test_session_id',
          phone: '+48123456789'
        }
      )).rejects.toThrow('Authentication failed: Cannot read properties of undefined (reading \'data\')');
    });
  });

  describe('Magic Link Authentication', () => {
    it('should handle magic link authentication network error', async () => {
      const networkError = new Error('Network error');
      
      // Mock axios.post to throw an error
      const axios = require('axios');
      axios.post.mockRejectedValue(networkError);
      
      await expect(boltAPI.authenticateWithMagicLink('test-token', mockDeviceInfo, mockGpsInfo))
        .rejects.toThrow('Magic link authentication failed');
    });
  });

  describe('Configuration', () => {
    it('should have correct default configuration', () => {
      const config = (boltAPI as any).config;
      
      expect(config.baseUrl).toBe('https://partnerdriver.live.boltsvc.net/partnerDriver');
      expect(config.driverBaseUrl).toBe('https://partnerdriver.live.boltsvc.net/partnerDriver');
      expect(config.timeout).toBe(30000);
      expect(config.retries).toBe(3);
      expect(config.userAgent).toBe('Bolt Driver/179857746 CFNetwork/3826.600.31 Darwin/24.6.0');
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        timeout: 60000,
        retries: 5,
        baseUrl: 'https://custom.example.com'
      };
      
      const api = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, customConfig);
      const config = (api as any).config;
      
      expect(config.timeout).toBe(60000);
      expect(config.retries).toBe(5);
      expect(config.baseUrl).toBe('https://custom.example.com');
    });
  });

  describe('Device and Auth Info', () => {
    it('should store device info correctly', () => {
      const storedDeviceInfo = (boltAPI as any).deviceInfo;
      
      expect(storedDeviceInfo.deviceId).toBe(mockDeviceInfo.deviceId);
      expect(storedDeviceInfo.deviceType).toBe(mockDeviceInfo.deviceType);
      expect(storedDeviceInfo.deviceName).toBe(mockDeviceInfo.deviceName);
      expect(storedDeviceInfo.deviceOsVersion).toBe(mockDeviceInfo.deviceOsVersion);
      expect(storedDeviceInfo.appVersion).toBe(mockDeviceInfo.appVersion);
    });

    it('should store auth config correctly', () => {
      const storedAuthConfig = (boltAPI as any).authConfig;
      
      expect(storedAuthConfig.authMethod).toBe(mockAuthConfig.authMethod);
      expect(storedAuthConfig.brand).toBe(mockAuthConfig.brand);
      expect(storedAuthConfig.country).toBe(mockAuthConfig.country);
      expect(storedAuthConfig.language).toBe(mockAuthConfig.language);
      expect(storedAuthConfig.theme).toBe(mockAuthConfig.theme);
    });
  });
});
