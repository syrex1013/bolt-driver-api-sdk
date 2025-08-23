#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { BoltDriverAPI, DeviceInfo, AuthConfig } from '../src';

interface UserInput {
  phoneNumber: string;
  country: string;
  language: string;
  deviceType: string;
  useRealCredentials: boolean;
  smsCode?: string;
}

/**
 * Interactive Authentication Flow Example
 * This example provides an interactive CLI for testing authentication
 */

async function authExample() {
  console.clear();
  console.log(boxen(chalk.blue.bold('🔐 Bolt Driver Authentication Example'), {
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

  console.log(chalk.cyan('\n📱 Device Information:'));
  console.log(`   ${chalk.gray('Device ID:')} ${deviceInfo.deviceId}`);
  console.log(`   ${chalk.gray('Device Type:')} ${deviceInfo.deviceType}`);
  console.log(`   ${chalk.gray('Device Name:')} ${deviceInfo.deviceName}`);
  console.log(`   ${chalk.gray('OS Version:')} ${deviceInfo.deviceOsVersion}`);

  try {
    // Initialize API
    const spinner = ora('Initializing Bolt Driver API...').start();
    const boltAPI = new BoltDriverAPI(deviceInfo, authConfig);
    spinner.succeed(chalk.green('API initialized successfully'));

    // Test network connectivity
    if (userInput.useRealCredentials) {
      spinner.start('Testing network connectivity to Bolt servers...');
      try {
        // Simple connectivity test
        const testUrl = 'https://driver.live.boltsvc.net';
        const response = await fetch(testUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (response.ok) {
          spinner.succeed(chalk.green('Network connectivity confirmed'));
        } else {
          spinner.warn(chalk.yellow(`Network accessible but server returned ${response.status}`));
        }
      } catch (networkError) {
        spinner.fail(chalk.red('Network connectivity issue detected'));
        console.log(chalk.yellow('\n⚠️  Network Warning:'));
        console.log(`   ${chalk.gray('Unable to reach Bolt servers')}`);
        console.log(`   ${chalk.gray('This may cause authentication to fail')}`);
        console.log(`   ${chalk.gray('Check your internet connection and try again')}\n`);
      }
    }

    // Step 1: Start authentication
    spinner.start(`Sending SMS to ${userInput.phoneNumber}...`);
    
    // Validate phone number format
    if (userInput.useRealCredentials) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(userInput.phoneNumber)) {
        throw new Error(`Invalid phone number format: ${userInput.phoneNumber}. Must be in international format (e.g., +48123456789)`);
      }
      
      // Check if it's a known demo number
      const demoNumbers = ['+48123456789', '+1234567890', '+0000000000'];
      if (demoNumbers.includes(userInput.phoneNumber)) {
        console.log(chalk.yellow('\n⚠️  Warning: This appears to be a demo/test number'));
        console.log(chalk.gray('   Authentication may fail with demo numbers'));
        console.log(chalk.gray('   Use a real phone number registered with Bolt\n'));
      }
    }
    
    try {
      const authResponse = await boltAPI.startAuthentication(userInput.phoneNumber);
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
      const confirmResponse = await boltAPI.confirmAuthentication(authResponse.verification_token, smsCode);
      spinner.succeed(chalk.green('SMS code verified successfully'));
      
      console.log(boxen(
        `${chalk.green('✅ Authentication Successful!')}\n\n` +
        `${chalk.gray('Token Type:')} ${confirmResponse.type}\n` +
        `${chalk.gray('Access Token:')} ${confirmResponse.token.refresh_token.substring(0, 30)}...\n` +
        `${chalk.gray('Token Type:')} ${confirmResponse.token.token_type}`,
        { padding: 1, borderColor: 'green', borderStyle: 'double' }
      ));

      // Step 4: Use the token from authentication directly
      spinner.start('Setting up authenticated session...');
      spinner.succeed(chalk.green('Authenticated session ready'));
      
      console.log(chalk.cyan(`\n🎫 Using Token: ${confirmResponse.token.refresh_token.substring(0, 30)}...`));

      // Step 5: Verify authentication status
      const isAuthenticated = boltAPI.isAuthenticated();
      const sessionInfo = boltAPI.getSessionInfo();

      console.log(chalk.cyan('\n📋 Authentication Status:'));
      console.log(`   ${chalk.gray('Authenticated:')} ${isAuthenticated ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
      if (sessionInfo) {
        console.log(`   ${chalk.gray('Driver ID:')} ${sessionInfo.driverId}`);
        console.log(`   ${chalk.gray('Partner ID:')} ${sessionInfo.partnerId}`);
        console.log(`   ${chalk.gray('Company City ID:')} ${sessionInfo.companyCityId}`);
      }

      console.log(boxen(
        chalk.green.bold('🎉 Authentication Flow Completed Successfully!') + '\n\n' +
        chalk.gray('You can now use the authenticated API instance to make requests to the Bolt Driver API.'),
        { padding: 1, borderColor: 'green', borderStyle: 'double', margin: 1 }
      ));

    } catch (authError) {
      spinner.fail(chalk.red('SMS sending failed'));
      
      // Enhanced debugging for API failures
      console.log(chalk.red('\n🔍 API Debug Information:'));
      console.log(`   ${chalk.gray('Error Type:')} ${(authError as any).constructor?.name || 'Unknown'}`);
      console.log(`   ${chalk.gray('Error Message:')} ${(authError as Error).message}`);
      
      // Check if it's an Axios error with response details
      if ((authError as any).response) {
        const response = (authError as any).response;
        console.log(`   ${chalk.gray('HTTP Status:')} ${response.status} ${response.statusText}`);
        console.log(`   ${chalk.gray('Response Headers:')} ${JSON.stringify(response.headers, null, 2)}`);
        console.log(`   ${chalk.gray('Response Data:')} ${JSON.stringify(response.data, null, 2)}`);
      }
      
      // Check if it's an Axios error with request details
      if ((authError as any).request) {
        const request = (authError as any).request;
        console.log(`   ${chalk.gray('Request Method:')} ${request.method}`);
        console.log(`   ${chalk.gray('Request URL:')} ${request.url}`);
        console.log(`   ${chalk.gray('Request Headers:')} ${JSON.stringify(request.headers, null, 2)}`);
      }
      
      throw authError; // Re-throw to be caught by outer catch block
    }

  } catch (error) {
    ora().fail(chalk.red('Authentication failed'));
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Enhanced error analysis
    let errorDetails = '';
    let suggestedActions = '';
    
    if (errorMessage.includes('Network Error') || errorMessage.includes('ENOTFOUND')) {
      errorDetails = 'Network connectivity issue - unable to reach Bolt servers';
      suggestedActions = '• Check your internet connection\n• Verify you can access https://driver.live.boltsvc.net\n• Check if Bolt services are available in your region';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      errorDetails = 'Request timeout - Bolt servers are not responding';
      suggestedActions = '• Bolt servers might be experiencing issues\n• Try again in a few minutes\n• Check Bolt service status';
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorDetails = 'Authentication failed - invalid credentials or phone number';
      suggestedActions = '• Verify the phone number is correct\n• Ensure the phone number is registered with Bolt\n• Check if you have a Bolt driver account';
    } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      errorDetails = 'Rate limiting - too many requests to Bolt API';
      suggestedActions = '• Wait a few minutes before trying again\n• Reduce the frequency of API calls\n• Contact Bolt support if issue persists';
    } else if (errorMessage.includes('Cannot read properties of undefined')) {
      errorDetails = 'API response parsing error - unexpected response format';
      suggestedActions = '• Bolt API format might have changed\n• Try updating the package\n• Report this as a bug';
    } else {
      errorDetails = 'Unknown error occurred';
      suggestedActions = '• Check the error message above\n• Verify your input parameters\n• Try with a different phone number';
    }
    
    console.log(boxen(
      `${chalk.red('❌ Authentication Failed')}\n\n` +
      `${chalk.yellow('Error:')} ${errorMessage}\n\n` +
      `${chalk.cyan('🔍 Analysis:')}\n${errorDetails}\n\n` +
      `${chalk.cyan('💡 Suggested Actions:')}\n${suggestedActions}\n\n` +
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
}

async function getUserInput(): Promise<UserInput> {
  console.log(chalk.cyan('Please provide your authentication details:\n'));
  
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
  authExample().catch(console.error);
}