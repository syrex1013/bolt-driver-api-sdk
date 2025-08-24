#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import * as fs from 'fs';
import * as path from 'path';
import { BoltDriverAPI, DeviceInfo, AuthConfig, SmsLimitError, InvalidSmsCodeError, InvalidPhoneError, DatabaseError } from '../src';

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

  // Check for saved token first
  const tokenPath = path.join(__dirname, '..', '.magic-link-token.json');
  let savedToken = null;

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
      useRealCredentials: true
    };
    console.log(chalk.green(`✅ Using saved credentials for ${savedToken.phoneNumber}`));
  } else {
    userInput = await getUserInput();
  }

  // Device information
  const deviceInfo: DeviceInfo = {
    deviceId: savedToken?.deviceId || generateDeviceId(),
    deviceType: userInput.deviceType as 'iphone' | 'android',
    deviceName: savedToken?.deviceName || (userInput.deviceType === 'iphone' ? 'iPhone17,3' : 'Samsung Galaxy S24'),
    deviceOsVersion: savedToken?.deviceOsVersion || (userInput.deviceType === 'iphone' ? 'iOS18.6' : 'Android 14'),
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

    // Check if we already have a valid token
    if (savedToken && boltAPI.isAuthenticated()) {
      console.log(chalk.green('\n✅ Already authenticated with valid token'));
      await showAuthSuccess(boltAPI);
      return;
    }

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

      await showAuthSuccess(boltAPI, confirmResponse);
      return;

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
        return;
      }
    }
  }
}

async function showAuthSuccess(boltAPI: BoltDriverAPI, confirmResponse?: any) {
  console.log(boxen(
    `${chalk.green('✅ Authentication Successful!')}\n\n` +
    `${chalk.gray('Token Type:')} ${confirmResponse?.type || 'Bearer'}\n` +
    `${chalk.gray('Access Token:')} ${confirmResponse?.token?.refresh_token?.substring(0, 30) || 'N/A'}...\n` +
    `${chalk.gray('Token Type:')} ${confirmResponse?.token?.token_type || 'bearer'}`,
    { padding: 1, borderColor: 'green', borderStyle: 'double' }
  ));

  // Step 4: Verify authentication status
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