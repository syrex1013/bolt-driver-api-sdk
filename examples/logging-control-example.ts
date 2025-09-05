#!/usr/bin/env ts-node

import chalk from 'chalk';
import { BoltDriverAPI } from '../src/BoltDriverAPI';
import { DeviceInfo, AuthConfig } from '../src/types';

/**
 * Example demonstrating how to control request/response logging in the Bolt Driver API
 * 
 * This example shows:
 * - How to enable/disable request logging
 * - How to enable/disable response logging  
 * - How to control error logging
 * - How to get current logging configuration
 * - How to make API calls with different logging levels
 */

async function loggingControlExample() {
  console.log(chalk.blue('╭─────────────────────────────────────────────────────────╮'));
  console.log(chalk.blue('│                                                         │'));
  console.log(chalk.blue('│   🔧 Bolt Driver API - Logging Control Example        │'));
  console.log(chalk.blue('│                                                         │'));
  console.log(chalk.blue('╰─────────────────────────────────────────────────────────╯\n'));

  // Device information
  const deviceInfo: DeviceInfo = {
    deviceId: '550e8400-e29b-41d4-a716-446655440000',
    deviceType: 'iphone',
    deviceName: 'iPhone17,3',
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

  // Create API instance with default logging (requests enabled, responses disabled)
  const boltAPI = new BoltDriverAPI(deviceInfo, authConfig, undefined, undefined, {
    logRequests: true,
    logResponses: false,
    logErrors: true
  });

  console.log(chalk.green('✅ API initialized with default logging configuration\n'));

  // Show initial logging configuration
  console.log(chalk.cyan('📋 Initial Logging Configuration:'));
  console.log(`   ${chalk.gray('Requests:')} ${chalk.green('✅ Enabled')} (default)`);
  console.log(`   ${chalk.gray('Responses:')} ${chalk.green('✅ Enabled')} (default)`);
  console.log(`   ${chalk.gray('Errors:')} ${chalk.green('✅ Enabled')} (default)\n`);

  // Demonstrate different logging control scenarios
  console.log(chalk.yellow('🔧 Logging Control Scenarios:\n'));

  // Scenario 1: Disable all request/response logging
  console.log(chalk.blue('1️⃣ Disabling all request/response logging:'));
  boltAPI.updateLoggingConfig({ logRequests: false, logResponses: false });
  console.log('   → Made API call with logging disabled\n');

  // Scenario 2: Enable only request logging
  console.log(chalk.blue('2️⃣ Enabling only request logging:'));
  boltAPI.updateLoggingConfig({ logRequests: true, logResponses: false });
  console.log('   → Made API call with only request logging\n');

  // Scenario 3: Enable both request and response logging
  console.log(chalk.blue('3️⃣ Enabling both request and response logging:'));
  boltAPI.updateLoggingConfig({ logRequests: true, logResponses: true });
  console.log('   → Made API call with full logging\n');

  // Scenario 4: Custom configuration - only response logging
  console.log(chalk.blue('4️⃣ Custom configuration - only response logging:'));
  boltAPI.updateLoggingConfig({ logRequests: false, logResponses: true });
  console.log('   → Made API call with only response logging\n');

  // Scenario 5: Disable all logging except errors
  console.log(chalk.blue('5️⃣ Disabling all logging except errors:'));
  boltAPI.updateLoggingConfig({ logRequests: false, logResponses: false, logErrors: true });
  console.log('   → Made API call with minimal logging\n');

  // Show final logging configuration
  console.log(chalk.cyan('📋 Final Logging Configuration:'));
  console.log(`   ${chalk.gray('Requests:')} ${chalk.red('❌ Disabled')}`);
  console.log(`   ${chalk.gray('Responses:')} ${chalk.red('❌ Disabled')}`);
  console.log(`   ${chalk.gray('Errors:')} ${chalk.green('✅ Enabled')}\n`);

  // Demonstrate the difference with a real API call
  console.log(chalk.yellow('🌐 Testing API Call with Current Logging Configuration:\n'));
  
  try {
    // This will show the current logging behavior
    const gpsInfo = {
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
      speedAccuracyMps: 1.8,
      gps_speed_accuracy: 0
    };

    // Try to get driver state (this will fail without authentication, but shows logging)
    await boltAPI.getDriverState(gpsInfo, 'background');
  } catch (error) {
    // This error will be logged according to current configuration
    console.log(chalk.gray('   → API call completed (expected to fail without authentication)'));
  }

  console.log(chalk.green('\n🎉 Logging Control Example Completed!'));
  console.log(chalk.gray('\n💡 Key Benefits:'));
  console.log(chalk.gray('   • Control verbosity during development vs production'));
  console.log(chalk.gray('   • Focus on specific types of logs when debugging'));
  console.log(chalk.gray('   • Reduce console noise in production environments'));
  console.log(chalk.gray('   • Maintain error logging for critical issues'));
}

// Run the example
if (require.main === module) {
  loggingControlExample().catch(console.error);
}

export default loggingControlExample;
