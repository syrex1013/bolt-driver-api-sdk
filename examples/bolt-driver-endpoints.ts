#!/usr/bin/env ts-node

import { BoltDriverAPI, FileTokenStorage } from "../src";
import {
  GpsInfo,
} from "../src/types";
import * as dotenv from "dotenv";
import chalk from "chalk";
import boxen from "boxen";

// Load environment variables
dotenv.config();

// Utility function for logging sections
function logSection(title: string) {
  console.log(
    boxen(chalk.bold.blue(title), {
        padding: 1,
        margin: 1,
        borderColor: "blue",
        borderStyle: "round",
    })
  );
}

// Utility function for logging errors
function logError(message: string, error?: any) {
  const errorString = error ? `\n\n${error.toString()}` : "";
  console.error(
    boxen(`${chalk.bold.red(message)}${errorString}`, {
      padding: 1,
      margin: 1,
      borderColor: "red",
      borderStyle: "bold",
    })
  );
}

// Utility function to create sample GPS info
function createSampleGpsInfo(): GpsInfo {
  return {
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
  };
}

export async function runBoltDriverExample(existingApi?: BoltDriverAPI) {
  console.clear();
  console.log(
    boxen(chalk.bold.green("🚗 Bolt Driver API Endpoints Example"), {
        padding: 1,
        margin: 1,
      borderStyle: "round",
        borderColor: "green",
    })
  );

  const tokenStorage = new FileTokenStorage();
  const api =
    existingApi ||
    new BoltDriverAPI(
      {
        deviceId: "example-device-id",
        deviceType: "iphone",
        deviceName: "iPhone17,3",
        deviceOsVersion: "iOS18.6",
        appVersion: "DI.115.0",
      },
      {
        authMethod: "phone",
        brand: "bolt",
        country: "pl",
        language: "en-GB",
        theme: "dark",
      },
      {}, // Empty config object
      tokenStorage
    );

  const isAuthenticated = await api.isAuthenticated();

  if (!isAuthenticated) {
    logError(
      "Authentication Required",
      "API is not authenticated. Please run the auth example first."
    );
    return;
  }

  logSection("🚀 Running API Endpoint Demonstrations");

  const gpsInfo: GpsInfo = createSampleGpsInfo();

  const endpointDemos = [
    { name: "Driver Configuration", method: "getLoggedInDriverConfiguration", args: [] },
    { name: "Scheduled Ride Requests", method: "getScheduledRideRequests", args: [gpsInfo, "upcoming"] },
    { name: "Earnings Landing Screen", method: "getEarningLandingScreen", args: [gpsInfo] },
    { name: "Activity Rides", method: "getActivityRides", args: [gpsInfo, "all"] },
    { name: "Order History", method: "getOrderHistoryPaginated", args: [gpsInfo, 10, 0] },
    { name: "Help Details", method: "getHelpDetails", args: [gpsInfo] },
  ];

  for (const endpoint of endpointDemos) {
    try {
      console.log(chalk.cyan(`\n🔹 Fetching: ${endpoint.name}...`));
      const result = await (api as any)[endpoint.method](...endpoint.args);

      // Handle different response structures
      if (result) {
        // Check if it's an ApiResponse wrapper
        if (result.code !== undefined) {
          if (result.code === 0) {
            console.log(chalk.green("✓ Success"));
            
            // Display useful information based on the endpoint
            if (endpoint.method === "getLoggedInDriverConfiguration" && result.data?.driver_info) {
              const driver = result.data.driver_info;
              console.log(chalk.gray(`   Driver: ${driver.first_name || 'N/A'} ${driver.last_name || 'N/A'}`));
              console.log(chalk.gray(`   Vehicle: ${result.data.vehicle_info?.make || 'N/A'} ${result.data.vehicle_info?.model || 'N/A'}`));
            } else if (endpoint.method === "getScheduledRideRequests" && result.data?.scheduled_requests) {
              console.log(chalk.gray(`   Scheduled rides: ${result.data.scheduled_requests.length}`));
            } else if (endpoint.method === "getEarningLandingScreen" && result.data) {
              console.log(chalk.gray(`   Today's earnings: ${result.data.today_earnings || '0'}`));
            } else if (endpoint.method === "getActivityRides" && result.data?.activity_rides) {
              console.log(chalk.gray(`   Activity rides: ${result.data.activity_rides.length}`));
            } else if (endpoint.method === "getOrderHistoryPaginated" && result.data?.orders) {
              console.log(chalk.gray(`   Order history: ${result.data.orders.length} orders`));
            } else if (endpoint.method === "getHelpDetails" && result.data) {
              console.log(chalk.gray(`   Help sections: ${Object.keys(result.data).length}`));
            }
          } else {
            console.log(
              chalk.yellow(`⚠ Non-zero response code: ${result.code} - ${result.message || 'Unknown error'}`)
            );
          }
        } else {
          // Direct response without wrapper (like getLoggedInDriverConfiguration)
          console.log(chalk.green("✓ Success"));
          
          // Display specific information for known direct response endpoints
          if (endpoint.method === "getLoggedInDriverConfiguration") {
            if (result.driver_info) {
              const driver = result.driver_info;
              console.log(chalk.gray(`   Driver: ${driver.first_name || 'N/A'} ${driver.last_name || 'N/A'}`));
              console.log(chalk.gray(`   Vehicle: ${result.vehicle_info?.make || 'N/A'} ${result.vehicle_info?.model || 'N/A'}`));
              console.log(chalk.gray(`   Phone: ${driver.phone || 'N/A'}`));
            }
          } else {
            // Generic handling for other direct responses - show ALL data in full detail with beautiful formatting
            if (typeof result === 'object' && result !== null) {
              console.log(chalk.cyan('   📊 Full Response Data:'));
              console.log(chalk.gray('   ┌─────────────────────────────────────────────────────────────────'));
              
              const displayFullValue = (value: any, indent: string = '   │ ', prefix: string = '', isLast: boolean = false): void => {
                const connector = isLast ? '└─' : '├─';
                const nextIndent = isLast ? indent + '   ' : indent + '│  ';
                
                if (value === null) {
                  console.log(chalk.gray(`${indent}${connector} ${chalk.yellow(prefix)}${chalk.red('null')}`));
                } else if (value === undefined) {
                  console.log(chalk.gray(`${indent}${connector} ${chalk.yellow(prefix)}${chalk.red('undefined')}`));
                } else if (typeof value === 'boolean') {
                  console.log(chalk.gray(`${indent}${connector} ${chalk.yellow(prefix)}${chalk.green(String(value))}`));
                } else if (typeof value === 'number') {
                  console.log(chalk.gray(`${indent}${connector} ${chalk.yellow(prefix)}${chalk.blue(String(value))}`));
                } else if (typeof value === 'string') {
                  const displayStr = value.length > 100 ? value.substring(0, 97) + '...' : value;
                  console.log(chalk.gray(`${indent}${connector} ${chalk.yellow(prefix)}${chalk.white(displayStr)}`));
                } else if (Array.isArray(value)) {
                  if (value.length === 0) {
                    console.log(chalk.gray(`${indent}${connector} ${chalk.yellow(prefix)}${chalk.magenta('[]')}`));
                  } else {
                    console.log(chalk.gray(`${indent}${connector} ${chalk.yellow(prefix)}${chalk.magenta(`[${value.length} items]`)}`));
                    value.forEach((item, index, array) => {
                      const isLastItem = index === array.length - 1;
                      displayFullValue(item, nextIndent, `${chalk.cyan(`[${index}]`)}: `, isLastItem);
                    });
                  }
                } else if (typeof value === 'object') {
                  const keys = Object.keys(value);
                  if (keys.length === 0) {
                    console.log(chalk.gray(`${indent}${connector} ${chalk.yellow(prefix)}${chalk.magenta('{}')}`));
                  } else {
                    console.log(chalk.gray(`${indent}${connector} ${chalk.yellow(prefix)}${chalk.magenta(`{${keys.length} properties}`)}`));
                    const entries = Object.entries(value);
                    entries.forEach(([objKey, objValue], index) => {
                      const isLastProp = index === entries.length - 1;
                      displayFullValue(objValue, nextIndent, `${chalk.cyan(objKey)}: `, isLastProp);
                    });
                  }
                } else {
                  console.log(chalk.gray(`${indent}${connector} ${chalk.yellow(prefix)}${chalk.white(String(value))}`));
                }
              };

              const entries = Object.entries(result);
              entries.forEach(([key, value], index) => {
                const isLast = index === entries.length - 1;
                displayFullValue(value, '   │ ', `${chalk.bold.yellow(key.toUpperCase())}: `, isLast);
              });
              
              console.log(chalk.gray('   └─────────────────────────────────────────────────────────────────'));
            }
          }
        }
      } else {
        console.log(chalk.yellow("⚠ No response data received"));
      }
    } catch (error: any) {
      if (error.message?.includes("NOT_AUTHORIZED") || error.statusCode === 401) {
        console.log(chalk.yellow("⚠ Token expired or invalid (NOT_AUTHORIZED)"));
        console.log(chalk.gray("   This is normal - token may have expired"));
      } else {
        console.log(chalk.red(`❌ Error: ${error.message || error}`));
        if (error.response?.data) {
          console.log(chalk.gray(`   Response: ${JSON.stringify(error.response.data).substring(0, 100)}...`));
        }
      }
    }
  }

  console.log(
    boxen(chalk.bold.green("🎉 Bolt Driver API Example Completed"), {
        padding: 1,
        margin: 1,
        borderColor: "green",
        borderStyle: "double",
      })
  );
}

if (require.main === module) {
  runBoltDriverExample().catch((error) => {
    logError("Unhandled Error in Bolt Driver Example", error);
    process.exit(1);
  });
}
