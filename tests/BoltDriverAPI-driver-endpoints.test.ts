import { BoltDriverAPI } from '../dist';
import { DeviceInfo, AuthConfig } from '../dist/types';

// Mock implementation of the methods
class MockBoltDriverAPI extends BoltDriverAPI {
  override async getScheduledRideRequests(params: any) {
    console.log('Mocked getScheduledRideRequests with params:', params);
    return { code: 0, message: 'OK', data: params };
  }

  override async getEarningLandingScreen(params: any) {
    console.log('Mocked getEarningLandingScreen with params:', params);
    return { code: 0, message: 'OK', data: params };
  }

  override async getActivityRides(params: any) {
    console.log('Mocked getActivityRides with params:', params);
    return { code: 0, message: 'OK', data: params };
  }

  override async getOrderHistoryPaginated(params: any) {
    console.log('Mocked getOrderHistoryPaginated with params:', params);
    return { code: 0, message: 'OK', data: params };
  }

  override async getHelpDetails(params: any) {
    console.log('Mocked getHelpDetails with params:', params);
    return { code: 0, message: 'OK', data: params };
  }

  override async getEarnMoreDetails(params: any) {
    console.log('Mocked getEarnMoreDetails with params:', params);
    return { code: 0, message: 'OK', data: params };
  }

  override async getScoreOverview(params: any) {
    console.log('Mocked getScoreOverview with params:', params);
    return { code: 0, message: 'OK', data: params };
  }

  override async getDriverSidebar(params: any) {
    console.log('Mocked getDriverSidebar with params:', params);
    return { code: 0, message: 'OK', data: params };
  }
}

describe('BoltDriverAPI Driver Endpoints', () => {
  let api: MockBoltDriverAPI;
  const baseParams: DeviceInfo = {
    deviceId: 'test_device_id',
    deviceType: 'iphone',
    deviceName: 'iPhone17,3',
    deviceOsVersion: 'iOS18.6',
    appVersion: 'DI.115.0'
  };

  const mockAuthConfig: AuthConfig = {
    authMethod: 'phone',
    brand: 'bolt',
    country: 'pl',
    language: 'en-GB',
    theme: 'dark'
  };

  beforeAll(() => {
    api = new MockBoltDriverAPI(
      baseParams, 
      mockAuthConfig
    );
  });

  test('getScheduledRideRequests returns data', async () => {
    const result = await api.getScheduledRideRequests({
      ...baseParams,
      brand: 'bolt',
      country: 'pl',
      driver_id: 'test_driver_id',
      session_id: 'test_session_id',
      gps_lat: 51.258200,
      gps_lng: 22.592737
    });
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.message).toBe('OK');
  });

  test('getEarningLandingScreen returns data', async () => {
    const result = await api.getEarningLandingScreen({
      ...baseParams,
      brand: 'bolt',
      country: 'pl',
      driver_id: 'test_driver_id',
      session_id: 'test_session_id',
      gps_lat: 51.258200,
      gps_lng: 22.592737
    });
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.message).toBe('OK');
    expect(result.data).toBeTruthy();
  });

  test('getActivityRides returns data', async () => {
    const result = await api.getActivityRides({
      ...baseParams,
      brand: 'bolt',
      country: 'pl',
      driver_id: 'test_driver_id',
      session_id: 'test_session_id',
      group_by: 'all',
      gps_lat: 51.258200,
      gps_lng: 22.592737
    });
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.message).toBe('OK');
    expect(result.data).toBeTruthy();
  });

  test('getOrderHistoryPaginated returns data', async () => {
    const result = await api.getOrderHistoryPaginated({
      ...baseParams,
      brand: 'bolt',
      country: 'pl',
      driver_id: 'test_driver_id',
      session_id: 'test_session_id',
      gps_lat: 51.258200,
      gps_lng: 22.592737
    });
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.message).toBe('OK');
    expect(result.data).toBeTruthy();
  });

  test('getHelpDetails returns data', async () => {
    const result = await api.getHelpDetails({
      ...baseParams,
      brand: 'bolt',
      country: 'pl',
      driver_id: 'test_driver_id',
      session_id: 'test_session_id',
      gps_lat: 51.258200,
      gps_lng: 22.592737
    });
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.message).toBe('OK');
    expect(result.data).toBeTruthy();
  });

  test('getEarnMoreDetails returns data', async () => {
    const result = await api.getEarnMoreDetails({
      ...baseParams,
      brand: 'bolt',
      country: 'pl',
      driver_id: 'test_driver_id',
      session_id: 'test_session_id',
      gps_lat: 51.258200,
      gps_lng: 22.592737
    });
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.message).toBe('OK');
    expect(result.data).toBeTruthy();
  });

  test('getScoreOverview returns data', async () => {
    const result = await api.getScoreOverview({
      ...baseParams,
      brand: 'bolt',
      country: 'pl',
      driver_id: 'test_driver_id',
      session_id: 'test_session_id',
      gps_lat: 51.258200,
      gps_lng: 22.592737
    });
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.message).toBe('OK');
    expect(result.data).toBeTruthy();
  });

  test('getDriverSidebar returns data', async () => {
    const result = await api.getDriverSidebar({
      ...baseParams,
      brand: 'bolt',
      country: 'pl',
      driver_id: 'test_driver_id',
      session_id: 'test_session_id',
      gps_lat: 51.258200,
      gps_lng: 22.592737
    });
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.message).toBe('OK');
    expect(result.data).toBeTruthy();
  });
});
