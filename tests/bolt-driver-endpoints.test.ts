import { jest } from '@jest/globals';
import axios from 'axios';
import { BoltDriverAPI } from '../src/BoltDriverAPI';
import { DeviceInfo, AuthConfig, GpsInfo } from '../src/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Set up the create mock to return a properly mocked client
const mockClient = {
  post: jest.fn(),
  get: jest.fn(),
  request: jest.fn().mockImplementation(() => Promise.resolve({})),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

mockedAxios.create.mockReturnValue(mockClient as any);

describe('BoltDriverAPI - Driver Endpoints', () => {
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

  const gpsInfo: GpsInfo = {
    latitude: 51.233186,
    longitude: 22.518373,
    accuracy: 19.791364,
    bearing: 0,
    speed: -1.000007,
    timestamp: Math.floor(Date.now() / 1000),
    age: 30.01,
    accuracyMeters: 13.821502,
    adjustedBearing: 0,
    bearingAccuracyDeg: 180,
    speedAccuracyMps: 1.808204567744442
  };

  const commonParams = {
    brand: 'bolt',
    country: 'pl',
    deviceId: deviceInfo.deviceId,
    deviceType: deviceInfo.deviceType,
    deviceName: deviceInfo.deviceName,
    deviceOsVersion: deviceInfo.deviceOsVersion,
    driver_id: 'test_driver_id',
    session_id: 'test_session_id',
    gps_lat: gpsInfo.latitude,
    gps_lng: gpsInfo.longitude
  };

  beforeEach(() => {
    jest.clearAllMocks();
    api = new BoltDriverAPI(deviceInfo, authConfig);

    // Mock the ensureValidToken method to avoid token validation
    jest.spyOn(api as any, 'ensureValidToken').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('📊 Data Retrieval Endpoints', () => {
    describe('getScheduledRideRequests', () => {
      it('should fetch scheduled ride requests successfully', async () => {
        const mockResponse = {
          data: { code: 0, data: { scheduledRides: [] } }
        };
        mockClient.request.mockResolvedValue(mockResponse);

        const result = await api.getScheduledRideRequests(commonParams);
        expect(result.code).toBe(0);
        expect(mockClient.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'get',
            url: expect.stringContaining('getScheduledRideRequests')
          })
        );
      });

      it('should handle API errors', async () => {
        mockClient.request.mockRejectedValue(new Error('API Error'));
        await expect(api.getScheduledRideRequests(commonParams)).rejects.toThrow();
      });
    });

    describe('getEarningLandingScreen', () => {
      it('should fetch earning landing screen data', async () => {
        const mockResponse = {
          data: { code: 0, data: { earnings: { today: 0, week: 0 } } }
        };
        mockClient.request.mockResolvedValue(mockResponse);

        const result = await api.getEarningLandingScreen(commonParams);
        expect(result.code).toBe(0);
        expect(mockClient.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'get',
            url: expect.stringContaining('getEarningLandingScreen')
          })
        );
      });
    });

    describe('getActivityRides', () => {
      it('should fetch activity rides with group_by parameter', async () => {
        const mockResponse = {
          data: { code: 0, data: { rides: [] } }
        };
        mockClient.request.mockResolvedValue(mockResponse);

        const params = { ...commonParams, group_by: 'all' };
        const result = await api.getActivityRides(params);
        expect(result.code).toBe(0);
        expect(mockClient.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'get',
            url: expect.stringContaining('getActivityRides')
          })
        );
      });
    });

    describe('getOrderHistoryPaginated', () => {
      it('should fetch order history with pagination', async () => {
        const mockResponse = {
          data: { code: 0, data: { orders: [], totalCount: 0 } }
        };
        mockClient.request.mockResolvedValue(mockResponse);

        const params = { ...commonParams, limit: 10, offset: 0 };
        const result = await api.getOrderHistoryPaginated(params);
        expect(result.code).toBe(0);
        expect(mockClient.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'get',
            url: expect.stringContaining('getOrderHistoryPaginated')
          })
        );
      });
    });
  });

  describe('ℹ️ Information Endpoints', () => {
    describe('getHelpDetails', () => {
      it('should fetch help details', async () => {
        const mockResponse = {
          data: { code: 0, data: { helpTopics: [] } }
        };
        mockClient.request.mockResolvedValue(mockResponse);

        const result = await api.getHelpDetails(commonParams);
        expect(result.code).toBe(0);
      });
    });

    describe('getEarnMoreDetails', () => {
      it('should fetch earn more details', async () => {
        const mockResponse = {
          data: { code: 0, data: { opportunities: [] } }
        };
        mockClient.request.mockResolvedValue(mockResponse);

        const result = await api.getEarnMoreDetails(commonParams);
        expect(result.code).toBe(0);
      });
    });

    describe('getScoreOverview', () => {
      it('should fetch driver score overview', async () => {
        const mockResponse = {
          data: { code: 0, data: { score: 85, rating: 4.5 } }
        };
        mockClient.request.mockResolvedValue(mockResponse);

        const result = await api.getScoreOverview(commonParams);
        expect(result.code).toBe(0);
      });
    });

    describe('getDriverSidebar', () => {
      it('should fetch driver sidebar information', async () => {
        const mockResponse = {
          data: { code: 0, data: { menuItems: [] } }
        };
        mockClient.request.mockResolvedValue(mockResponse);

        const result = await api.getDriverSidebar(commonParams);
        expect(result.code).toBe(0);
      });
    });
  });

  describe('🛠️ Parameter Validation', () => {
    it('should validate required parameters', async () => {
      mockClient.request.mockResolvedValue({
        data: { code: 0, data: {} }
      });

      // Test with missing required parameters
      const incompleteParams = { brand: 'bolt' };
      await expect(api.getScheduledRideRequests(incompleteParams as any)).rejects.toThrow();
    });

    it('should handle optional parameters correctly', async () => {
      mockClient.request.mockResolvedValue({
        data: { code: 0, data: {} }
      });

      const result = await api.getScheduledRideRequests(commonParams);
      expect(result.code).toBe(0);
    });
  });

  describe('🔄 Response Handling', () => {
    it('should handle successful responses', async () => {
      const mockData = { test: 'data' };
      mockClient.request.mockResolvedValue({
        data: { code: 0, data: mockData }
      });

      const result = await api.getScheduledRideRequests(commonParams);
      expect(result.code).toBe(0);
      expect(result.data).toEqual(mockData);
    });

    it('should handle non-zero response codes', async () => {
      mockClient.request.mockResolvedValue({
        data: { code: 1, message: 'Error', data: null }
      });

      const result = await api.getScheduledRideRequests(commonParams);
      expect(result.code).toBe(1);
      expect(result.message).toBe('Error');
    });

    it('should handle network errors gracefully', async () => {
      mockClient.request.mockRejectedValue(new Error('Network Error'));
      await expect(api.getScheduledRideRequests(commonParams)).rejects.toThrow('Network Error');
    });
  });

  describe('📝 Request Building', () => {
    it('should build correct query parameters', async () => {
      mockClient.request.mockResolvedValue({
        data: { code: 0, data: {} }
      });

      await api.getScheduledRideRequests(commonParams);

      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
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
      mockClient.request.mockResolvedValue({
        data: { code: 0, data: {} }
      });

      await api.getScheduledRideRequests(commonParams);

      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          params: expect.objectContaining({
            gps_lat: gpsInfo.latitude,
            gps_lng: gpsInfo.longitude
          })
        })
      );
    });
  });
});
