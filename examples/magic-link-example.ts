#!/usr/bin/env ts-node

import { BoltDriverAPI, FileTokenStorage } from '../src';
import { DeviceInfo, AuthConfig, GpsInfo } from '../src/types';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';

/**
 * Magic Link Authentication and New Endpoints Example
 * 
 * This example demonstrates:
 * 1. Magic link authentication via email
 * 2. All new API endpoints from the HAR file
 * 3. Enhanced error handling and logging
 * 4. Token persistence
 */

async function magicLinkExample() {
  console.clear();
  
  console.log(boxen(
    chalk.blue.bold('🔗 Magic Link Authentication & New Endpoints Example'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue'
    }
  ));

  // Get user configuration
  const userInput = await getUserInput();
  
  // Initialize device info
  const deviceInfo: DeviceInfo = {
    deviceId: generateDeviceId(),
    deviceType: userInput['deviceType'],
    deviceName: 'iPhone17,3',
    deviceOsVersion: 'iOS18.6',
    appVersion: 'DI.116.0'
  };

  // Initialize auth config
  const authConfig: AuthConfig = {
    authMethod: 'email',
    brand: 'bolt',
    country: userInput['country'],
    language: userInput['language'],
    theme: 'dark'
  };

  // Initialize logging config
  const loggingConfig = {
    enabled: userInput['enableLogging'],
    level: 'info' as const,
    logRequests: true,
    logResponses: false,
    logErrors: true,
    logToFile: userInput['logToFile'],
    logFilePath: userInput['logToFile'] ? './magic-link-example.log' : undefined
  };

  // Initialize API
  const tokenStorage = new FileTokenStorage('.magic-link-token.json');
  const boltAPI = new BoltDriverAPI(deviceInfo, authConfig, undefined, tokenStorage, loggingConfig);

  console.log('\n📱 Device Information:');
  console.log(`   Device ID: ${deviceInfo.deviceId}`);
  console.log(`   Device Type: ${deviceInfo.deviceType}`);
  console.log(`   Device Name: ${deviceInfo.deviceName}`);
  console.log(`   OS Version: ${deviceInfo.deviceOsVersion}`);

  console.log('\n🔧 Configuration:');
  console.log(`   Logging: ${loggingConfig.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Log to File: ${loggingConfig.logToFile ? '✅ Yes' : '❌ No'}`);
  console.log(`   Token Storage: ✅ File-based`);
  console.log(`   Authentication Method: 📧 Magic Link`);

  // Check for stored token
  if (await tokenStorage.hasValidToken()) {
    console.log('\n🔑 Found stored token - proceeding with authenticated requests');
    await demonstrateApiMethods(boltAPI);
  } else {
    console.log('\n🔑 No stored token found - proceeding with magic link authentication');
    await performMagicLinkAuthentication(boltAPI, userInput['email'], deviceInfo);
  }
}

async function performMagicLinkAuthentication(boltAPI: BoltDriverAPI, email: string, deviceInfo: DeviceInfo) {
  const spinner = ora('Sending magic link to your email...').start();
  
  try {
    // Send magic link
    const magicLinkResponse = await boltAPI.sendMagicLink(email);
    spinner.succeed('Magic link sent successfully!');
    
    console.log('\n📧 Magic Link Sent:');
    console.log(`   Email: ${email}`);
    console.log(`   Response: ${magicLinkResponse.message}`);
    
    // Wait for user to paste the magic link
    console.log('\n⏳ Please check your email and copy the magic link.');
    console.log('   You will need to paste it in the next step.');
    
    const { magicLinkUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'magicLinkUrl',
        message: 'Paste the magic link URL from your email:',
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
    
    // Extract token from magic link
    const token = BoltDriverAPI.extractTokenFromMagicLink(magicLinkUrl);
    console.log(chalk.green(`✓ Token extracted: ${token.substring(0, 20)}...`));

    try {
      // Authenticate with the magic link token
      console.log(chalk.blue('🔐 Authenticating with magic link...'));
      
      // Create GPS info for authentication
      const gpsInfo = createSampleGpsInfo();
      
      const authResponse = await boltAPI.authenticateWithMagicLink(token, deviceInfo, gpsInfo);
      
      if (authResponse.code === 0) {
        console.log(chalk.green('✓ Authentication successful!'));
        console.log(chalk.gray(`Refresh token: ${authResponse.data.refresh_token.substring(0, 20)}...`));
        
        // Debug: Check authentication state
        console.log(chalk.blue('🔍 Checking authentication state...'));
        console.log(chalk.gray(`Access Token: ${boltAPI.getCurrentAccessToken() ? 'Set' : 'Not set'}`));
        console.log(chalk.gray(`Refresh Token: ${boltAPI.getCurrentRefreshToken() ? 'Set' : 'Not set'}`));
        console.log(chalk.gray(`Is Authenticated: ${boltAPI.isAuthenticated() ? 'Yes' : 'No'}`));
        
        // Now we can make authenticated API calls
        console.log(chalk.blue('📱 Getting driver navigation bar badges...'));
        const badges = await boltAPI.getDriverNavBarBadges(gpsInfo);
        console.log(chalk.green('✓ Navigation bar badges retrieved:'), badges);
        
        // Get driver state
        console.log(chalk.blue('🚗 Getting driver state...'));
        const driverState = await boltAPI.getDriverState(gpsInfo);
        console.log(chalk.green('✓ Driver state retrieved:'), driverState);
        
        // Get working time info
        console.log(chalk.blue('⏰ Getting working time information...'));
        const workingTime = await boltAPI.getWorkingTimeInfo(gpsInfo);
        console.log(chalk.green('✓ Working time info retrieved:'), workingTime);
        
      } else {
        console.log(chalk.red('✗ Authentication failed:'), authResponse.message);
      }
    } catch (error) {
      console.error(chalk.red('✗ Error during authentication:'), error);
    }
    
  } catch (error) {
    spinner.fail('Magic link sending failed');
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

async function demonstrateApiMethods(boltAPI: BoltDriverAPI) {
  console.log('\n🚀 Demonstrating New API Endpoints...\n');
  
  // Create sample GPS info
  const gpsInfo = createSampleGpsInfo();
  
  // Remove the previous results array
  // const results: Array<{ name: string; status: string; data?: any; error?: string }> = [];

  // Test all new endpoints
  const endpoints = [
    { 
      name: 'Navigation Bar Badges', 
      method: () => boltAPI.getDriverNavBarBadges(gpsInfo),
      logResult: (data: any) => JSON.stringify(data, null, 2)
    },
    { 
      name: 'Emergency Assist Provider', 
      method: () => boltAPI.getEmergencyAssistProvider(gpsInfo),
      logResult: (data: any) => JSON.stringify(data, null, 2)
    },
    { 
      name: 'Other Active Drivers', 
      method: () => boltAPI.getOtherActiveDrivers(gpsInfo),
      logResult: (data: any) => JSON.stringify(data, null, 2)
    },
    { 
      name: 'Modal Information', 
      method: () => boltAPI.getModal(gpsInfo, 'home_screen'),
      logResult: (data: any) => JSON.stringify(data, null, 2)
    },
    { 
      name: 'Driver State', 
      method: () => boltAPI.getDriverState(gpsInfo, 'background'),
      logResult: (data: any) => JSON.stringify(data, null, 2)
    },
    { 
      name: 'Home Screen Data', 
      method: () => boltAPI.getDriverHomeScreen(gpsInfo),
      logResult: (data: any) => JSON.stringify(data, null, 2)
    },
    { 
      name: 'Working Time Info', 
      method: () => boltAPI.getWorkingTimeInfo(gpsInfo),
      logResult: (data: any) => JSON.stringify(data, null, 2)
    },
    { 
      name: 'Dispatch Preferences', 
      method: () => boltAPI.getDispatchPreferences(gpsInfo),
      logResult: (data: any) => JSON.stringify(data, null, 2)
    },
    { 
      name: 'Maps Configuration', 
      method: () => boltAPI.getMapsConfigs(gpsInfo),
      logResult: (data: any) => JSON.stringify(data, null, 2)
    }
  ];

  for (const endpoint of endpoints) {
    const spinner = ora(`Testing ${endpoint.name}...`).start();
    
    try {
      const data = await endpoint.method();
      spinner.succeed(`${endpoint.name} - Success`);
      console.log(`📦 ${endpoint.name} Response:\n${endpoint.logResult(data)}\n`);
    } catch (error) {
      spinner.fail(`${endpoint.name} - Failed`);
      console.log(`❌ ${endpoint.name} Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  // Test map tile functionality
  console.log('\n🗺️  Testing Map Tile Functionality...');
  try {
    const tilesCollectionId = 'Surge_465_88_1755901831933';
    const x = 2304;
    const y = 1367;
    const zoom = 12;
    
    const spinner = ora('Fetching map tile...').start();
    const tileData = await boltAPI.getMapTile(gpsInfo, tilesCollectionId, x, y, zoom);
    spinner.succeed('Map tile fetched successfully!');
    
    console.log(`   Collection ID: ${tilesCollectionId}`);
    console.log(`   Coordinates: (${x}, ${y}) at zoom ${zoom}`);
    console.log(`   Tile Size: ${tileData.byteLength} bytes`);
    
  } catch (error) {
    console.log('❌ Map tile fetch failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Remove push profile update
  // await boltAPI.updatePushProfile(
  //   'HI1AXMVGIYtbxfnpTc0', 
  //   '9e4d5452-341b-4a18-812d-e0d5f62df93e', 
  //   '6BF637A370BA6F748C0833F06BB0BA88B434F360E319980D9749EF78E5118F9C'
  // );

  console.log('\n🎉 Magic Link Example Completed Successfully!');
  console.log('\n💡 Key Features Demonstrated:');
  console.log('   • Magic link authentication via email');
  console.log('   • All new API endpoints from HAR file');
  console.log('   • Enhanced error handling and logging');
  console.log('   • Token persistence across sessions');
  console.log('   • Map tile functionality');
  console.log('   • Push notification profile management');
}

async function getUserInput() {
  const questions: any[] = [
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email address for magic link authentication:',
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) ? true : 'Please enter a valid email address';
      }
    },
    {
      type: 'list',
      name: 'country',
      message: 'Select your country:',
      choices: [
        { name: '🇵🇱 Poland', value: 'pl' },
        { name: '🇺🇸 United States', value: 'us' },
        { name: '🇬🇧 United Kingdom', value: 'gb' },
        { name: '🇩🇪 Germany', value: 'de' },
        { name: '🇫🇷 France', value: 'fr' }
      ]
    },
    {
      type: 'list',
      name: 'language',
      message: 'Select your preferred language:',
      choices: [
        { name: '🇬🇧 English', value: 'en-GB' },
        { name: '🇵🇱 Polish', value: 'pl' },
        { name: '🇩🇪 German', value: 'de' },
        { name: '🇫🇷 French', value: 'fr' }
      ]
    },
    {
      type: 'list',
      name: 'deviceType',
      message: 'Select your device type:',
      choices: [
        { name: '📱 iPhone', value: 'iphone' },
        { name: '🤖 Android', value: 'android' }
      ]
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
      when: (answers: any) => answers['enableLogging']
    }
  ];

  return inquirer.prompt(questions);
}

function createSampleGpsInfo(): GpsInfo {
  return {
    latitude: 51.233250,
    longitude: 22.518497,
    accuracy: 17.331588,
    bearing: 337.379444,
    speed: 0.235321,
    timestamp: 1755901903,
    age: 26.03,
    // Additional properties required by authenticateWithMagicLink
    accuracyMeters: 13.821502,
    adjustedBearing: 0,
    bearingAccuracyDeg: 180,
    speedAccuracyMps: 1.808204567744442
  };
}

function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Run the example
if (require.main === module) {
  magicLinkExample().catch(error => {
    console.error('\n💥 Example failed:', error);
    process.exit(1);
  });
}
