import { jest } from '@jest/globals';
import axios from 'axios';
import { BoltDriverAPI } from '../src/BoltDriverAPI';
import { DeviceInfo, AuthConfig, SmsLimitError, InvalidSmsCodeError, InvalidPhoneError, DatabaseError } from '../src/types';

// Mock the entire axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Set up the create mock to return a properly mocked client
const mockClient = {
  post: jest.fn() as jest.MockedFunction<any>,
  get: jest.fn() as jest.MockedFunction<any>,
  request: jest.fn() as jest.MockedFunction<any>,
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
    
    // Mock axios.isAxiosError to return true for our mock error objects
    (axios as any).isAxiosError = jest.fn().mockReturnValue(true);
    
    api = new BoltDriverAPI(deviceInfo, authConfig);
  });

  describe('🔔 SMS Limit Error (Code 299)', () => {
    it('should throw SmsLimitError when SMS limit is reached', async () => {
      // Mock axios.post to simulate error response
      mockClient.post
        .mockRejectedValueOnce(Object.assign(new Error('SMS_LIMIT_REACHED'), {
          isAxiosError: true,
          response: {
            data: {
              code: 299,
              message: 'SMS_LIMIT_REACHED',
              error_data: { text: 'Please wait at least 30 seconds to resend a new code.' }
            },
            status: 200
          }
        }))
        .mockRejectedValueOnce(Object.assign(new Error('SMS_LIMIT_REACHED'), {
          isAxiosError: true,
          response: {
            data: {
              code: 299,
              message: 'SMS_LIMIT_REACHED',
              error_data: { text: 'Please wait at least 30 seconds to resend a new code.' }
            },
            status: 200
          }
        }));

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
          session_id: 'test_session_id',
          phone: '+48123456789'
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
          session_id: 'test_session_id',
          phone: '+48123456789'
        }
      )).rejects.toThrow('SMS_LIMIT_REACHED');
    });
  });

  describe('📞 Invalid Phone Error (Code 17500)', () => {
    it('should throw InvalidPhoneError for invalid phone format', async () => {
      mockClient.post
        .mockRejectedValueOnce(Object.assign(new Error('PARSING_PHONE_FAILED'), {
          isAxiosError: true,
          response: {
            data: {
              code: 17500,
              message: 'PARSING_PHONE_FAILED',
              error_data: { text: 'Enter a valid phone number or try using email/username instead' }
            },
            status: 200
          }
        }))
        .mockRejectedValueOnce(Object.assign(new Error('PARSING_PHONE_FAILED'), {
          isAxiosError: true,
          response: {
            data: {
              code: 17500,
              message: 'PARSING_PHONE_FAILED',
              error_data: { text: 'Enter a valid phone number or try using email/username instead' }
            },
            status: 200
          }
        }));

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
          session_id: 'test_session_id',
          phone: '+48123456789'
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
          session_id: 'test_session_id',
          phone: '+48123456789'
        }
      )).rejects.toThrow('Invalid phone number format');
    });
  });

  describe('🗄️ Database Error (Code 1000)', () => {
    it('should throw DatabaseError for server database issues', async () => {
      mockClient.post
        .mockRejectedValueOnce(Object.assign(new Error('DATABASE_ERROR'), {
          isAxiosError: true,
          response: {
            data: {
              code: 1000,
              message: 'DATABASE_ERROR',
              error_data: { text: 'Server database error occurred' }
            },
            status: 200
          }
        }))
        .mockRejectedValueOnce(Object.assign(new Error('DATABASE_ERROR'), {
          isAxiosError: true,
          response: {
            data: {
              code: 1000,
              message: 'DATABASE_ERROR',
              error_data: { text: 'Server database error occurred' }
            },
            status: 200
          }
        }));

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
          session_id: 'test_session_id',
          phone: '+48123456789'
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
          session_id: 'test_session_id',
          phone: '+48123456789'
        }
      )).rejects.toThrow('DATABASE_ERROR');
    });
  });

  describe('❌ Invalid SMS Code Error (Code 293)', () => {
    it('should throw InvalidSmsCodeError for incorrect SMS code', async () => {
      // Mock successful startAuthentication
      mockClient.post.mockResolvedValueOnce({
        data: {
          code: 0,
          message: 'OK',
          data: {
            verification_code_channel: 'sms',
            verification_token: 'test-token'
          }
        }
      });

      // Mock failed confirmAuthentication with SMS_CODE_NOT_FOUND
      const errorResponse = Object.assign(new Error('SMS_CODE_NOT_FOUND'), {
        isAxiosError: true,
        response: {
          data: {
            code: 293,
            message: 'SMS_CODE_NOT_FOUND',
            error_data: { text: 'Invalid SMS code provided' }
          },
          status: 200
        }
      });
      mockClient.post.mockRejectedValueOnce(errorResponse);

      // First call startAuthentication to get the verification token
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
          session_id: 'test_session_id',
          phone: '+48123456789'
        }
      );

      // Now call confirmAuthentication which should fail
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
          session_id: 'test_session_id',
          phone: '+48123456789',
          verification_token: 'test-token'
        },
        'wrong-code'
      )).rejects.toThrow(InvalidSmsCodeError);
    });
  });

  describe('🔄 Error Recovery and Retry Logic', () => {
    it('should handle multiple retry attempts for database errors', async () => {
      // Clear any previous mocks
      jest.clearAllMocks();

      // Mock database error response
      const databaseError = Object.assign(new Error('DATABASE_ERROR'), {
        isAxiosError: true,
        response: {
          data: {
            code: 1000,
            message: 'DATABASE_ERROR',
            error_data: { text: 'Server database error occurred' }
          },
          status: 200
        }
      });
      mockClient.post.mockRejectedValueOnce(databaseError);

      // Should throw DatabaseError on database error
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
          session_id: 'test_session_id',
          phone: '+48123456789'
        }
      )).rejects.toThrow(DatabaseError);
    });

    it('should handle SMS limit with proper wait time', async () => {
      // Clear any previous mocks
      jest.clearAllMocks();

      const startTime = Date.now();

      // Mock SMS limit error response
      const smsLimitError = Object.assign(new Error('SMS_LIMIT_REACHED'), {
        isAxiosError: true,
        response: {
          data: {
            code: 299,
            message: 'SMS_LIMIT_REACHED',
            error_data: { text: 'Please wait at least 30 seconds to resend a new code.' }
          },
          status: 200
        }
      });
      mockClient.post.mockRejectedValueOnce(smsLimitError);

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
          session_id: 'test_session_id',
          phone: '+48123456789'
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

      mockClient.post.mockRejectedValueOnce(Object.assign(new Error('SMS_LIMIT_REACHED'), {
        isAxiosError: true,
        response: {
          data: originalErrorData,
          status: 200
        }
      }));

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
            session_id: 'test_session_id',
            phone: '+48123456789'
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
      // Clear any previous mocks
      jest.clearAllMocks();

      // Mock phone parsing error response
      const phoneError = Object.assign(new Error('PARSING_PHONE_FAILED'), {
        isAxiosError: true,
        response: {
          data: {
            code: 17500,
            message: 'PARSING_PHONE_FAILED',
            error_data: { text: 'Enter a valid phone number' }
          },
          status: 200
        }
      });
      mockClient.post.mockRejectedValueOnce(phoneError);

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
          session_id: 'test_session_id',
          phone: '+48123456789'
        }
      )).rejects.toThrow('Invalid phone number format');
    });
  });
});
