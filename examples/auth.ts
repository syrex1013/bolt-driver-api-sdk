#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import * as fs from 'fs';
import * as path from 'path';
import { BoltDriverAPI, DeviceInfo, AuthConfig, SmsLimitError, InvalidPhoneError, DatabaseError, Credentials, GpsInfo, ValidationError } from '../src';

interface UserInput {
  phoneNumber: string;
  country: string;
  language: string;
  deviceType: string;
  useRealCredentials: boolean;
  smsCode?: string;
  deviceId?: string;
  deviceName?: string;
  deviceOsVersion?: string;
}

/**
 * Interactive Authentication Flow Example
 * This example provides an interactive CLI for testing authentication
 */

export async function authExample() {
  console.clear();
  console.log(boxen(chalk.blue.bold('🔐 Bolt Driver Authentication Example'), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'blue'
  }));

  // Check for saved token first
  const tokenPath = path.join(__dirname, '..', '.magic-link-token.json');
  let savedToken: any = null;

  try {
    if (fs.existsSync(tokenPath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      if (tokenData && tokenData.phoneNumber) {
        const { useSaved } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useSaved',
            message: `Found saved credentials for ${tokenData.phoneNumber}. Use saved token?`,
            default: true
          }
        ]);

        if (useSaved) {
          savedToken = tokenData;
        }
      }
    }
  } catch (error) {
    console.log(chalk.yellow('Could not read saved token file'));
  }

  let userInput: UserInput;

  if (savedToken) {
    userInput = {
      phoneNumber: savedToken.phoneNumber,
      country: savedToken.country || 'pl',
      language: savedToken.language || 'en-GB',
      deviceType: savedToken.deviceType || 'iphone',
      useRealCredentials: true,
      deviceId: savedToken.deviceId,
      deviceName: savedToken.deviceName,
      deviceOsVersion: savedToken.deviceOsVersion
    };
    console.log(chalk.green(`✅ Using saved credentials for ${savedToken.phoneNumber}`));
  } else {
    userInput = await inquirer.prompt([
      {
        type: 'input',
        name: 'phoneNumber',
        message: 'Enter your phone number in international format (e.g., +48123456789):',
        validate: (value) => {
          const phoneRegex = /^\+[1-9]\d{1,14}$/;
          if (phoneRegex.test(value)) {
            return true;
          } else {
            return 'Invalid phone number format. Must be in international format (e.g., +48123456789).';
          }
        }
      },
      {
        type: 'list',
        name: 'country',
        message: 'Select your country:',
        choices: ['pl', 'de', 'uk'],
        default: 'pl'
      },
      {
        type: 'list',
        name: 'language',
        message: 'Select your language:',
        choices: ['en-GB', 'de', 'pl'],
        default: 'en-GB'
      },
      {
        type: 'list',
        name: 'deviceType',
        message: 'Select your device type:',
        choices: ['iphone', 'android'],
        default: 'iphone'
      },
      {
        type: 'confirm',
        name: 'useRealCredentials',
        message: 'Use real credentials (requires a valid phone number)?',
        default: false
      }
    ]);
  }

  // Device information
  const deviceInfo: DeviceInfo = {
    deviceId: userInput.deviceId || generateDeviceId(),
    deviceType: userInput.deviceType as 'iphone' | 'android',
    deviceName: userInput.deviceName || (userInput.deviceType === 'iphone' ? 'iPhone17,3' : 'Samsung Galaxy S24'),
    deviceOsVersion: userInput.deviceOsVersion || (userInput.deviceType === 'iphone' ? 'iOS18.6' : 'Android 14'),
    appVersion: 'DI.116.0'
  };

  // Authentication configuration
  const authConfig: AuthConfig = {
    authMethod: 'phone',
    brand: 'bolt',
    country: userInput.country,
    language: userInput.language,
    theme: 'dark'
  };

  console.log(chalk.cyan('\n📱 Device Information:'));
  console.log(`   ${chalk.gray('Device ID:')} ${deviceInfo.deviceId}`);
  console.log(`   ${chalk.gray('Device Type:')} ${deviceInfo.deviceType}`);
  console.log(`   ${chalk.gray('Device Name:')} ${deviceInfo.deviceName}`);
  console.log(`   ${chalk.gray('OS Version:')} ${deviceInfo.deviceOsVersion}`);

  try {
    // Initialize API
    const spinner = ora('Initializing Bolt Driver API...').start();
    const boltAPI = new BoltDriverAPI(deviceInfo, authConfig);

    // Test JWT parsing with the HAR token
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImRyaXZlcl9pZCI6NzUzNDU5MiwicGFydG5lcl9pZCI6MTEyMjg0MjYsImNvbXBhbnlfaWQiOjEzNz76LCJjb21wYW55X2NpdHlfaWQiOjQ2NSwibWFuYWdlZF9ieV9mbGVldF9vd25lciI6MCwiZHJpdmVyX2Nhbl9hZGRfY2FycyI6MSwiYmxvY2tlZF91bnRpbCI6bnVsbCwiYXBwX3ZlcnNpb24iOiJESS4xMTYuMCIsImFwcF92ZXJpZmljYXRpb24iOnsic3RhdHVzIjoicGFzc2VkIiwiYXBwX3N0b3JlIjoiYXBwbGUifSwibmV4dF9ibG9ja19zdGFydCI6MTg3Nzg4ODYwMH0sImlhdCI6MTc1NTg2NzkyOSwiZXhwIjoxNzU1ODY4MjI5fQ.6QtLobSCslVHHeg0-SLpluHJpW4S-yecZcu3iOfZMYA';

    try {
      console.log(chalk.yellow('\n🔧 Testing JWT parsing with HAR token...'));
      const sessionInfo = (boltAPI as any).extractSessionInfoFromJWT(testToken);
      console.log(chalk.green('✅ JWT parsing successful:'));
      console.log(`   ${chalk.gray('Driver ID:')} ${sessionInfo.driverId}`);
      console.log(`   ${chalk.gray('Partner ID:')} ${sessionInfo.partnerId}`);
      console.log(`   ${chalk.gray('Company ID:')} ${sessionInfo.companyId}`);
      console.log(`   ${chalk.gray('Company City ID:')} ${sessionInfo.companyCityId}`);
      console.log(`   ${chalk.gray('Expires:')} ${new Date(sessionInfo.expiresAt).toISOString()}`);
    } catch (error) {
      console.log(chalk.red('❌ JWT parsing failed:'), error instanceof Error ? error.message : String(error));
    }

    spinner.succeed(chalk.green('API initialized successfully'));

    // Check if we have saved tokens that are still valid
    spinner.start('Checking for valid saved authentication...');
    try {
      const isValidToken = await boltAPI.validateToken();
      if (isValidToken && boltAPI.isAuthenticated()) {
        spinner.succeed(chalk.green('✅ Valid saved authentication found!'));

        // Get and display current driver information
        const sessionInfo = boltAPI.getSessionInfo();
        if (sessionInfo) {
          console.log(chalk.cyan('\n👤 Driver Information (from saved token):'));
          console.log(`   ${chalk.gray('Driver ID:')} ${sessionInfo.driverId}`);
          console.log(`   ${chalk.gray('Partner ID:')} ${sessionInfo.partnerId}`);
          console.log(`   ${chalk.gray('Company ID:')} ${sessionInfo.companyId}`);
          console.log(`   ${chalk.gray('Company City ID:')} ${sessionInfo.companyCityId}`);
          console.log(`   ${chalk.gray('Session ID:')} ${sessionInfo.sessionId.substring(0, 20)}...`);
          console.log(`   ${chalk.gray('Expires:')} ${new Date(sessionInfo.expiresAt).toLocaleString()}`);
        }

        // Try to get fresh driver data from API
        try {
          console.log(chalk.blue('\n🔄 Fetching current driver data...'));
          const driverState = await boltAPI.getDriverState({
            latitude: 51.233234,
            longitude: 22.518391,
            accuracy: 15,
            accuracyMeters: 15,
            speed: 0,
            timestamp: Math.floor(Date.now() / 1000),
            age: 30,
            bearing: 0,
            adjustedBearing: 0,
            bearingAccuracyDeg: 0,
            speedAccuracyMps: 1.8
          }, 'background');

          if (driverState) {
            console.log(chalk.green('✅ Current driver state retrieved!'));
            console.log(`   ${chalk.gray('Status:')} ${driverState.driverState || 'Unknown'}`);
            console.log(`   ${chalk.gray('Orders:')} ${driverState.orders?.length || 0} active orders`);
          }
        } catch (driverError) {
          console.log(chalk.yellow('⚠️  Could not fetch current driver state (this is optional)'));
        }

        // Try to get driver configuration
        try {
          const driverConfig = await boltAPI.getLoggedInDriverConfiguration();

          if (driverConfig) {
            console.log(chalk.green('✅ Driver configuration retrieved!'));

            // Display raw driver config data for debugging
            console.log(chalk.gray('   Raw driver config:'), JSON.stringify(driverConfig, null, 2));

            if (driverConfig.driver_info) {
              console.log(`   ${chalk.gray('Name:')} ${driverConfig.driver_info.first_name || 'N/A'} ${driverConfig.driver_info.last_name || ''}`);
              console.log(`   ${chalk.gray('Email:')} ${driverConfig.driver_info.email || 'N/A'}`);
              console.log(`   ${chalk.gray('Phone:')} ${driverConfig.driver_info.phone || 'N/A'}`);
            }
            if (driverConfig.company_info) {
              console.log(`   ${chalk.gray('Company:')} ${driverConfig.company_info.name || 'N/A'}`);
              console.log(`   ${chalk.gray('Country:')} ${driverConfig.company_info.country || 'N/A'}`);
            }
            if (driverConfig.vehicle_info) {
              console.log(`   ${chalk.gray('Vehicle:')} ${driverConfig.vehicle_info.make || 'N/A'} ${driverConfig.vehicle_info.model || ''}`);
              console.log(`   ${chalk.gray('License Plate:')} ${driverConfig.vehicle_info.license_plate || 'N/A'}`);
            }
          }
        } catch (configError) {
          console.log(chalk.yellow('⚠️  Could not fetch driver configuration (this is optional)'));
        }

        console.log(chalk.green('\n🎉 Successfully restored authentication from saved token!'));
        console.log(chalk.gray('   No SMS verification required - using existing valid token'));

        // Display final authentication status
        console.log('\n╔═══════════════════════════════════╗');
        console.log('║                                   ║');
        console.log('║   ✅ Authentication Successful!   ║');
        console.log('║                                   ║');
        console.log('╚═══════════════════════════════════╝');

        console.log(chalk.cyan('\n📋 Authentication Status:'));
        console.log(`   ${chalk.green('Authenticated: ✅ Yes')}`);
        console.log(`   ${chalk.gray('Driver ID:')} ${sessionInfo?.driverId || 'N/A'}`);
        console.log(`   ${chalk.gray('Partner ID:')} ${sessionInfo?.partnerId || 'N/A'}`);
        console.log(`   ${chalk.gray('Company City ID:')} ${sessionInfo?.companyCityId || 'N/A'}`);

        console.log('\n╭────────────────────────────────────────────────────────────────────────────────────────╮');
        console.log('│                                                                                        │');
        console.log('│   🎉 Authentication Flow Completed Successfully!                                       │');
        console.log('│                                                                                        │');
        console.log('│   You can now use the authenticated API instance to make requests to the Bolt Driver   │');
        console.log('│   API.                                                                                 │');
        console.log('│                                                                                        │');
        console.log('╰────────────────────────────────────────────────────────────────────────────────────────╯');

        return;
      } else {
        spinner.fail(chalk.yellow('❌ Saved authentication expired or invalid'));
        console.log(chalk.gray('   Proceeding with fresh authentication...'));
      }
    } catch (error) {
      spinner.fail(chalk.yellow('❌ No valid saved authentication found'));
      console.log(chalk.gray('   Proceeding with fresh authentication...'));
    }

    // Test network connectivity
    if (userInput.useRealCredentials) {
      spinner.start('Testing network connectivity to Bolt servers...');
      try {
        // Simple connectivity test - use the actual endpoint we'll be using
        const testUrl = 'https://partnerdriver.live.boltsvc.net/partnerDriver';
        const response = await fetch(testUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (response.ok) {
          spinner.succeed(chalk.green('Network connectivity confirmed'));
        } else {
          // Don't show warning for 404 on HEAD requests as they're not supported
          spinner.succeed(chalk.green('Network accessible'));
        }
      } catch (networkError) {
        spinner.fail(chalk.red('Network connectivity issue detected'));
        console.log(chalk.yellow('\n⚠️  Network Warning:'));
        console.log(`   ${chalk.gray('Unable to reach Bolt servers')}`);
        console.log(`   ${chalk.gray('This may cause authentication to fail')}`);
        console.log(`   ${chalk.gray('Check your internet connection and try again')}\n`);
      }
    }

    await performAuthentication(boltAPI, userInput);

  } catch (error) {
    await handleAuthError(error, userInput);
  }
}

async function performAuthentication(boltAPI: BoltDriverAPI, userInput: UserInput) {
  const spinner = ora();
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // Step 1: Start authentication
      spinner.start(`Sending SMS to ${userInput.phoneNumber}...`);

      // Validate phone number format
      if (userInput.useRealCredentials) {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(userInput.phoneNumber)) {
          throw new InvalidPhoneError(`Invalid phone number format: ${userInput.phoneNumber}. Must be in international format (e.g., +48123456789)`);
        }

        // Check if it's a known demo number
        const demoNumbers = ['+48123456789', '+1234567890', '+0000000000'];
        if (demoNumbers.includes(userInput.phoneNumber)) {
          console.log(chalk.yellow('\n⚠️  Warning: This appears to be a demo/test number'));
          console.log(chalk.gray('   Authentication may fail with demo numbers'));
          console.log(chalk.gray('   Use a real phone number registered with Bolt\n'));
        }
      }

      // Update credentials object with phone number
      const credentials: Credentials = {
        driver_id: 'test_driver_id',
        session_id: 'test_session_id',
        phone: userInput.phoneNumber
      };

      // Create device info and auth config for this request
      const deviceInfo: DeviceInfo = {
        deviceId: userInput.deviceId || generateDeviceId(),
        deviceType: userInput.deviceType as 'iphone' | 'android',
        deviceName: userInput.deviceName || (userInput.deviceType === 'iphone' ? 'iPhone17,3' : 'Samsung Galaxy S24'),
        deviceOsVersion: userInput.deviceOsVersion || (userInput.deviceType === 'iphone' ? 'iOS18.6' : 'Android 14'),
        appVersion: 'DI.116.0'
      };

      const authConfig: AuthConfig = {
        authMethod: 'phone',
        brand: 'bolt',
        country: userInput.country,
        language: userInput.language,
        theme: 'dark'
      };

      try {
        const authResponse = await boltAPI.startAuthentication(authConfig, deviceInfo, credentials);
        
        // Check if we got an SMS limit error
        if (authResponse.code === 299 && authResponse.message === 'SMS_LIMIT_REACHED') {
          spinner.warn(chalk.yellow('SMS limit reached, switching to magic link authentication...'));
          
          console.log(boxen(
            `${chalk.red('⚠️  SMS Limit Reached')}\n\n` +
            `${chalk.gray('Status:')} Too many authentication attempts\n` +
            `${chalk.gray('Wait Time:')} 15 minutes\n` +
            `${chalk.gray('Solution:')} Switching to magic link authentication\n\n` +
            `${chalk.blue('💡 Magic link authentication will be used instead.')}`,
            { padding: 1, borderColor: 'red', borderStyle: 'round' }
          ));
          
          // Fallback to magic link authentication
          await performMagicLinkAuthentication(boltAPI, deviceInfo);
          return;
        }
        
        spinner.succeed(chalk.green('SMS sent successfully'));

        console.log(boxen(
          `${chalk.yellow('📨 SMS Sent!')}\n\n` +
          `${chalk.gray('Verification Token:')} ${authResponse.data?.verification_token?.substring(0, 30) || 'N/A'}...\n` +
          `${chalk.gray('Code Channel:')} ${authResponse.data?.verification_code_channel || 'N/A'}\n` +
          `${chalk.gray('Target:')} ${authResponse.data?.verification_code_target || 'N/A'}\n` +
          `${chalk.gray('Code Length:')} ${authResponse.data?.verification_code_length || 'N/A'} digits\n` +
          `${chalk.gray('Resend Wait:')} ${authResponse.data?.resend_wait_time_seconds || 'N/A'} seconds`,
          { padding: 1, borderColor: 'yellow', borderStyle: 'round' }
        ));

        // Step 2: Get SMS code from user
        let smsCode = '123456'; // Default demo code
        if (userInput.useRealCredentials) {
          const { code } = await inquirer.prompt([
            {
              type: 'input',
              name: 'code',
              message: chalk.cyan('Enter the SMS code you received:'),
              validate: (input: string) => {
                if (input.length === 6 && /^\d+$/.test(input)) {
                  return true;
                }
                return chalk.red('Please enter a valid 6-digit SMS code');
              }
            }
          ]);
          smsCode = code;
        } else {
          console.log(chalk.yellow('\n💡 Using demo SMS code: 123456'));
        }

        // Update credentials with verification token for confirmAuthentication
        credentials.verification_token = authResponse.data?.verification_token;

        // Step 3: Confirm authentication
        spinner.start('Verifying SMS code...');
        const confirmResponse = await boltAPI.confirmAuthentication(authConfig, deviceInfo, credentials, smsCode);
        
        // Check if the confirmation was successful
        if (confirmResponse.code !== 0) {
          spinner.fail(chalk.red(`SMS verification failed: ${confirmResponse.message}`));
          if (confirmResponse.error_data?.text) {
            console.log(chalk.red(`Error details: ${confirmResponse.error_data.text}`));
          }
          throw new Error(`Authentication confirmation failed: ${confirmResponse.message}`);
        }
        
        spinner.succeed(chalk.green('SMS code verified successfully'));

        await showAuthSuccess(boltAPI);
        return;

      } catch (apiError: any) {
        // Handle API-specific errors
        if (apiError.statusCode === 404) {
          spinner.fail(chalk.red('API endpoint not found (404)'));
          console.log(boxen(
            `${chalk.red('🔍 API Endpoint Issue')}\n\n` +
            `${chalk.gray('Error:')} The authentication endpoint returned 404 (Not Found)\n\n` +
            `${chalk.cyan('💡 Possible Causes:')}\n` +
            `• API endpoints may have changed\n` +
            `• Server configuration issue\n` +
            `• Network routing problem\n\n` +
            `${chalk.yellow('🔧 Debug Info:')}\n` +
            `• Requested URL: ${apiError.config?.url || 'Unknown'}\n` +
            `• Status: ${apiError.statusCode}`,
            { padding: 1, borderColor: 'red', borderStyle: 'round' }
          ));
          
          console.log(chalk.yellow('\n⚠️  This appears to be a configuration issue with the API endpoints.'));
          console.log(chalk.gray('   The authentication flow cannot proceed until the correct endpoints are configured.'));
          return;
        }
        
        // Re-throw other API errors to be handled by the general error handler
        throw apiError;
      }

    } catch (authError) {
      spinner.fail(chalk.red('Authentication failed'));

      if (authError instanceof SmsLimitError) {
        console.log(boxen(
          `${chalk.red('⏱️  SMS Limit Reached')}\n\n` +
          `${chalk.gray('Error:')} ${authError.message}\n\n` +
          `${chalk.cyan('💡 Suggested Actions:')}\n` +
          `• Wait at least 30 seconds before trying again\n` +
          `• Check if you received the SMS\n` +
          `• Use a different phone number`,
          { padding: 1, borderColor: 'red', borderStyle: 'round' }
        ));

        const { wait } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'wait',
            message: 'Would you like to wait 30 seconds and try again?',
            default: true
          }
        ]);

        if (wait) {
          console.log(chalk.yellow('⏳ Waiting 30 seconds...'));
          await new Promise(resolve => setTimeout(resolve, 30000));
          retryCount++;
          continue;
        } else {
          return;
        }

      } else if (authError instanceof InvalidPhoneError) {
        console.log(boxen(
          `${chalk.red('📞 Invalid Phone Number')}\n\n` +
          `${chalk.gray('Error:')} ${authError.message}\n\n` +
          `${chalk.cyan('💡 Suggested Actions:')}\n` +
          `• Check the phone number format (+country_code)\n` +
          `• Ensure it's a valid phone number\n` +
          `• Use a phone number registered with Bolt`,
          { padding: 1, borderColor: 'red', borderStyle: 'round' }
        ));
        return;

      } else if (authError instanceof DatabaseError) {
        console.log(boxen(
          `${chalk.red('🗄️  Server Database Error')}\n\n` +
          `${chalk.gray('Error:')} ${authError.message}\n\n` +
          `${chalk.cyan('💡 Suggested Actions:')}\n` +
          `• Wait a few minutes and try again\n` +
          `• Bolt servers might be experiencing issues\n` +
          `• Check Bolt service status`,
          { padding: 1, borderColor: 'red', borderStyle: 'round' }
        ));

        if (retryCount < maxRetries - 1) {
          const { retry } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'retry',
              message: 'Would you like to retry?',
              default: true
            }
          ]);

          if (retry) {
            console.log(chalk.yellow('⏳ Retrying in 5 seconds...'));
            await new Promise(resolve => setTimeout(resolve, 5000));
            retryCount++;
            continue;
          }
        }
        return;

      } else {
        // Handle other errors
        console.log(chalk.red('\n🔍 API Debug Information:'));
        console.log(`   ${chalk.gray('Error Type:')} ${(authError as any).constructor?.name || 'Unknown'}`);
        console.log(`   ${chalk.gray('Error Message:')} ${(authError as Error).message}`);
        
        // Check if it's a network/API error
        if ((authError as any).statusCode) {
          console.log(`   ${chalk.gray('Status Code:')} ${(authError as any).statusCode}`);
          console.log(`   ${chalk.gray('Response:')} ${JSON.stringify((authError as any).response || {}, null, 2)}`);
        }
        return;
      }
    }
  }
}

async function showAuthSuccess(boltAPI: BoltDriverAPI) {
  try {
    // Get driver information from the JWT token that was extracted during authentication
    let realDriverId = 'N/A';
    let realPartnerId = 'N/A';
    let realCompanyCityId = 'N/A';

    // Try to get driver info from the JWT token first
    try {
      // Get driver info from the JWT token that was extracted during authentication
      const driverInfo = boltAPI.getDriverInfo();
      if (driverInfo) {
        realDriverId = driverInfo.driverId?.toString() || 'N/A';
        realPartnerId = driverInfo.partnerId?.toString() || 'N/A';
        realCompanyCityId = driverInfo.companyCityId?.toString() || 'N/A';
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not extract driver info from JWT token'));
    }

    // Try to validate the token and get fresh driver data
    try {
      console.log(chalk.blue('\n🔍 Validating token with API endpoint...'));

      // Use the validateToken method which uses getDriverState
      const isValidToken = await boltAPI.validateToken();

      if (isValidToken) {
        console.log(chalk.green('✅ Token validated successfully with API!'));

        // Try to get driver state which shows current driver information
        try {
          const driverState = await boltAPI.getDriverState({
            latitude: 51.233234,
            longitude: 22.518391,
            accuracy: 15,
            accuracyMeters: 15,
            speed: 0,
            timestamp: Math.floor(Date.now() / 1000),
            age: 30,
            bearing: 0,
            adjustedBearing: 0,
            bearingAccuracyDeg: 0,
            speedAccuracyMps: 1.8
          }, 'background');

          if (driverState) {
            console.log(chalk.green('✅ Current driver state retrieved!'));
            console.log(chalk.gray(`   Status: ${driverState.driverState || 'Unknown'}`));
            console.log(chalk.gray(`   Active orders: ${driverState.orders?.length || 0}`));
            console.log(chalk.gray(`   Take new orders: ${driverState.takeNewOrdersDuringOrder ? 'Yes' : 'No'}`));
            console.log(chalk.gray(`   Order acceptance: ${driverState.orderAcceptance || 'Unknown'}`));
          }
        } catch (stateError) {
          console.log(chalk.yellow('⚠️  Could not fetch driver state (this is optional)'));
        }

        // Try to get driver configuration
        try {
          const driverConfig = await boltAPI.getLoggedInDriverConfiguration();

          if (driverConfig) {
            console.log(chalk.green('✅ Driver configuration retrieved!'));

            // Display driver information if available
            if (driverConfig.driver_info) {
              console.log(`   ${chalk.gray('Name:')} ${driverConfig.driver_info.first_name || 'N/A'} ${driverConfig.driver_info.last_name || ''}`);
              console.log(`   ${chalk.gray('Email:')} ${driverConfig.driver_info.email || 'N/A'}`);
              console.log(`   ${chalk.gray('Phone:')} ${driverConfig.driver_info.phone || 'N/A'}`);
            }
            if (driverConfig.company_info) {
              console.log(`   ${chalk.gray('Company:')} ${driverConfig.company_info.name || 'N/A'}`);
              console.log(`   ${chalk.gray('Country:')} ${driverConfig.company_info.country || 'N/A'}`);
            }
            if (driverConfig.vehicle_info) {
              console.log(`   ${chalk.gray('Vehicle:')} ${driverConfig.vehicle_info.make || 'N/A'} ${driverConfig.vehicle_info.model || ''}`);
              console.log(`   ${chalk.gray('License Plate:')} ${driverConfig.vehicle_info.license_plate || 'N/A'}`);
            }

            // Log configuration keys for debugging
            console.log(chalk.gray(`   Available config keys: ${Object.keys(driverConfig).join(', ')}`));
          } else {
            console.log(chalk.yellow('⚠️  Empty driver configuration response'));
          }
        } catch (configError) {
          console.log(chalk.yellow(`⚠️  Could not fetch driver configuration: ${configError instanceof Error ? configError.message : 'Unknown error'}`));
          console.log(chalk.gray('   This is optional and may indicate authentication issues'));
        }

        // Try to get home screen data
        try {
          const homeScreen = await boltAPI.getDriverHomeScreen({
            latitude: 51.233234,
            longitude: 22.518391,
            accuracy: 15,
            accuracyMeters: 15,
            speed: 0,
            timestamp: Math.floor(Date.now() / 1000),
            age: 30,
            bearing: 0,
            adjustedBearing: 0,
            bearingAccuracyDeg: 0,
            speedAccuracyMps: 1.8
          });

          if (homeScreen) {
            console.log(chalk.green('✅ Driver home screen data fetched successfully!'));

            // Find earnings tile from items
            const earningsTile = homeScreen.items?.find(item =>
              item.type === 'tile' && item.payload?.title === "Today's earnings"
            );
            const earningsText = earningsTile?.payload?.value_text || 'N/A';
            console.log(chalk.gray(`   Earnings today: ${earningsText}`));

            // Show additional driver information
            const pollInterval = homeScreen.pollIntervalSec;
            console.log(chalk.gray(`   Poll interval: ${pollInterval ? `${pollInterval}s` : 'N/A'}`));
            console.log(chalk.gray(`   Total items: ${(homeScreen.items?.length || 0)}`));

            // Log layout information if available
            if (homeScreen.layout) {
              console.log(chalk.gray(`   Layout: ${homeScreen.layout.maxRow}x${homeScreen.layout.maxColumn}`));
            }
          }
        } catch (homeError) {
          console.log(chalk.yellow('⚠️  Could not fetch home screen data (this is optional)'));
        }
      } else {
        console.log(chalk.yellow('⚠️  Token validation failed'));
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not validate token with API'));
      console.log(chalk.gray('   This may indicate the token is invalid or expired'));
      console.log(chalk.gray(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }

    // Display authentication success
    console.log('\n╔═══════════════════════════════════╗');
    console.log('║                                   ║');
    console.log('║   ✅ Authentication Successful!   ║');
    console.log('║                                   ║');
    
    // Get the actual access token
    const accessToken = boltAPI.getCurrentAccessToken();
    if (accessToken) {
      console.log(`║   Token Type: Bearer              ║`);
      console.log(`║   Access Token: ${accessToken.substring(0, 20)}... ║`);
    } else {
      console.log('║   Token Type: Bearer              ║');
      console.log('║   Access Token: Not Available     ║');
    }
    
    console.log('║                                   ║');
    console.log('╚═══════════════════════════════════╝');

    // Debug: Check driver info from API
    const debugDriverInfo = boltAPI.getDriverInfo();
    console.log(chalk.yellow('\n🔧 Debug Driver Info:'), JSON.stringify(debugDriverInfo, null, 2));

    // Display authentication status
    console.log('\n📋 Authentication Status:');
    console.log(`   Authenticated: ${boltAPI.isAuthenticated() ? '✅ Yes' : '❌ No'}`);
    console.log(`   Driver ID: ${realDriverId}`);
    console.log(`   Partner ID: ${realPartnerId}`);
    console.log(`   Company City ID: ${realCompanyCityId}`);

    // Display completion message
    console.log('\n╭────────────────────────────────────────────────────────────────────────────────────────╮');
    console.log('│                                                                                        │');
    console.log('│   🎉 Authentication Flow Completed Successfully!                                       │');
    console.log('│                                                                                        │');
    console.log('│   You can now use the authenticated API instance to make requests to the Bolt Driver   │');
    console.log('│   API.                                                                                 │');
    console.log('│                                                                                        │');
    console.log('╰────────────────────────────────────────────────────────────────────────────────────────╯');

  } catch (error) {
    console.error(chalk.red('❌ Error in showAuthSuccess:'), error);
  }
}

async function handleAuthError(error: any, userInput: UserInput) {
  ora().fail(chalk.red('Authentication failed'));

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  console.log(boxen(
    `${chalk.red('❌ Authentication Failed')}\n\n` +
    `${chalk.yellow('Error:')} ${errorMessage}\n\n` +
    `${chalk.green('✅ For Real Testing:')}\n` +
    `• Use a phone number registered with Bolt\n` +
    `• Ensure you have a valid Bolt driver account\n` +
    `• Check if Bolt services are available in your country\n` +
    `• Verify network connectivity to Bolt servers`,
    { padding: 1, borderColor: 'red', borderStyle: 'round', margin: 1 }
  ));

  // Additional debugging info
  if (userInput.useRealCredentials) {
    console.log(chalk.yellow('\n🔧 Debug Information:'));
    console.log(`   ${chalk.gray('Phone Number:')} ${userInput.phoneNumber}`);
    console.log(`   ${chalk.gray('Country:')} ${userInput.country}`);
    console.log(`   ${chalk.gray('Device Type:')} ${userInput.deviceType}`);
    console.log(`   ${chalk.gray('API Base URL:')} https://driver.live.boltsvc.net`);
    console.log(`   ${chalk.gray('Auth Endpoint:')} https://partnerdriver.live.boltsvc.net/partnerDriver/startAuthentication`);
  }
}

async function performMagicLinkAuthentication(boltAPI: BoltDriverAPI, deviceInfo: DeviceInfo) {
  try {
    console.log(chalk.blue('\n📧 Magic Link Authentication'));
    console.log(chalk.gray('   Enter your email address to receive a magic link'));
    
    // Get email from user for magic link
    const { email } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: chalk.cyan('Enter your email for magic link authentication:'),
        validate: (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(value)) {
            return true;
          }
          return chalk.red('Please enter a valid email address');
        }
      }
    ]);

    console.log(chalk.blue(`\n📤 Sending magic link to ${email}...`));
    
    // Send magic link
    await boltAPI.sendMagicLink(email);
    console.log(chalk.green('✅ Magic link sent successfully!'));

    console.log(boxen(
      `${chalk.blue('📧 Magic Link Sent!')}\n\n` +
      `${chalk.gray('Email:')} ${email}\n` +
      `${chalk.gray('Status:')} Check your email for the magic link\n` +
      `${chalk.gray('Next:')} Paste the magic link URL when prompted`,
      { padding: 1, borderColor: 'blue', borderStyle: 'round' }
    ));

    // Wait for user to paste the magic link
    console.log('\n⏳ Waiting for magic link input...');
    console.log('   You will need to paste the complete URL in the next step.');
    
    const { magicLinkUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'magicLinkUrl',
        message: chalk.cyan('Paste the magic link URL from your email:'),
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Please enter a valid magic link URL';
          }
          if (!input.includes('partners.bolt.eu') && !input.includes('awstrack.me')) {
            return 'Please enter a valid Bolt magic link URL';
          }
          return true;
        }
      }
    ]);

    console.log(chalk.blue('\n🔐 Authenticating with magic link...'));
    
    // Extract token from magic link
    const token = BoltDriverAPI.extractTokenFromMagicLink(magicLinkUrl);
    console.log(chalk.green(`✓ Token extracted: ${token.substring(0, 20)}...`));

    // Create GPS info for magic link authentication
    const gpsInfo: GpsInfo = {
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

    // Authenticate with the magic link token
    const authResponse = await boltAPI.authenticateWithMagicLink(token, deviceInfo, gpsInfo);
    
    if (authResponse.code === 0 && authResponse.data?.refresh_token) {
      console.log(chalk.green('✅ Magic link authentication successful!'));
      console.log(chalk.gray(`Refresh token: ${authResponse.data.refresh_token.substring(0, 20)}...`));
      
      // Debug: Check authentication state
      console.log(chalk.blue('🔍 Checking authentication state...'));
      console.log(chalk.gray(`Access Token: ${boltAPI.getCurrentAccessToken() ? 'Set' : 'Not set'}`));
      console.log(chalk.gray(`Refresh Token: ${boltAPI.getCurrentRefreshToken() ? 'Set' : 'Not set'}`));
      console.log(chalk.gray(`Is Authenticated: ${boltAPI.isAuthenticated() ? 'Yes' : 'No'}`));
      
      await showAuthSuccess(boltAPI);
    } else {
      throw new Error(`Authentication failed: ${authResponse.message}`);
    }
    
  } catch (error) {
    console.log(chalk.red('\n❌ Magic Link Authentication Error:'));
    console.log(chalk.gray(`   ${error instanceof Error ? error.message : 'Unknown error'}`));
    
    if (error instanceof ValidationError) {
      console.log(chalk.yellow('\n💡 Tip: Make sure you copied the complete magic link URL from your email'));
    }
    
    // Ask user if they want to try a different method
    const { tryDifferentMethod } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'tryDifferentMethod',
        message: chalk.cyan('Would you like to try phone authentication instead?'),
        default: true
      }
    ]);
    
    if (tryDifferentMethod) {
      console.log(chalk.blue('\n📱 Switching to Phone Authentication...'));
      console.log(chalk.yellow('💡 Note: You may need to wait for the SMS limit to reset (15 minutes)'));
      
      const { ready } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'ready',
          message: chalk.cyan('Press Enter when you\'re ready to try phone authentication again'),
          default: true
        }
      ]);
      
      if (ready) {
        // Return to main authentication flow
        return;
      }
    }
  }
}

function generateDeviceId(): string {
  // Generate a UUID-like device ID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }).toUpperCase();
}

// Export the JWT test function so it can be called independently
export async function testJWTParsing() {
  console.log(chalk.cyan('\n╔═══════════════════════════════════╗'));
  console.log(chalk.cyan('║                                   ║'));
  console.log(chalk.cyan('║   🔧 JWT Parsing Test             ║'));
  console.log(chalk.cyan('║                                   ║'));
  console.log(chalk.cyan('╚═══════════════════════════════════╝'));

  // Device information
  const deviceInfo: DeviceInfo = {
    deviceId: 'TEST-DEVICE-ID',
    deviceType: 'iphone' as 'iphone' | 'android',
    deviceName: 'iPhone Test',
    deviceOsVersion: 'iOS18.6',
    appVersion: 'DI.116.0'
  };

  // Authentication configuration
  const authConfig: AuthConfig = {
    authMethod: 'phone',
    brand: 'bolt',
    country: 'pl',
    language: 'en-GB',
    theme: 'dark'
  };

  try {
    const boltAPI = new BoltDriverAPI(deviceInfo, authConfig);

    // Test JWT parsing with a minimal JWT token that matches the expected structure
    const header = btoa(JSON.stringify({alg: 'HS256', typ: 'JWT'}));
    const payload = btoa(JSON.stringify({
      data: {
        driver_id: 7534592,
        partner_id: 11228426,
        company_id: 13776,
        company_city_id: 465,
        managed_by_fleet_owner: 0,
        driver_can_add_cars: 1,
        blocked_until: null,
        app_version: "DI.116.0",
        app_verification: {status: "passed", app_store: "apple"},
        next_block_start: 1877888600
      },
      iat: 1756267929,
      exp: 1756268229
    }));
    const testToken = `${header}.${payload}.signature`;

    console.log(chalk.yellow('\n🔧 Testing JWT parsing with HAR token...'));
    const sessionInfo = (boltAPI as any).extractSessionInfoFromJWT(testToken);

    console.log(chalk.green('✅ JWT parsing successful:'));
    console.log(`   ${chalk.gray('Driver ID:')} ${sessionInfo.driverId}`);
    console.log(`   ${chalk.gray('Partner ID:')} ${sessionInfo.partnerId}`);
    console.log(`   ${chalk.gray('Company ID:')} ${sessionInfo.companyId}`);
    console.log(`   ${chalk.gray('Company City ID:')} ${sessionInfo.companyCityId}`);
    console.log(`   ${chalk.gray('Expires:')} ${new Date(sessionInfo.expiresAt).toISOString()}`);

    // Test setting the driver info
    boltAPI['driverInfo'] = {
      driverId: sessionInfo.driverId,
      partnerId: sessionInfo.partnerId,
      companyId: sessionInfo.companyId,
      companyCityId: sessionInfo.companyCityId
    };

    const driverInfo = boltAPI.getDriverInfo();
    console.log(chalk.green('\n✅ Driver info set successfully:'));
    console.log(`   ${chalk.gray('Driver ID:')} ${driverInfo?.driverId}`);
    console.log(`   ${chalk.gray('Partner ID:')} ${driverInfo?.partnerId}`);
    console.log(`   ${chalk.gray('Company ID:')} ${driverInfo?.companyId}`);
    console.log(`   ${chalk.gray('Company City ID:')} ${driverInfo?.companyCityId}`);

  } catch (error) {
    console.log(chalk.red('❌ JWT Test Error:'), error instanceof Error ? error.message : String(error));
  }
}

if (require.main === module) {
  // Check if --test-jwt flag is passed
  if (process.argv.includes('--test-jwt')) {
    testJWTParsing().then(() => process.exit(0));
  } else {
    authExample().catch((error) => {
      console.error('❌ Application Error:', error);
      process.exit(1);
    });
  }
}