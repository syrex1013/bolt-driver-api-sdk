#!/usr/bin/env ts-node

import { BoltDriverAPI, FileTokenStorage } from '../src';
import { DeviceInfo, AuthConfig, GpsInfo } from '../src/types';
import chalk from 'chalk';
import boxen from 'boxen';

/**
 * Magic Link Authentication Test with Provided URL
 *
 * This script demonstrates:
 * 1. Extracting token from the provided AWS tracking URL
 * 2. Authenticating with the magic link
 * 3. Printing all responses prettified and formatted
 */

async function magicLinkTest() {
  console.clear();

  console.log(boxen(
    chalk.blue.bold('🔗 Magic Link Authentication Test'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue'
    }
  ));

  // The provided magic link URL
  const magicLinkUrl = 'https://3zf1wp45.r.eu-central-1.awstrack.me/L0/https:%2F%2Fpartners.bolt.eu%2Fdriverapp%2Fmagic-login.html%3Fplatform=iOS%26token=zRAvoPUBtvNy51xm61S4I45UMHLr3TqAFI1TRSkKfFlv1350mnptYmXVE5ypwuW2J1WRysI7doZ2gHo2x7gTLp9oaRBy4vwoBPpW7V1tkIIyn5iX84beKnf33FBe4rCAXbuEIwnqujgyhoF46Oh8wrHNwOgivxuF5r5Bl7Dr9o5RAq9hVI5EfHgMCjcTGzM7Gernd8XBNeXXm1Hs7wLNmVW9lUZQcwyXkbI8AK8ouEO12jRLRv66UeOfgGBgXt3/1/01070199190b4b96-8446d31d-67a2-49f8-9a37-84870f5b0bc1-000000/5JLNwX5I4RZkLgdP_W6ULV5VkOA=223';

  console.log('\n🔗 Provided Magic Link URL:');
  console.log(chalk.gray(magicLinkUrl));

  // Initialize device info
  const deviceInfo: DeviceInfo = {
    deviceId: 'test-device-12345',
    deviceType: 'iphone',
    deviceName: 'iPhone17,3',
    deviceOsVersion: 'iOS18.6',
    appVersion: 'DI.116.0'
  };

  // Initialize auth config
  const authConfig: AuthConfig = {
    authMethod: 'email',
    brand: 'bolt',
    country: 'pl',
    language: 'en-GB',
    theme: 'dark'
  };

  // Initialize logging config
  const loggingConfig = {
    enabled: true,
    level: 'debug' as const,
    logRequests: true,
    logResponses: true,
    logErrors: true,
    logToFile: false
  };

  // Initialize API
  const tokenStorage = new FileTokenStorage('.magic-link-test-token.json');
  const boltAPI = new BoltDriverAPI(deviceInfo, authConfig, undefined, tokenStorage, loggingConfig);

  console.log('\n📱 Device Information:');
  console.log(`   Device ID: ${deviceInfo.deviceId}`);
  console.log(`   Device Type: ${deviceInfo.deviceType}`);
  console.log(`   Device Name: ${deviceInfo.deviceName}`);
  console.log(`   OS Version: ${deviceInfo.deviceOsVersion}`);

  try {
    // Step 1: Extract token from magic link
    console.log('\n🔑 Step 1: Extracting token from magic link...');
    const token = BoltDriverAPI.extractTokenFromMagicLink(magicLinkUrl);

    console.log(chalk.green('✅ Token extracted successfully!'));
    console.log(`   Token: ${chalk.yellow(token)}`);
    console.log(`   Token Length: ${token.length} characters`);

    // Step 2: Authenticate with magic link
    console.log('\n🔐 Step 2: Authenticating with magic link...');

    // Create GPS info for authentication
    const gpsInfo: GpsInfo = {
      latitude: 51.233234,
      longitude: 22.518391,
      accuracy: 15,
      accuracyMeters: 15,
      speed: 0,
      timestamp: Math.floor(Date.now() / 1000),
      bearing: 0,
      adjustedBearing: 0,
      age: 30,
      bearingAccuracyDeg: 0,
      speedAccuracyMps: 1.8,
      gps_speed_accuracy: 0
    };

    const authResponse = await boltAPI.authenticateWithMagicLink(token, deviceInfo, gpsInfo);

    // Pretty print authentication response
    console.log(chalk.green('✅ Authentication Response:'));
    printPrettyJson(authResponse);

    if (authResponse.code === 0 && authResponse.data?.refresh_token) {
      console.log(chalk.green('\n✅ Authentication successful!'));

      // Check authentication state
      console.log('\n🔍 Authentication State:');
      console.log(`   Access Token: ${boltAPI.getAccessToken() ? chalk.green('✅ Set') : chalk.red('❌ Not set')}`);
      console.log(`   Refresh Token: ${boltAPI.isAuthenticated() ? chalk.green('✅ Set') : chalk.red('❌ Not set')}`);
      console.log(`   Is Authenticated: ${boltAPI.isAuthenticated() ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);

      // Step 3: Test various API endpoints and print responses
      console.log('\n🚀 Step 3: Testing API Endpoints...\n');

      const endpoints = [
        {
          name: 'Driver Navigation Bar Badges',
          method: () => boltAPI.getDriverNavBarBadges(gpsInfo)
        },
        {
          name: 'Driver State',
          method: () => boltAPI.getDriverState(gpsInfo, 'background')
        },
        {
          name: 'Driver Home Screen',
          method: () => boltAPI.getDriverHomeScreen(gpsInfo)
        },
        {
          name: 'Working Time Info',
          method: () => boltAPI.getWorkingTimeInfo(gpsInfo)
        },
        {
          name: 'Dispatch Preferences',
          method: () => boltAPI.getDispatchPreferences(gpsInfo)
        },
        {
          name: 'Maps Configuration',
          method: () => boltAPI.getMapsConfigs(gpsInfo)
        },
        {
          name: 'Emergency Assist Provider',
          method: () => boltAPI.getEmergencyAssistProvider(gpsInfo)
        },
        {
          name: 'Other Active Drivers',
          method: () => boltAPI.getOtherActiveDrivers(gpsInfo)
        },
        {
          name: 'Modal Information',
          method: () => boltAPI.getModal(gpsInfo, 'home_screen')
        },
        {
          name: 'Driver Phone Details',
          method: () => boltAPI.getDriverPhoneDetails(gpsInfo)
        },
        {
          name: 'Scheduled Ride Requests',
          method: () => boltAPI.getScheduledRideRequests(gpsInfo)
        },
        {
          name: 'Earnings Landing Screen',
          method: () => boltAPI.getEarningLandingScreen(gpsInfo)
        },
        {
          name: 'Activity Rides',
          method: () => boltAPI.getActivityRides(gpsInfo)
        },
        {
          name: 'Order History (Paginated)',
          method: () => boltAPI.getOrderHistoryPaginated(gpsInfo)
        },
        {
          name: 'Help Details',
          method: () => boltAPI.getHelpDetails(gpsInfo)
        },
        {
          name: 'Earn More Details',
          method: () => boltAPI.getEarnMoreDetails(gpsInfo)
        },
        {
          name: 'Score Overview',
          method: () => boltAPI.getScoreOverview(gpsInfo)
        },
        {
          name: 'Driver Sidebar',
          method: () => boltAPI.getDriverSidebar(gpsInfo)
        },
        {
          name: 'Logged In Driver Configuration',
          method: () => boltAPI.getLoggedInDriverConfiguration()
        }
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(chalk.blue(`📡 Testing: ${endpoint.name}`));
          const response = await endpoint.method();

          console.log(chalk.green(`✅ ${endpoint.name} Response:`));
          printPrettyJson(response);
          console.log(''); // Add spacing between responses

        } catch (error) {
          console.log(chalk.red(`❌ ${endpoint.name} Failed:`));
          console.log(chalk.red(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
          console.log(''); // Add spacing
        }
      }

      // Test map tile functionality
      console.log(chalk.blue('🗺️ Testing Map Tile Functionality...'));
      try {
        const tilesCollectionId = 'Surge_465_88_1755901831933';
        const x = 2304;
        const y = 1367;
        const zoom = 12;

        const tileData = await boltAPI.getMapTile(gpsInfo, tilesCollectionId, x, y, zoom);

        console.log(chalk.green('✅ Map Tile Response:'));
        console.log(`   Collection ID: ${tilesCollectionId}`);
        console.log(`   Coordinates: (${x}, ${y}) at zoom ${zoom}`);
        console.log(`   Tile Size: ${tileData.byteLength} bytes`);
        console.log(`   Tile Data (first 100 bytes): ${Array.from(new Uint8Array(tileData.slice(0, 100))).join(', ')}`);
        console.log('');

      } catch (error) {
        console.log(chalk.red('❌ Map Tile Failed:'));
        console.log(chalk.red(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        console.log('');
      }

    } else {
      console.log(chalk.red('\n❌ Authentication failed!'));
      console.log(`   Response Code: ${authResponse.code}`);
      console.log(`   Message: ${authResponse.message || 'No message'}`);
    }

  } catch (error) {
    console.log(chalk.red('\n💥 Error during magic link test:'));
    console.log(chalk.red(`   ${error instanceof Error ? error.message : 'Unknown error'}`));

    if (error instanceof Error && error.stack) {
      console.log(chalk.gray('\nStack trace:'));
      console.log(chalk.gray(error.stack));
    }
  }
}

/**
 * Pretty print JSON with colors and formatting
 */
function printPrettyJson(obj: any): void {
  const jsonString = JSON.stringify(obj, null, 2);

  // Simple syntax highlighting for JSON
  const highlighted = jsonString
    .replace(/"([^"]+)":/g, chalk.cyan('"$1"') + ':')  // Keys in cyan
    .replace(/: "([^"]+)"/g, ': ' + chalk.green('"$1"'))  // String values in green
    .replace(/: ([0-9]+|true|false|null)/g, ': ' + chalk.yellow('$1'))  // Numbers, booleans, null in yellow
    .replace(/({|}|\[|\])/g, chalk.magenta('$1'));  // Brackets in magenta

  console.log(highlighted);
}

// Run the test
if (require.main === module) {
  magicLinkTest().catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
}
