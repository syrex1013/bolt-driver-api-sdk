#!/usr/bin/env ts-node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { BoltDriverAPI, DeviceInfo, AuthConfig, GpsInfo } from '../src';

interface CLIState {
  api: BoltDriverAPI;
  authenticated: boolean;
  gpsInfo: GpsInfo;
}

/**
 * Interactive Bolt Driver API CLI
 * Comprehensive command-line interface for testing all API functions
 */

async function main() {
  console.clear();
  displayWelcome();

  const state = await initializeAPI();
  
  if (!state) {
    console.log(chalk.red('Failed to initialize API. Exiting...'));
    return;
  }

  await mainMenu(state);
}

function displayWelcome() {
  console.log(boxen(
    chalk.blue.bold('🚗 Bolt Driver API Interactive CLI') + '\n\n' +
    chalk.gray('Comprehensive testing interface for the Bolt Driver API\n') +
    chalk.yellow('⚠️  Use real credentials for full functionality'),
    {
      padding: 2,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'blue'
    }
  ));
}

async function initializeAPI(): Promise<CLIState | null> {
  try {
    console.log(chalk.cyan('\n🔧 API Initialization\n'));

    const config = await inquirer.prompt([
      {
        type: 'input',
        name: 'phoneNumber',
        message: 'Phone number (with country code):',
        default: '+48123456789',
        validate: (input: string) => input.startsWith('+') && input.length >= 10
      },
      {
        type: 'list',
        name: 'country',
        message: 'Country:',
        choices: [
          { name: '🇵🇱 Poland', value: 'pl' },
          { name: '🇪🇪 Estonia', value: 'ee' },
          { name: '🇱🇻 Latvia', value: 'lv' },
          { name: '🇱🇹 Lithuania', value: 'lt' },
          { name: '🇫🇮 Finland', value: 'fi' },
          { name: '🇺🇦 Ukraine', value: 'ua' },
          { name: '🇿🇦 South Africa', value: 'za' },
          { name: '🇳🇬 Nigeria', value: 'ng' },
          { name: '🇰🇪 Kenya', value: 'ke' }
        ],
        default: 'pl'
      },
      {
        type: 'list',
        name: 'deviceType',
        message: 'Device type:',
        choices: [
          { name: '📱 iPhone', value: 'iphone' },
          { name: '🤖 Android', value: 'android' }
        ],
        default: 'iphone'
      },
      {
        type: 'confirm',
        name: 'useRealCredentials',
        message: 'Use real credentials?',
        default: false
      }
    ]);

    const deviceInfo: DeviceInfo = {
      deviceId: generateDeviceId(),
      deviceType: config.deviceType,
      deviceName: config.deviceType === 'iphone' ? 'iPhone17,3' : 'Samsung Galaxy S24',
      deviceOsVersion: config.deviceType === 'iphone' ? 'iOS18.6' : 'Android 14',
      appVersion: 'DI.116.0'
    };

    const authConfig: AuthConfig = {
      authMethod: 'phone',
      brand: 'bolt',
      country: config.country,
      language: 'en-GB',
      theme: 'dark'
    };

    const gpsInfo: GpsInfo = {
      latitude: 51.233186,  // Warsaw, Poland
      longitude: 22.518373,
      accuracy: 19.791364,
      bearing: 0,
      speed: -1.000007,
      timestamp: Math.floor(Date.now() / 1000),
      age: 0.01,
      accuracyMeters: 19.791364,
      adjustedBearing: 0,
      bearingAccuracyDeg: 180,
      speedAccuracyMps: 1.8
    };

    const spinner = ora('Initializing Bolt Driver API...').start();
    const api = new BoltDriverAPI(deviceInfo, authConfig);
    spinner.succeed(chalk.green('API initialized successfully'));

    // Attempt authentication if user wants
    const { attemptAuth } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'attemptAuth',
        message: 'Attempt authentication now?',
        default: true
      }
    ]);

    let authenticated = false;
    if (attemptAuth) {
      authenticated = await performAuthentication(api, config.phoneNumber, config.useRealCredentials);
    }

    return {
      api,
      authenticated,
      gpsInfo
    };

  } catch (error) {
    console.error(chalk.red('Initialization failed:'), error);
    return null;
  }
}

async function performAuthentication(api: BoltDriverAPI, phoneNumber: string, useRealCredentials: boolean): Promise<boolean> {
  try {
    console.log(chalk.cyan('\n🔐 Authentication Process\n'));

    const spinner = ora('Starting authentication...').start();

    // Get device info from the API instance
    const deviceInfo = {
      deviceId: 'cli-device-' + Date.now(),
      deviceType: 'iphone' as const,
      deviceName: 'iPhone CLI',
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

    const credentials: any = {
      driver_id: 'cli_driver',
      session_id: 'cli_session_' + Date.now(),
      phone: phoneNumber
    };

    const authResponse = await api.startAuthentication(authConfig, deviceInfo, credentials);
    spinner.succeed('SMS sent successfully');

    console.log(boxen(
      `${chalk.yellow('📨 SMS Sent')}\n\n` +
      `Verification Token: ${authResponse.data?.verification_token?.substring(0, 20) || 'N/A'}...\n` +
      `Code Channel: ${authResponse.data?.verification_code_channel || 'N/A'}`,
      { padding: 1, borderColor: 'yellow' }
    ));

    let smsCode = '123456';
    if (useRealCredentials) {
      const { code } = await inquirer.prompt([
        {
          type: 'input',
          name: 'code',
          message: 'Enter SMS code:',
          validate: (input: string) => /^\d{6}$/.test(input)
        }
      ]);
      smsCode = code;
    }

    spinner.start('Verifying SMS code...');

    // Add verification token to credentials for confirmation
    credentials.verification_token = authResponse.data?.verification_token;

    // Add SMS code to credentials before confirmation
    credentials.verification_code = smsCode;

    const confirmResponse = await api.confirmAuthentication(authConfig, deviceInfo, credentials);
    spinner.succeed(chalk.green('Authentication successful'));

    console.log(boxen(
      `${chalk.green('✅ Authenticated!')}\n\n` +
      `Token Type: ${confirmResponse.data?.token?.token_type || 'bearer'}\n` +
      `Refresh Token: ${confirmResponse.data?.token?.refresh_token?.substring(0, 20) || 'N/A'}...`,
      { padding: 1, borderColor: 'green' }
    ));

    return true;

  } catch (error) {
    console.log(chalk.red('Authentication failed:'), (error as Error).message);
    return false;
  }
}

async function mainMenu(state: CLIState) {
  while (true) {
    console.log(chalk.cyan('\n🎛️  Main Menu\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select an action:',
        choices: [
          { name: '🔐 Authentication', value: 'auth' },
          { name: '📊 Driver State', value: 'driverState' },
          { name: '🏠 Home Screen', value: 'homeScreen' },
          { name: '⏰ Working Time', value: 'workingTime' },
          { name: '⚙️  Dispatch Preferences', value: 'dispatch' },
          { name: '🗺️  Maps Configuration', value: 'maps' },
          { name: '🧭 Navigation Badges', value: 'navigation' },
          { name: '🆘 Emergency Assist', value: 'emergency' },
          { name: '🧩 Map Tiles', value: 'tiles' },
          { name: '📱 Device Token', value: 'deviceToken' },
          { name: '💾 Driver Store', value: 'driverStore' },
          { name: '📞 Phone Details', value: 'phoneDetails' },
          new inquirer.Separator(),
          { name: '🌍 Update GPS', value: 'gps' },
          { name: '📋 API Status', value: 'status' },
          { name: '🚪 Exit', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') {
      console.log(chalk.green('\n👋 Thanks for using Bolt Driver API CLI!'));
      break;
    }

    await handleAction(action, state);
  }
}

async function handleAction(action: string, state: CLIState) {
  const spinner = ora();

  try {
    switch (action) {
      case 'auth':
        await handleAuthentication(state);
        break;

      case 'driverState':
        if (!checkAuth(state)) return;
        spinner.start('Getting driver state...');
        const driverState = await state.api.getDriverState(state.gpsInfo);
        spinner.succeed('Driver state retrieved');
        displayResult('Driver State', driverState);
        break;

      case 'homeScreen':
        if (!checkAuth(state)) return;
        spinner.start('Getting home screen data...');
        const homeScreen = await state.api.getDriverHomeScreen(state.gpsInfo);
        spinner.succeed('Home screen data retrieved');
        displayResult('Home Screen', homeScreen);
        break;

      case 'workingTime':
        if (!checkAuth(state)) return;
        spinner.start('Getting working time info...');
        const workingTime = await state.api.getWorkingTimeInfo(state.gpsInfo);
        spinner.succeed('Working time info retrieved');
        displayResult('Working Time', workingTime);
        break;

      case 'dispatch':
        if (!checkAuth(state)) return;
        spinner.start('Getting dispatch preferences...');
        const dispatch = await state.api.getDispatchPreferences(state.gpsInfo);
        spinner.succeed('Dispatch preferences retrieved');
        displayResult('Dispatch Preferences', dispatch);
        break;

      case 'maps':
        if (!checkAuth(state)) return;
        spinner.start('Getting maps configuration...');
        const maps = await state.api.getMapsConfigs(state.gpsInfo);
        spinner.succeed('Maps configuration retrieved');
        displayResult('Maps Configuration', maps);
        break;

      case 'navigation':
        if (!checkAuth(state)) return;
        spinner.start('Getting navigation badges...');
        const navigation = await state.api.getDriverNavBarBadges(state.gpsInfo);
        spinner.succeed('Navigation badges retrieved');
        displayResult('Navigation Badges', navigation);
        break;

      case 'emergency':
        if (!checkAuth(state)) return;
        spinner.start('Getting emergency assist provider...');
        const emergency = await state.api.getEmergencyAssistProvider(state.gpsInfo);
        spinner.succeed('Emergency assist provider retrieved');
        displayResult('Emergency Assist', emergency);
        break;

      case 'tiles':
        if (!checkAuth(state)) return;
        const { collectionId, zoom, x, y } = await inquirer.prompt([
          {
            type: 'input',
            name: 'collectionId',
            message: 'Tiles collection ID:',
            default: 'Surge_465_88_1755867891953'
          },
          {
            type: 'number',
            name: 'zoom',
            message: 'Zoom level:',
            default: 8
          },
          {
            type: 'number',
            name: 'x',
            message: 'X coordinate:',
            default: 4
          },
          {
            type: 'number',
            name: 'y',
            message: 'Y coordinate:',
            default: 4
          }
        ]);
        
        spinner.start('Getting map tiles...');
        const tiles = await state.api.getMapTile(state.gpsInfo, collectionId, zoom, x, y);
        spinner.succeed('Map tiles retrieved');
        console.log(chalk.green(`\n✅ Map tiles retrieved: ${tiles.byteLength} bytes`));
        break;

      case 'deviceToken':
        if (!checkAuth(state)) return;
        const { token } = await inquirer.prompt([
          {
            type: 'input',
            name: 'token',
            message: 'Device token:',
            default: 'demo-device-token-12345'
          }
        ]);
        
        spinner.start('Setting device token...');
        await state.api.setDeviceToken(token);
        spinner.succeed('Device token set');
        console.log(chalk.green('\n✅ Device token set successfully'));
        break;

      case 'driverStore':
        if (!checkAuth(state)) return;
        const { driverData } = await inquirer.prompt([
          {
            type: 'input',
            name: 'driverData',
            message: 'Driver data (JSON):',
            default: '{"test": "data", "timestamp": ' + Date.now() + '}',
            validate: (input: string) => {
              try {
                JSON.parse(input);
                return true;
              } catch {
                return 'Please enter valid JSON';
              }
            }
          }
        ]);
        
        spinner.start('Storing driver info...');
        await state.api.storeDriverInfo(JSON.parse(driverData));
        spinner.succeed('Driver info stored');
        console.log(chalk.green('\n✅ Driver info stored successfully'));
        break;

      case 'phoneDetails':
        if (!checkAuth(state)) return;
        spinner.start('Getting phone details...');
        const phoneDetails = await state.api.getDriverPhoneDetails(state.gpsInfo);
        spinner.succeed('Phone details retrieved');
        displayResult('Phone Details', phoneDetails);
        break;

      case 'gps':
        await handleGPSUpdate(state);
        break;

      case 'status':
        displayAPIStatus(state);
        break;

      default:
        console.log(chalk.red('Unknown action'));
    }

  } catch (error) {
    spinner.fail('Operation failed');
    console.log(boxen(
      `${chalk.red('❌ Error:')}\n\n${(error as Error).message}`,
      { padding: 1, borderColor: 'red' }
    ));
  }
}

async function handleAuthentication(state: CLIState) {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Authentication action:',
      choices: [
        { name: '🔐 Start New Authentication', value: 'start' },
        { name: '🔑 Get Access Token', value: 'token' },
        { name: '📋 Check Status', value: 'status' },
        { name: '🚪 Clear Authentication', value: 'clear' }
      ]
    }
  ]);

  switch (action) {
    case 'start':
      const { phoneNumber, useReal } = await inquirer.prompt([
        {
          type: 'input',
          name: 'phoneNumber',
          message: 'Phone number:',
          default: '+48123456789'
        },
        {
          type: 'confirm',
          name: 'useReal',
          message: 'Use real credentials?',
          default: false
        }
      ]);
      state.authenticated = await performAuthentication(state.api, phoneNumber, useReal);
      break;

    case 'token':
      if (!checkAuth(state)) return;
      const spinner = ora('Getting access token...').start();
      const token = await state.api.getAccessToken();
      spinner.succeed('Access token retrieved');
      console.log(chalk.green(`\n🎫 Access Token: ${token.substring(0, 30)}...`));
      break;

    case 'status':
      displayAPIStatus(state);
      break;

    case 'clear':
      state.api.clearAuthentication();
      state.authenticated = false;
      console.log(chalk.yellow('\n🧹 Authentication cleared'));
      break;
  }
}

async function handleGPSUpdate(state: CLIState) {
  const gpsInput = await inquirer.prompt([
    {
      type: 'number',
      name: 'latitude',
      message: 'Latitude:',
      default: state.gpsInfo.latitude
    },
    {
      type: 'number',
      name: 'longitude',
      message: 'Longitude:',
      default: state.gpsInfo.longitude
    },
    {
      type: 'number',
      name: 'accuracy',
      message: 'Accuracy (meters):',
      default: state.gpsInfo.accuracy
    },
    {
      type: 'number',
      name: 'speed',
      message: 'Speed (m/s):',
      default: state.gpsInfo.speed
    }
  ]);

  state.gpsInfo = {
    ...gpsInput,
    bearing: 0,
    timestamp: Math.floor(Date.now() / 1000),
    age: 0.01,
    accuracyMeters: gpsInput.accuracy || 15,
    adjustedBearing: 0,
    bearingAccuracyDeg: 180,
    speedAccuracyMps: 1.8
  };

  console.log(chalk.green('\n🌍 GPS information updated successfully'));
}

function checkAuth(state: CLIState): boolean {
  if (!state.authenticated) {
    console.log(chalk.yellow('\n⚠️  Authentication required. Please authenticate first.'));
    return false;
  }
  return true;
}

function displayResult(title: string, data: any) {
  console.log(boxen(
    `${chalk.blue.bold(title)}\n\n${chalk.gray(JSON.stringify(data, null, 2))}`,
    { padding: 1, borderColor: 'blue', borderStyle: 'round' }
  ));
}

function displayAPIStatus(state: CLIState) {
  const sessionInfo = state.api.getSessionInfo();
  
  console.log(boxen(
    `${chalk.blue.bold('📊 API Status')}\n\n` +
    `${chalk.gray('Authenticated:')} ${state.authenticated ? chalk.green('✅ Yes') : chalk.red('❌ No')}\n` +
    `${chalk.gray('Has Session:')} ${sessionInfo ? chalk.green('✅ Yes') : chalk.red('❌ No')}\n` +
    (sessionInfo ? 
      `${chalk.gray('Driver ID:')} ${sessionInfo.driverId}\n` +
      `${chalk.gray('Partner ID:')} ${sessionInfo.partnerId}\n` +
      `${chalk.gray('Company ID:')} ${sessionInfo.companyId}\n`
    : '') +
    `${chalk.gray('GPS Location:')} ${state.gpsInfo.latitude}, ${state.gpsInfo.longitude}\n` +
    `${chalk.gray('GPS Accuracy:')} ${state.gpsInfo.accuracy}m`,
    { padding: 1, borderColor: 'blue', borderStyle: 'double' }
  ));
}

function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }).toUpperCase();
}

if (require.main === module) {
  main().catch(console.error);
}