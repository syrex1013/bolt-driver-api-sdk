import { jest } from '@jest/globals';
import axios from 'axios';
import { BoltDriverAPI } from '../src/BoltDriverAPI';
import { DeviceInfo, AuthConfig, SmsLimitError, InvalidSmsCodeError, InvalidPhoneError, DatabaseError } from '../src/types';

// Mock the entire axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Set up the create mock to return a properly mocked client
const mockClient = {
  post: jest.fn(),
  get: jest.fn(),
  request: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

mockedAxios.create.mockReturnValue(mockClient as any);

describe('BoltDriverAPI - Authentication Error Handling', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    api = new BoltDriverAPI(deviceInfo, authConfig);
  });

  describe('🔔 SMS Limit Error (Code 299)', () => {
    it('should throw SmsLimitError when SMS limit is reached', async () => {
      // Mock axios.post to simulate error response
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: {
            code: 299,
            message: 'SMS_LIMIT_REACHED',
            error_data: { text: 'Please wait at least 30 seconds to resend a new code.' }
          },
          status: 200
        }
      });

      await expect(api.startAuthentication(
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
      )).rejects.toThrow(SmsLimitError);
      await expect(api.startAuthentication(
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
      )).rejects.toThrow('Please wait at least 30 seconds');
    });
  });

  describe('📞 Invalid Phone Error (Code 17500)', () => {
    it('should throw InvalidPhoneError for invalid phone format', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: {
            code: 17500,
            message: 'PARSING_PHONE_FAILED',
            error_data: { text: 'Enter a valid phone number or try using email/username instead' }
          },
          status: 200
        }
      });

      // Test invalid phone error
      await expect(api.startAuthentication(
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
      )).rejects.toThrow(InvalidPhoneError);
      await expect(api.startAuthentication(
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
      )).rejects.toThrow('Invalid phone number format');
    });
  });

  describe('🗄️ Database Error (Code 1000)', () => {
    it('should throw DatabaseError for server database issues', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: {
            code: 1000,
            message: 'DATABASE_ERROR',
            error_data: { text: 'Error occurred on server side, please try again later' }
          },
          status: 200
        }
      });

      // Test database error
      await expect(api.startAuthentication(
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
      )).rejects.toThrow(DatabaseError);
      await expect(api.startAuthentication(
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
      )).rejects.toThrow('Server database error');
    });
  });

  describe('❌ Invalid SMS Code Error (Code 293)', () => {
    it('should throw InvalidSmsCodeError for incorrect SMS code', async () => {
      // Mock startAuthentication success first
      mockedAxios.post
        .mockResolvedValueOnce({
          data: {
            verification_token: 'test-token',
            verification_code_channel: 'sms'
          }
        })
        .mockRejectedValueOnce({
          response: {
            data: {
              code: 293,
              message: 'SMS_CODE_NOT_FOUND',
              error_data: { text: 'Incorrect code.' }
            },
            status: 200
          }
        });

      await expect(api.confirmAuthentication(
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
        },
        'wrong-code'
      )).rejects.toThrow(InvalidSmsCodeError);
      await expect(api.confirmAuthentication(
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
        },
        'wrong-code'
      )).rejects.toThrow('Invalid SMS code');
    });
  });

  describe('🔄 Error Recovery and Retry Logic', () => {
    it('should handle multiple retry attempts for database errors', async () => {
      // Mock database error twice, then success
      mockedAxios.post
        .mockRejectedValueOnce({
          response: {
            data: {
              code: 1000,
              message: 'DATABASE_ERROR',
              error_data: { text: 'Server error' }
            },
            status: 200
          }
        })
        .mockResolvedValueOnce({
          data: {
            verification_token: 'test-token',
            verification_code_channel: 'sms'
          }
        });

      // First call should succeed after retry logic
      const result = await api.startAuthentication(
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
      );
      expect(result.verification_token).toBe('test-token');
    });

    it('should handle SMS limit with proper wait time', async () => {
      const startTime = Date.now();

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: {
            code: 299,
            message: 'SMS_LIMIT_REACHED',
            error_data: { text: 'Please wait at least 30 seconds' }
          },
          status: 200
        }
      });

      await expect(api.startAuthentication(
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
      )).rejects.toThrow(SmsLimitError);

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeLessThan(100); // Should not wait automatically
    });
  });

  describe('📋 Error Response Structure', () => {
    it('should preserve original error response data', async () => {
      const originalErrorData = {
        code: 299,
        message: 'SMS_LIMIT_REACHED',
        error_data: { text: 'Please wait at least 30 seconds to resend a new code.' }
      };

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: originalErrorData,
          status: 200
        }
      });

      try {
        await api.startAuthentication(
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
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(SmsLimitError);
        if (error instanceof SmsLimitError) {
          expect(error.response).toEqual(originalErrorData);
        }
      }
    });

    it('should provide helpful error messages', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: {
            code: 17500,
            message: 'PARSING_PHONE_FAILED',
            error_data: { text: 'Enter a valid phone number' }
          },
          status: 200
        }
      });

      await expect(api.startAuthentication(
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
      )).rejects.toThrow('Invalid phone number format');
    });
  });
});
