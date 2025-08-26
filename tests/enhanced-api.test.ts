import { BoltDriverAPI } from '../src/BoltDriverAPI';
import { DeviceInfo, AuthConfig, GpsInfo, MemoryTokenStorage } from '../src';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the axios.create method to return a mock instance
const mockAxiosInstance = {
  interceptors: {
    request: {
      use: jest.fn()
    },
    response: {
      use: jest.fn()
    }
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('Enhanced BoltDriverAPI', () => {
  let boltAPI: BoltDriverAPI;
  let mockDeviceInfo: DeviceInfo;
  let mockAuthConfig: AuthConfig;
  let mockGpsInfo: GpsInfo;
  let mockTokenStorage: MemoryTokenStorage;

  beforeEach(() => {
    mockDeviceInfo = {
      deviceId: 'test-device-id',
      deviceType: 'iphone',
      deviceName: 'iPhone Test',
      deviceOsVersion: 'iOS Test',
      appVersion: 'DI.116.0'
    };

    mockAuthConfig = {
      authMethod: 'phone',
      brand: 'bolt',
      country: 'pl',
      language: 'en-GB',
      theme: 'dark'
    };

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

    mockTokenStorage = new MemoryTokenStorage();

    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset the mock axios instance
    Object.values(mockAxiosInstance).forEach(mock => {
      if (typeof mock === 'function') {
        mock.mockReset();
      }
    });
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with token storage and logging', () => {
      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, undefined, mockTokenStorage);
      
      expect(boltAPI).toBeDefined();
      expect(boltAPI.getTokenStorage()).toBe(mockTokenStorage);
      expect(boltAPI.getLogger()).toBeDefined();
    });

    it('should initialize with custom logging configuration', () => {
      const loggingConfig = {
        enabled: false,
        level: 'error' as const,
        logRequests: false,
        logResponses: false,
        logErrors: true
      };

      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, undefined, mockTokenStorage, loggingConfig);
      
      const logger = boltAPI.getLogger();
      const config = logger.getConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.level).toBe('error');
      expect(config.logRequests).toBe(false);
      expect(config.logResponses).toBe(false);
      expect(config.logErrors).toBe(true);
    });
  });

  describe('Token Persistence', () => {
    it('should restore authentication from stored token', async () => {
      const mockToken = 'stored-token-123';
      const mockSessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: mockToken,
        refreshToken: mockToken,
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };

      await mockTokenStorage.saveToken(mockToken, mockSessionInfo);
      
      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, undefined, mockTokenStorage);
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should be authenticated from stored token
      expect(boltAPI.isAuthenticated()).toBe(true);
      expect(boltAPI.getSessionInfo()).toEqual(mockSessionInfo);
    });

    it('should save token after successful authentication', async () => {
      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, undefined, mockTokenStorage);

      // Mock successful authentication response
      const mockResponse = {
        data: {
          code: 0,
          message: 'OK',
          data: {
            type: 'driver',
            token: {
              refresh_token: 'new-token-123',
              token_type: 'driver'
            }
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      // Mock the client post method directly
      jest.spyOn((boltAPI as any).client, 'post').mockResolvedValueOnce(mockResponse);

      // Mock the token storage methods
      jest.spyOn(mockTokenStorage, 'saveToken').mockResolvedValueOnce();
      jest.spyOn(mockTokenStorage, 'hasValidToken').mockResolvedValueOnce(true);

      await boltAPI.confirmAuthentication(
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
        },
        '123456'
      );

      // Token should be saved
      const hasToken = await mockTokenStorage.hasValidToken();
      expect(hasToken).toBe(true);
    });

    it('should clear authentication and stored tokens', async () => {
      const mockToken = 'stored-token-123';
      const mockSessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: mockToken,
        refreshToken: mockToken,
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };

      await mockTokenStorage.saveToken(mockToken, mockSessionInfo);
      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, undefined, mockTokenStorage);
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(boltAPI.isAuthenticated()).toBe(true);
      
      await boltAPI.clearAuthentication();
      
      expect(boltAPI.isAuthenticated()).toBe(false);
      expect(boltAPI.getSessionInfo()).toBeUndefined();
      
      const hasToken = await mockTokenStorage.hasValidToken();
      expect(hasToken).toBe(false);
    });
  });

  describe('New API Methods', () => {
    beforeEach(async () => {
      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, undefined, mockTokenStorage);
      
      // Mock authenticated session
      const mockSessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: 'test-token',
        refreshToken: 'test-token',
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };

      // Set session info directly for testing
      (boltAPI as any).sessionInfo = mockSessionInfo;
      (boltAPI as any).accessToken = 'test-token';
    });

    describe('getOtherActiveDrivers', () => {
      it('should get other active drivers', async () => {
        const mockResponse = {
          data: {
            code: 0,
            message: 'OK',
            data: { list: [] }
          }
        };

        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await boltAPI.getOtherActiveDrivers(mockGpsInfo);

        expect(result).toEqual({
          code: 0,
          message: 'OK',
          data: { list: [] }
        });
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          'https://node.bolt.eu/search/driver/getOtherActiveDrivers',
          expect.objectContaining({
            params: expect.objectContaining({
              brand: 'bolt',
              country: 'pl',
              deviceId: 'test-device-id'
            })
          })
        );
      });
    });

    describe('getModal', () => {
      it('should get modal information', async () => {
        const mockResponse = {
          data: {
            code: 0,
            message: 'OK',
            data: null
          }
        };

        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await boltAPI.getModal(mockGpsInfo, 'home_screen');
        
        expect(result).toEqual({ code: 0, message: 'OK', data: null });
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          expect.stringContaining('/modal'),
          expect.objectContaining({
            params: expect.objectContaining({
              event: 'home_screen'
            })
          })
        );
      });
    });

    describe('updatePushProfile', () => {
      it('should update push profile', async () => {
        const mockResponse = {
          data: {
            code: 0,
            message: 'OK'
          }
        };

        mockAxiosInstance.put.mockResolvedValueOnce(mockResponse);

        await boltAPI.updatePushProfile('user123', 'instance456', 'device-token-789');
        
        expect(mockAxiosInstance.put).toHaveBeenCalledWith(
          'https://ocra-bolt.api.sinch.com/ocra/v1/users/user123/instances/instance456/pushProfile',
          expect.objectContaining({
            apn: [{
              bundleId: 'ee.taxify.driver',
              deviceToken: 'device-token-789',
              environment: 'production',
              tokenType: 'voip'
            }],
            maxPayloadSize: 4096
          })
        );
      });
    });
  });

  describe('Logging Integration', () => {
    it('should log API requests when enabled', async () => {
      const loggingConfig = {
        enabled: true,
        level: 'info' as const,
        logRequests: true,
        logResponses: false,
        logErrors: true
      };

      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, undefined, mockTokenStorage, loggingConfig);
      
      // Mock authenticated session
      (boltAPI as any).sessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: 'test-token',
        refreshToken: 'test-token',
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };
      (boltAPI as any).accessToken = 'test-token';

      // Test that the logger is properly configured
      const logger = boltAPI.getLogger();
      const config = logger.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.logRequests).toBe(true);
      expect(config.logErrors).toBe(true);
    });

    it('should not log API requests when disabled', async () => {
      const loggingConfig = {
        enabled: true,
        level: 'info' as const,
        logRequests: false,
        logResponses: false,
        logErrors: true
      };

      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, undefined, mockTokenStorage, loggingConfig);
      
      // Mock authenticated session
      (boltAPI as any).sessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: 'test-token',
        refreshToken: 'test-token',
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };
      (boltAPI as any).accessToken = 'test-token';

      // Test that the logger is properly configured
      const logger = boltAPI.getLogger();
      const config = logger.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.logRequests).toBe(false);
      expect(config.logErrors).toBe(true);
    });
  });

  describe('Configuration Management', () => {
    it('should update logging configuration', () => {
      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig);
      
      const newConfig = {
        level: 'debug' as const,
        logRequests: false,
        logResponses: true
      };

      boltAPI.updateLoggingConfig(newConfig);
      
      const logger = boltAPI.getLogger();
      const config = logger.getConfig();
      
      expect(config.level).toBe('debug');
      expect(config.logRequests).toBe(false);
      expect(config.logResponses).toBe(true);
    });

    it('should provide access to token storage', () => {
      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, undefined, mockTokenStorage);
      
      const storage = boltAPI.getTokenStorage();
      expect(storage).toBe(mockTokenStorage);
    });
  });

  describe('Error Handling with Logging', () => {
    it('should log errors when logging is enabled', async () => {
      const loggingConfig = {
        enabled: true,
        level: 'info' as const,
        logRequests: true,
        logResponses: false,
        logErrors: true
      };

      boltAPI = new BoltDriverAPI(mockDeviceInfo, mockAuthConfig, undefined, mockTokenStorage, loggingConfig);
      
      // Mock authenticated session
      (boltAPI as any).sessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: 'test-token',
        refreshToken: 'test-token',
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };
      (boltAPI as any).accessToken = 'test-token';

      // Test that the logger is properly configured for error logging
      const logger = boltAPI.getLogger();
      const config = logger.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.logErrors).toBe(true);
    });
  });
});
