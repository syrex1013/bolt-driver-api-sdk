#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { 
  BoltDriverAPI, 
  DeviceInfo, 
  AuthConfig, 
  FileTokenStorage,
  LoggingConfig,
  GpsInfo,
  Credentials
} from '../src';

interface UserInput {
  phoneNumber: string;
  country: string;
  language: string;
  deviceType: string;
  useRealCredentials: boolean;
  enableLogging: boolean;
  logToFile: boolean;
  smsCode?: string;
}

/**
 * Enhanced Example with Token Persistence and Logging
 * Demonstrates all the new features including:
 * - Token persistence (no need to login again)
 * - Comprehensive logging
 * - All new API methods from requests_bolt.md
 * - Better driver information handling
 */

async function enhancedExample() {
  console.clear();
  console.log(boxen(chalk.blue.bold('🚀 Enhanced Bolt Driver API Example'), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'blue'
  }));

  // Get user input
  const userInput = await getUserInput();

  // Device information
  const deviceInfo: DeviceInfo = {
    deviceId: generateDeviceId(),
    deviceType: userInput.deviceType as 'iphone' | 'android',
    deviceName: userInput.deviceType === 'iphone' ? 'iPhone17,3' : 'Samsung Galaxy S24',
    deviceOsVersion: userInput.deviceType === 'iphone' ? 'iOS18.6' : 'Android 14',
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

  // Logging configuration
  const loggingConfig: LoggingConfig = {
    enabled: userInput.enableLogging,
    level: 'info',
    logRequests: true,
    logResponses: false,
    logErrors: true,
    logToFile: userInput.logToFile,
    logFilePath: './bolt-api-enhanced.log'
  };

  console.log(chalk.cyan('\n📱 Device Information:'));
  console.log(`   ${chalk.gray('Device ID:')} ${deviceInfo.deviceId}`);
  console.log(`   ${chalk.gray('Device Type:')} ${deviceInfo.deviceType}`);
  console.log(`   ${chalk.gray('Device Name:')} ${deviceInfo.deviceName}`);
  console.log(`   ${chalk.gray('OS Version:')} ${deviceInfo.deviceOsVersion}`);

  console.log(chalk.cyan('\n🔧 Configuration:'));
  console.log(`   ${chalk.gray('Logging:')} ${userInput.enableLogging ? chalk.green('✅ Enabled') : chalk.red('❌ Disabled')}`);
  console.log(`   ${chalk.gray('Log to File:')} ${userInput.logToFile ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
  console.log(`   ${chalk.gray('Token Storage:')} ${chalk.green('✅ File-based')}`);

  try {
    // Initialize API with token storage and logging
    const spinner = ora('Initializing Enhanced Bolt Driver API...').start();
    
    // Create token storage
    const tokenStorage = new FileTokenStorage('.bolt-token-enhanced.json');
    
    // Create API instance
    const boltAPI = new BoltDriverAPI(deviceInfo, authConfig, undefined, tokenStorage, loggingConfig);
    
    spinner.succeed(chalk.green('Enhanced API initialized successfully'));

    // Check if we have a stored token
    const hasStoredToken = await tokenStorage.hasValidToken();
    if (hasStoredToken) {
      console.log(chalk.green('\n🎫 Found stored authentication token!'));
      console.log(chalk.gray('   No need to login again - using stored credentials'));
      
      // Verify the token is still valid by making a test API call
      try {
        spinner.start('Verifying stored token...');
        const gpsInfo = createSampleGpsInfo();
        await boltAPI.getDriverNavBarBadges(gpsInfo);
        spinner.succeed(chalk.green('Stored token is valid'));
        
        console.log(chalk.cyan('\n📋 Current Session:'));
        const sessionInfo = boltAPI.getSessionInfo();
        if (sessionInfo) {
          console.log(`   ${chalk.gray('Driver ID:')} ${sessionInfo.driverId || 'Not set'}`);
          console.log(`   ${chalk.gray('Partner ID:')} ${sessionInfo.partnerId || 'Not set'}`);
          console.log(`   ${chalk.gray('Company City ID:')} ${sessionInfo.companyCityId || 'Not set'}`);
          console.log(`   ${chalk.gray('Token Type:')} ${sessionInfo.tokenType || 'Not set'}`);
        }
        
        // Demonstrate API methods
        await demonstrateApiMethods(boltAPI, gpsInfo);
        
      } catch (tokenError) {
        spinner.fail(chalk.red('Stored token is invalid or expired'));
        console.log(chalk.yellow('   Will proceed with new authentication'));
        await performAuthentication(boltAPI, userInput, spinner);
      }
    } else {
      console.log(chalk.yellow('\n🔑 No stored token found - proceeding with authentication'));
      await performAuthentication(boltAPI, userInput, spinner);
    }

    console.log(boxen(
      chalk.green.bold('🎉 Enhanced Example Completed Successfully!') + '\n\n' +
      chalk.gray('Features demonstrated:') + '\n' +
      chalk.gray('• Token persistence and restoration') + '\n' +
      chalk.gray('• Comprehensive logging system') + '\n' +
      chalk.gray('• All new API methods') + '\n' +
      chalk.gray('• Better error handling and debugging'),
      { padding: 1, borderColor: 'green', borderStyle: 'double', margin: 1 }
    ));

  } catch (error) {
    ora().fail(chalk.red('Enhanced example failed'));
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(boxen(
      `${chalk.red('❌ Enhanced Example Failed')}\n\n` +
      `${chalk.yellow('Error:')} ${errorMessage}`,
      { padding: 1, borderColor: 'red', borderStyle: 'round', margin: 1 }
    ));
  }
}

async function performAuthentication(boltAPI: BoltDriverAPI, userInput: UserInput, spinner: any) {
  // Step 1: Start authentication
  spinner.start(`Sending SMS to ${userInput.phoneNumber}...`);
  
  try {
    // Create credentials object
    const credentials: Credentials = {
      driver_id: 'test_driver_id',
      session_id: 'test_session_id'
    };

    // Create device info and auth config for this request
    const deviceInfo: DeviceInfo = {
      deviceId: generateDeviceId(),
      deviceType: userInput.deviceType as 'iphone' | 'android',
      deviceName: userInput.deviceType === 'iphone' ? 'iPhone17,3' : 'Samsung Galaxy S24',
      deviceOsVersion: userInput.deviceType === 'iphone' ? 'iOS18.6' : 'Android 14',
      appVersion: 'DI.116.0'
    };

    const authConfig: AuthConfig = {
      authMethod: 'phone',
      brand: 'bolt',
      country: userInput.country,
      language: userInput.language,
      theme: 'dark'
    };

    const authResponse = await boltAPI.startAuthentication(authConfig, deviceInfo, credentials);
    spinner.succeed(chalk.green('SMS sent successfully'));
    
    console.log(boxen(
      `${chalk.yellow('📨 SMS Sent!')}\n\n` +
      `${chalk.gray('Verification Token:')} ${authResponse.verification_token.substring(0, 30)}...\n` +
      `${chalk.gray('Code Channel:')} ${authResponse.verification_code_channel}\n` +
      `${chalk.gray('Target:')} ${authResponse.verification_code_target}\n` +
      `${chalk.gray('Code Length:')} ${authResponse.verification_code_length} digits\n` +
      `${chalk.gray('Resend Wait:')} ${authResponse.resend_wait_time_seconds} seconds`,
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

    // Step 3: Confirm authentication
    spinner.start('Verifying SMS code...');
    const confirmResponse = await boltAPI.confirmAuthentication(authConfig, deviceInfo, credentials, smsCode);
    spinner.succeed(chalk.green('SMS code verified successfully'));
    
    console.log(boxen(
      `${chalk.green('✅ Authentication Successful!')}\n\n` +
      `${chalk.gray('Token Type:')} ${confirmResponse.type}\n` +
      `${chalk.gray('Access Token:')} ${confirmResponse.token.refresh_token.substring(0, 30)}...\n` +
      `${chalk.gray('Token Type:')} ${confirmResponse.token.token_type}\n` +
      `${chalk.gray('Token Saved:')} ${chalk.green('✅ Yes (will be reused next time)')}`,
      { padding: 1, borderColor: 'green', borderStyle: 'double' }
    ));

    // Step 4: Demonstrate API methods
    const gpsInfo = createSampleGpsInfo();
    await demonstrateApiMethods(boltAPI, gpsInfo);

  } catch (authError) {
    spinner.fail(chalk.red('Authentication failed'));
    throw authError;
  }
}

async function demonstrateApiMethods(boltAPI: BoltDriverAPI, gpsInfo: GpsInfo) {
  console.log(chalk.cyan('\n🚀 Demonstrating API Methods:'));
  
  const spinner = ora('Testing API methods...').start();
  
  try {
    // Test various API methods
    const methods = [
      { name: 'Driver State', method: () => boltAPI.getDriverState(gpsInfo) },
      { name: 'Home Screen', method: () => boltAPI.getDriverHomeScreen(gpsInfo) },
      { name: 'Working Time', method: () => boltAPI.getWorkingTimeInfo(gpsInfo) },
      { name: 'Dispatch Preferences', method: () => boltAPI.getDispatchPreferences(gpsInfo) },
      { name: 'Navigation Badges', method: () => boltAPI.getDriverNavBarBadges(gpsInfo) },
      { name: 'Emergency Assist', method: () => boltAPI.getEmergencyAssistProvider(gpsInfo) },
      { name: 'Other Drivers', method: () => boltAPI.getOtherActiveDrivers(gpsInfo) },
      { name: 'Modal Info', method: () => boltAPI.getModal(gpsInfo) }
    ];

    const results: Array<{ name: string; status: string; data?: any; error?: string }> = [];
    for (const { name, method } of methods) {
      try {
        const result = await method();
        results.push({ name, status: '✅ Success', data: result });
      } catch (error) {
        results.push({ name, status: '❌ Failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    spinner.succeed(chalk.green('API methods tested'));

    // Display results
    console.log(chalk.cyan('\n📊 API Method Results:'));
    results.forEach(({ name, status, data, error }) => {
      if (status === '✅ Success') {
        console.log(`   ${status} ${name}`);
        if (data && typeof data === 'object') {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            console.log(`      ${chalk.gray('Data:')} ${keys.join(', ')}`);
          }
        }
      } else {
        console.log(`   ${status} ${name} - ${chalk.red(error)}`);
      }
    });

    // Show logging status
    const logger = boltAPI.getLogger();
    const logConfig = logger.getConfig();
    
    console.log(chalk.cyan('\n📝 Logging Status:'));
    console.log(`   ${chalk.gray('Enabled:')} ${logConfig.enabled ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`   ${chalk.gray('Level:')} ${logConfig.level}`);
    console.log(`   ${chalk.gray('Log Requests:')} ${logConfig.logRequests ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`   ${chalk.gray('Log Responses:')} ${logConfig.logResponses ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`   ${chalk.gray('Log to File:')} ${logConfig.logToFile ? chalk.green('Yes') : chalk.red('No')}`);
    if (logConfig.logToFile) {
      console.log(`   ${chalk.gray('Log File:')} ${logConfig.logFilePath}`);
    }

  } catch (error) {
    spinner.fail(chalk.red('API method demonstration failed'));
    throw error;
  }
}

function createSampleGpsInfo(): GpsInfo {
  return {
    latitude: 51.233186,
    longitude: 22.518373,
    accuracy: 19.791364,
    bearing: 0,
    speed: -1.000007,
    timestamp: Math.floor(Date.now() / 1000),
    age: 30.01,
    // Add missing required properties
    accuracyMeters: 19.791364,
    adjustedBearing: 0,
    bearingAccuracyDeg: 10,
    speedAccuracyMps: 0.5
  };
}

async function getUserInput(): Promise<UserInput> {
  console.log(chalk.cyan('Please provide your configuration:\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'phoneNumber',
      message: 'Enter your phone number (with country code):',
      default: '+48123456789',
      validate: (input: string) => {
        if (input.startsWith('+') && input.length >= 10) {
          return true;
        }
        return 'Please enter a valid phone number with country code (e.g., +48123456789)';
      }
    },
    {
      type: 'list',
      name: 'country',
      message: 'Select your country:',
      choices: [
        { name: '🇵🇱 Poland', value: 'pl' },
        { name: '🇪🇪 Estonia', value: 'ee' },
        { name: '🇱🇻 Latvia', value: 'lv' },
        { name: '🇱🇹 Lithuania', value: 'lt' },
        { name: '🇫🇮 Finland', value: 'fi' },
        { name: '🇺🇦 Ukraine', value: 'ua' },
        { name: '🇿🇦 South Africa', value: 'za' },
        { name: '🇳🇬 Nigeria', value: 'ng' },
        { name: '🇰🇪 Kenya', value: 'ke' },
        { name: '🇬🇭 Ghana', value: 'gh' }
      ],
      default: 'pl'
    },
    {
      type: 'list',
      name: 'language',
      message: 'Select your preferred language:',
      choices: [
        { name: '🇬🇧 English', value: 'en-GB' },
        { name: '🇵🇱 Polish', value: 'pl-PL' },
        { name: '🇪🇪 Estonian', value: 'et-EE' },
        { name: '🇱🇻 Latvian', value: 'lv-LV' },
        { name: '🇱🇹 Lithuanian', value: 'lt-LT' },
        { name: '🇫🇮 Finnish', value: 'fi-FI' },
        { name: '🇺🇦 Ukrainian', value: 'uk-UA' }
      ],
      default: 'en-GB'
    },
    {
      type: 'list',
      name: 'deviceType',
      message: 'Select your device type:',
      choices: [
        { name: '📱 iPhone', value: 'iphone' },
        { name: '🤖 Android', value: 'android' }
      ],
      default: 'iphone'
    },
    {
      type: 'confirm',
      name: 'useRealCredentials',
      message: 'Are you using real credentials? (Will prompt for SMS code)',
      default: false
    },
    {
      type: 'confirm',
      name: 'enableLogging',
      message: 'Enable comprehensive logging?',
      default: true
    },
    {
      type: 'confirm',
      name: 'logToFile',
      message: 'Log to file in addition to console?',
      default: false,
      when: (answers) => answers.enableLogging
    }
  ]);

  return answers;
}

function generateDeviceId(): string {
  // Generate a UUID-like device ID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }).toUpperCase();
}

if (require.main === module) {
  enhancedExample().catch(console.error);
}
