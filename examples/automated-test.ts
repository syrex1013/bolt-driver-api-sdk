#!/usr/bin/env ts-node

/**
 * Automated Non-Interactive Test Suite
 * 
 * This script runs all Bolt Driver API examples automatically without user interaction.
 * It uses mock data and pre-configured credentials to test all API endpoints.
 * 
 * @example
 * ```bash
 * npm run test:examples
 * # or
 * npx ts-node examples/automated-test.ts
 * ```
 */

import { BoltDriverAPI } from "../src";
import { 
  DeviceInfo, 
  AuthConfig, 
  Credentials, 
  GpsInfo,
  ScheduledRideRequestGroupBy,
  ActivityRidesGroupBy
} from "../src/types";
import chalk from "chalk";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Test result interface
 */
interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

/**
 * Test configuration with mock data
 */
class TestConfig {
  // Device configuration
  static readonly DEVICE_INFO: DeviceInfo = {
    deviceId: process.env['TEST_DEVICE_ID'] || uuidv4(),
    deviceType: "iphone" as const,
    deviceName: "iPhone17,3",
    deviceOsVersion: "iOS18.6",
    appVersion: "DI.116.0"
  };

  // Authentication configuration
  static readonly AUTH_CONFIG: AuthConfig = {
    country: process.env['TEST_COUNTRY'] || "pl",
    language: process.env['TEST_LANGUAGE'] || "en-GB",
    brand: "bolt",
    authMethod: "phone" as const,
    theme: "light" as const
  };

  // Test credentials
  static readonly CREDENTIALS: Credentials = {
    phone: process.env['TEST_PHONE'] || "+48123456789",
    driver_id: "test_driver_" + Date.now(),
    session_id: "test_session_" + Date.now()
  };

  // GPS location (Warsaw, Poland)
  static readonly GPS_INFO: GpsInfo = {
    latitude: 51.23325,
    longitude: 22.518497,
    accuracy: 17.331588,
    bearing: 337.379444,
    speed: 0.235321,
    timestamp: Math.floor(Date.now() / 1000),
    age: 26.03,
    accuracyMeters: 13.821502,
    adjustedBearing: 0,
    bearingAccuracyDeg: 180,
    speedAccuracyMps: 1.808204567744442,
    gps_speed_accuracy: 1,
  };

  // Magic link for testing
  static readonly TEST_MAGIC_LINK = process.env['TEST_MAGIC_LINK'] || "";
  static readonly TEST_EMAIL = process.env['TEST_EMAIL'] || "test@example.com";
}

/**
 * Test runner class
 */
class AutomatedTestRunner {
  private api: BoltDriverAPI;
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  constructor() {
    this.api = new BoltDriverAPI(
      TestConfig.DEVICE_INFO,
      TestConfig.AUTH_CONFIG
    );
  }

  /**
   * Run a single test with error handling
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const testStart = Date.now();
    try {
      await testFn();
      return {
        name,
        success: true,
        duration: Date.now() - testStart
      };
    } catch (error) {
      return {
        name,
        success: false,
        duration: Date.now() - testStart,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test authentication flow
   */
  private async testAuthentication(): Promise<void> {
    console.log(chalk.cyan("\n🔐 Testing Authentication Flow..."));

    // Check if we have a stored token
    const isAuthenticated = await this.api.validateExistingToken();
    if (isAuthenticated) {
      console.log(chalk.green("✓ Using existing authentication"));
      return;
    }

    // If we have a magic link, use it
    if (TestConfig.TEST_MAGIC_LINK) {
      console.log(chalk.yellow("Using magic link authentication..."));
      await this.api.authenticateWithMagicLink(
        TestConfig.TEST_MAGIC_LINK,
        TestConfig.DEVICE_INFO,
        TestConfig.GPS_INFO
      );
      console.log(chalk.green("✓ Magic link authentication successful"));
      return;
    }

    // Otherwise, skip authentication tests
    console.log(chalk.yellow("⚠ Skipping authentication tests (no credentials provided)"));
    throw new Error("Authentication required for further tests");
  }

  /**
   * Test all driver endpoints
   */
  private async testDriverEndpoints(): Promise<void> {
    const endpoints = [
      {
        name: "Driver State",
        test: () => this.api.getDriverState(TestConfig.GPS_INFO, "foreground")
      },
      {
        name: "Driver Configuration",
        test: () => this.api.getLoggedInDriverConfiguration()
      },
      {
        name: "Home Screen",
        test: () => this.api.getDriverHomeScreen(TestConfig.GPS_INFO)
      },
      {
        name: "Working Time Info",
        test: () => this.api.getWorkingTimeInfo(TestConfig.GPS_INFO)
      },
      {
        name: "Dispatch Preferences",
        test: () => this.api.getDispatchPreferences(TestConfig.GPS_INFO)
      },
      {
        name: "Maps Config",
        test: () => this.api.getMapsConfigs(TestConfig.GPS_INFO)
      },
      {
        name: "Navigation Bar Badges",
        test: () => this.api.getDriverNavBarBadges(TestConfig.GPS_INFO)
      },
      // {
      //   name: "Emergency Assist Provider",
      //   test: () => this.api.getEmergencyAssistProvider(TestConfig.GPS_INFO)
      // },
      {
        name: "Other Active Drivers",
        test: () => this.api.getOtherActiveDrivers(TestConfig.GPS_INFO)
      },
      // {
      //   name: "Modal Info",
      //   test: () => this.api.getModal(TestConfig.GPS_INFO, "foreground")
      // }
    ];

    for (const endpoint of endpoints) {
      const result = await this.runTest(endpoint.name, endpoint.test);
      this.results.push(result);
      
      if (result.success) {
        console.log(chalk.green(`✓ ${endpoint.name}`));
      } else {
        console.log(chalk.red(`✗ ${endpoint.name}: ${result.error}`));
      }
    }
  }

  /**
   * Test ride-related endpoints
   */
  private async testRideEndpoints(): Promise<void> {
    console.log(chalk.cyan("\n🚗 Testing Ride Endpoints..."));

    const rideEndpoints = [
      {
        name: "Scheduled Ride Requests (Upcoming)",
        test: () => this.api.getScheduledRideRequests(
          TestConfig.GPS_INFO, 
          ScheduledRideRequestGroupBy.Upcoming
        )
      },
      {
        name: "Scheduled Ride Requests (Accepted)",
        test: () => this.api.getScheduledRideRequests(
          TestConfig.GPS_INFO,
          ScheduledRideRequestGroupBy.Accepted
        )
      },
      {
        name: "Activity Rides (All)",
        test: () => this.api.getActivityRides(
          TestConfig.GPS_INFO,
          ActivityRidesGroupBy.All
        )
      },
      {
        name: "Activity Rides (Hourly)",
        test: () => this.api.getActivityRides(
          TestConfig.GPS_INFO,
          ActivityRidesGroupBy.Hourly
        )
      },
      {
        name: "Order History Paginated",
        test: () => this.api.getOrderHistoryPaginated(TestConfig.GPS_INFO, 10, 0)
      }
      // Ride Details endpoint doesn't exist - commented out
      // {
      //   name: "Ride Details (Mock)",
      //   test: async () => {
      //     // Try to get a ride from order history first
      //     try {
      //       const history = await this.api.getOrderHistoryPaginated(TestConfig.GPS_INFO, 1, 0);
      //       if (history.orders && history.orders.length > 0) {
      //         const order = history.orders[0];
      //         return await this.api.getRideDetails(
      //           TestConfig.GPS_INFO,
      //           order.order_handle
      //         );
      //       }
      //     } catch {
      //       // Skip if no orders
      //     }
      //     throw new Error("No orders available for ride details test");
      //   }
      // }
    ];

    for (const endpoint of rideEndpoints) {
      const result = await this.runTest(endpoint.name, endpoint.test);
      this.results.push(result);
      
      if (result.success) {
        console.log(chalk.green(`✓ ${endpoint.name}`));
      } else {
        console.log(chalk.red(`✗ ${endpoint.name}: ${result.error}`));
      }
    }
  }

  /**
   * Test earnings endpoints
   */
  private async testEarningsEndpoints(): Promise<void> {
    console.log(chalk.cyan("\n💰 Testing Earnings Endpoints..."));

    const earningsEndpoints = [
      {
        name: "Earnings Landing Screen",
        test: () => this.api.getEarningLandingScreen(TestConfig.GPS_INFO)
      }
      // The following endpoints don't exist in the API - commented out
      // {
      //   name: "Earnings Breakdown",
      //   test: () => this.api.getEarningsBreakdown(TestConfig.GPS_INFO)
      // },
      // {
      //   name: "Earnings Chart (Weekly)",
      //   test: () => this.api.getEarningsChart(
      //     TestConfig.GPS_INFO,
      //     EarningsChartType.Weekly
      //   )
      // },
      // {
      //   name: "Earnings Daily Breakdown",
      //   test: () => this.api.getEarningsDailyBreakdown(
      //     TestConfig.GPS_INFO,
      //     new Date().toISOString().split('T')[0]
      //   )
      // },
      // {
      //   name: "Cash Out Options",
      //   test: () => this.api.getCashOutOptions(TestConfig.GPS_INFO)
      // },
      // {
      //   name: "Balance History",
      //   test: () => this.api.getBalanceHistory(TestConfig.GPS_INFO)
      // }
    ];

    for (const endpoint of earningsEndpoints) {
      const result = await this.runTest(endpoint.name, endpoint.test);
      this.results.push(result);
      
      if (result.success) {
        console.log(chalk.green(`✓ ${endpoint.name}`));
      } else {
        console.log(chalk.red(`✗ ${endpoint.name}: ${result.error}`));
      }
    }
  }

  /**
   * Test support endpoints
   */
  private async testSupportEndpoints(): Promise<void> {
    console.log(chalk.cyan("\n🆘 Testing Support Endpoints..."));

    const supportEndpoints = [
      {
        name: "Help Details",
        test: () => this.api.getHelpDetails(TestConfig.GPS_INFO)
      },
      // Support Chat Conversations and News List endpoints don't exist - commented out
      // {
      //   name: "Support Chat Conversations",
      //   test: () => this.api.getSupportChatConversations(TestConfig.GPS_INFO)
      // },
      {
        name: "Driver State (Support Section)",
        test: () => this.api.getDriverState(TestConfig.GPS_INFO, "foreground")
      }
      // {
      //   name: "News List",
      //   test: () => this.api.getNewsList(TestConfig.GPS_INFO)
      // }
    ];

    for (const endpoint of supportEndpoints) {
      const result = await this.runTest(endpoint.name, endpoint.test);
      this.results.push(result);
      
      if (result.success) {
        console.log(chalk.green(`✓ ${endpoint.name}`));
      } else {
        console.log(chalk.red(`✗ ${endpoint.name}: ${result.error}`));
      }
    }
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.filter(r => !r.success).length;

    console.log(chalk.cyan("\n📊 Test Summary"));
    console.log(chalk.gray("═".repeat(50)));
    
    console.log(chalk.white(`Total Tests: ${this.results.length}`));
    console.log(chalk.green(`Passed: ${successCount}`));
    console.log(chalk.red(`Failed: ${failureCount}`));
    console.log(chalk.gray(`Duration: ${(totalDuration / 1000).toFixed(2)}s`));
    
    if (failureCount > 0) {
      console.log(chalk.red("\n❌ Failed Tests:"));
      this.results.filter(r => !r.success).forEach(result => {
        console.log(chalk.red(`  - ${result.name}: ${result.error}`));
      });
    }

    console.log(chalk.gray("═".repeat(50)));
    
    const exitCode = failureCount > 0 ? 1 : 0;
    console.log(
      exitCode === 0 
        ? chalk.green("\n✅ All tests passed!")
        : chalk.red(`\n❌ ${failureCount} tests failed!`)
    );
    
    process.exit(exitCode);
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log(chalk.bold.cyan("🚀 Bolt Driver API Automated Test Suite"));
    console.log(chalk.gray("═".repeat(50)));

    try {
      // Test authentication first
      await this.testAuthentication();
      
      // If authenticated, run all other tests
      if (await this.api.validateExistingToken()) {
        console.log(chalk.cyan("\n📡 Testing Driver Endpoints..."));
        await this.testDriverEndpoints();
        await this.testRideEndpoints();
        await this.testEarningsEndpoints();
        await this.testSupportEndpoints();
      }
    } catch (error) {
      console.error(chalk.red("\n❌ Critical error:"), error);
    }

    // Print summary
    this.printSummary();
  }
}

// Run tests
(async () => {
  const runner = new AutomatedTestRunner();
  await runner.runAllTests();
})();
