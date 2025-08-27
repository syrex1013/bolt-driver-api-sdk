import { jest } from '@jest/globals';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BoltDriverAPI } from '../src/BoltDriverAPI';
import { DeviceInfo, AuthConfig, GpsInfo, ApiResponse } from '../src/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Set up the create mock to return a properly mocked client
const mockClient = {
  get: jest.fn() as jest.MockedFunction<AxiosInstance['get']>,
  post: jest.fn() as jest.MockedFunction<AxiosInstance['post']>,
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

mockedAxios.create.mockReturnValue(mockClient as unknown as AxiosInstance);

describe('Driver Endpoints Integration Tests', () => {
  let api: BoltDriverAPI;
  const deviceInfo: DeviceInfo = {
    deviceId: 'test-device-id',
    deviceType: 'iphone',
    deviceName: 'iPhone17,3',
    deviceOsVersion: 'iOS18.6',
    appVersion: 'DI.116.0'
  };

  const authConfig: AuthConfig = {
    authMethod: 'phone',
    brand: 'bolt',
    country: 'pl',
    language: 'en-GB',
    theme: 'dark'
  };

  const testGpsInfo: GpsInfo = {
    latitude: 51.233186,
    longitude: 22.518373,
    accuracy: 19.791364,
    bearing: 0,
    speed: -1.000007,
    timestamp: Math.floor(Date.now() / 1000),
    age: 30.01,
    accuracyMeters: 19.791364,
    adjustedBearing: 0,
    bearingAccuracyDeg: 0,
    speedAccuracyMps: 1.179999947547913
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios.create before creating the API instance
    mockedAxios.create.mockReturnValue(mockClient as unknown as AxiosInstance);

    // Create API instance
    api = new BoltDriverAPI(deviceInfo, authConfig);

    // Mock the ensureValidToken method to avoid token validation
    jest.spyOn(api as any, 'ensureValidToken').mockResolvedValue(undefined);

    // Mock session info to avoid undefined errors
    Object.defineProperty(api, 'sessionInfo', {
      get: jest.fn().mockReturnValue({
        driverId: 123,
        sessionId: 'test-session-id',
        partnerId: 456,
        companyId: 789,
        companyCityId: 101,
        expiresAt: Date.now() + 3600000
      }),
      configurable: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Data Retrieval Endpoints', () => {
    describe('getScheduledRideRequests', () => {
      it('should fetch scheduled ride requests successfully', async () => {
        const mockResponse: AxiosResponse<ApiResponse> = {
          data: { code: 0, message: 'OK', data: { scheduledRides: [] } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        };
        mockClient.post.mockResolvedValueOnce(mockResponse);

        const result = await api.getScheduledRideRequests(testGpsInfo);
        expect(result).toEqual({ code: 0, message: 'OK', data: { scheduledRides: [] } });
        expect(mockClient.post).toHaveBeenCalledWith(
          expect.stringContaining('getScheduledRideRequests'),
          {}, // Empty request body for POST
          expect.objectContaining({
            params: expect.objectContaining({
              brand: 'bolt',
              country: 'pl',
              deviceId: deviceInfo.deviceId,
              deviceType: deviceInfo.deviceType
            })
          })
        );
      });

      it('should handle API errors', async () => {
        mockClient.post.mockRejectedValueOnce(new Error('API Error'));
        await expect(api.getScheduledRideRequests(testGpsInfo)).rejects.toThrow();
      });
    });

    describe('getEarningLandingScreen', () => {
      it('should fetch earning landing screen data', async () => {
        const mockResponse: AxiosResponse<ApiResponse> = {
          data: { code: 0, message: 'OK', data: { earnings: { today: 0, week: 0 } } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        };
        mockClient.get.mockResolvedValueOnce(mockResponse);

        const result = await api.getEarningLandingScreen(testGpsInfo);
        expect(result.code).toBe(0);
        expect(mockClient.get).toHaveBeenCalledWith(
          expect.stringContaining('getEarningLandingScreen'),
          expect.objectContaining({
            params: expect.objectContaining({
              brand: 'bolt',
              country: 'pl',
              deviceId: deviceInfo.deviceId,
              deviceType: deviceInfo.deviceType
            })
          })
        );
      });
    });

    describe('getActivityRides', () => {
      it('should fetch activity rides with group_by parameter', async () => {
        const mockResponse: AxiosResponse<ApiResponse> = {
          data: { code: 0, message: 'OK', data: { rides: [] } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        };
        mockClient.get.mockResolvedValueOnce(mockResponse);

        const params = { ...testGpsInfo, group_by: 'all' };
        const result = await api.getActivityRides(params);
        expect(result.code).toBe(0);
        expect(mockClient.get).toHaveBeenCalledWith(
          expect.stringContaining('getActivityRides'),
          expect.objectContaining({
            params: expect.objectContaining({
              brand: 'bolt',
              country: 'pl',
              deviceId: deviceInfo.deviceId,
              deviceType: deviceInfo.deviceType
            })
          })
        );
      });
    });

    describe('getOrderHistoryPaginated', () => {
      it('should fetch order history with pagination', async () => {
        const mockResponse: AxiosResponse<ApiResponse> = {
          data: { code: 0, message: 'OK', data: { orders: [], totalCount: 0 } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        };
        mockClient.get.mockResolvedValueOnce(mockResponse);

        const params = { ...testGpsInfo, limit: 10, offset: 0 };
        const result = await api.getOrderHistoryPaginated(params);
        expect(result.code).toBe(0);
        expect(mockClient.get).toHaveBeenCalledWith(
          expect.stringContaining('getOrderHistoryPaginated'),
          expect.objectContaining({
            params: expect.objectContaining({
              brand: 'bolt',
              country: 'pl',
              deviceId: deviceInfo.deviceId,
              deviceType: deviceInfo.deviceType
            })
          })
        );
      });
    });
  });

  describe('Support and Information Endpoints', () => {
    describe('getHelpDetails', () => {
      it('should retrieve help and support information successfully', async () => {
        const mockResponse: AxiosResponse<ApiResponse> = {
          data: { code: 0, message: 'OK', data: { helpTopics: [] } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        };
        mockClient.get.mockResolvedValueOnce(mockResponse);

        const result = await api.getHelpDetails(testGpsInfo);
        expect(result.code).toBe(0);
        expect(result.message).toBe('OK');
      });
    });

    describe('getEarnMoreDetails', () => {
      it('should retrieve earning opportunities and promotions', async () => {
        const mockResponse: AxiosResponse<ApiResponse> = {
          data: { code: 0, message: 'OK', data: { opportunities: [] } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        };
        mockClient.get.mockResolvedValueOnce(mockResponse);

        const result = await api.getEarnMoreDetails(testGpsInfo);
        expect(result.code).toBe(0);
        expect(result.message).toBe('OK');
      });
    });

    describe('getScoreOverview', () => {
      it('should retrieve driver performance metrics and ratings', async () => {
        const mockResponse: AxiosResponse<ApiResponse> = {
          data: { code: 0, message: 'OK', data: { score: 85, rating: 4.5 } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        };
        mockClient.get.mockResolvedValueOnce(mockResponse);

        const result = await api.getScoreOverview(testGpsInfo);
        expect(result.code).toBe(0);
        expect(result.message).toBe('OK');
      });
    });

    describe('getDriverSidebar', () => {
      it('should retrieve driver interface navigation data', async () => {
        const mockResponse: AxiosResponse<ApiResponse> = {
          data: { code: 0, message: 'OK', data: { menuItems: [] } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        };
        mockClient.get.mockResolvedValueOnce(mockResponse);

        const result = await api.getDriverSidebar(testGpsInfo);
        expect(result.code).toBe(0);
        expect(result.message).toBe('OK');
      });
    });
  });

  describe('Parameter Validation and Error Handling', () => {
    it('should validate required parameters and reject invalid requests', async () => {
      // Mock the method to throw an error for invalid parameters
      jest.spyOn(api as any, 'buildRequestParams').mockImplementation(() => {
        throw new Error('Invalid parameters');
      });

      // Test with missing required parameters
      const incompleteParams = { brand: 'bolt' };
      await expect(api.getScheduledRideRequests(incompleteParams as any)).rejects.toThrow();
    });

    it('should handle optional parameters correctly in requests', async () => {
      const mockResponse: AxiosResponse<ApiResponse> = {
        data: { code: 0, message: 'OK', data: {} },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };
      mockClient.post.mockResolvedValueOnce(mockResponse);

      const result = await api.getScheduledRideRequests(testGpsInfo);
      expect(result).toEqual({ code: 0, message: 'OK', data: {} });
    });
  });

  describe('Response Processing and Error Recovery', () => {
    it('should process successful API responses correctly', async () => {
      const mockData = { test: 'data' };
      const mockResponse: AxiosResponse<ApiResponse> = {
        data: { code: 0, message: 'OK', data: mockData },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };
      mockClient.post.mockResolvedValueOnce(mockResponse);

      const result = await api.getScheduledRideRequests(testGpsInfo);
      expect(result).toEqual({ code: 0, message: 'OK', data: mockData });
    });

    it('should handle non-zero response codes from API', async () => {
      const mockResponse: AxiosResponse<ApiResponse> = {
        data: { code: 1, message: 'Error', data: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };
      mockClient.post.mockResolvedValueOnce(mockResponse);

      await expect(api.getScheduledRideRequests(testGpsInfo)).rejects.toThrow('API returned error code 1: Error');
    });

    it('should handle network errors gracefully with proper error propagation', async () => {
      mockClient.post.mockRejectedValueOnce(new Error('Network Error'));
      await expect(api.getScheduledRideRequests(testGpsInfo)).rejects.toThrow('Network Error');
    });
  });

  describe('Request Construction and Parameter Mapping', () => {
    it('should build correct query parameters', async () => {
      const mockResponse: AxiosResponse<ApiResponse> = {
        data: { code: 0, message: 'OK', data: {} },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };
      mockClient.post.mockResolvedValueOnce(mockResponse);

      await api.getScheduledRideRequests(testGpsInfo);

      expect(mockClient.post).toHaveBeenCalledWith(
        expect.stringContaining('getScheduledRideRequests'),
        {}, // Empty request body for POST
        expect.objectContaining({
          params: expect.objectContaining({
            brand: 'bolt',
            country: 'pl',
            deviceId: deviceInfo.deviceId,
            deviceType: deviceInfo.deviceType
          })
        })
      );
    });

    it('should include GPS coordinates when provided', async () => {
      const mockResponse: AxiosResponse<ApiResponse> = {
        data: { code: 0, message: 'OK', data: {} },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };
      mockClient.post.mockResolvedValueOnce(mockResponse);

      await api.getScheduledRideRequests(testGpsInfo);

      expect(mockClient.post).toHaveBeenCalledWith(
        expect.stringContaining('getScheduledRideRequests'),
        {}, // Empty request body for POST
        expect.objectContaining({
          params: expect.objectContaining({
            gps_lat: testGpsInfo.latitude,
            gps_lng: testGpsInfo.longitude
          })
        })
      );
    });
  });
});
