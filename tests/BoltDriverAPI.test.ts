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

describe('BoltDriverAPI', () => {
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
      latitude: 51.233250,
      longitude: 22.518497,
      accuracy: 17.331588,
      bearing: 337.379444,
      speed: 0.235321,
      timestamp: 1755901903,
      age: 26.03,
      accuracyMeters: 13.821502,
      adjustedBearing: 0,
      bearingAccuracyDeg: 180,
      speedAccuracyMps: 1.808204567744442
    };

    // Create API instance
    boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig);
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(boltAPI).toBeInstanceOf(BoltDriverAPI);
    });

    it('should set default configuration values', () => {
      const api = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig);
      expect(api).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        timeout: 60000,
        retries: 5
      };
      const api = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, customConfig);
      expect(api).toBeDefined();
    });
  });

  describe('Utility Methods', () => {
    it('should check authentication status', () => {
      expect(boltAPI.isAuthenticated()).toBe(false);

      // Mock authenticated state
      (boltAPI as any).accessToken = 'test-token';
      (boltAPI as any).sessionInfo = { driverId: 123 };
      expect(boltAPI.isAuthenticated()).toBe(true);
    });

    it('should get session information', () => {
      expect(boltAPI.getSessionInfo()).toBeUndefined();

      // Mock session info
      const mockSessionInfo = { driverId: 123, sessionId: 'test' };
      (boltAPI as any).sessionInfo = mockSessionInfo;
      expect(boltAPI.getSessionInfo()).toEqual(mockSessionInfo);
    });

    it('should clear authentication', () => {
      // Mock authenticated state
      (boltAPI as any).accessToken = 'test-token';
      (boltAPI as any).sessionInfo = { driverId: 123 };
      expect(boltAPI.isAuthenticated()).toBe(true);

      boltAPI.clearAuthentication();
      expect(boltAPI.isAuthenticated()).toBe(false);
      expect(boltAPI.getSessionInfo()).toBeUndefined();
    });
  });

  describe('GPS Info Management', () => {
    it('should update GPS info', () => {
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
      const networkError = new Error('Network error');
      
      // Mock axios.post to throw an error
      const axios = require('axios');
      axios.post.mockRejectedValue(networkError);

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
          session_id: 'test_session_id'
        }
      )).rejects.toThrow('Failed to start authentication: Network error');
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
      expect(config.timeout).toBe(30000);
      expect(config.retries).toBe(3);
      expect(config.userAgent).toBe('Bolt Driver/181158215 CFNetwork/3826.600.31 Darwin/24.6.0');
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
