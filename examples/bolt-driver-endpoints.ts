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
function logError(message: string, error?: unknown) {
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
    gps_speed_accuracy: 1,
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
  const tokenStorage = new FileTokenStorage(".bolt-token.json");
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
      tokenStorage,
      {
        enabled: true,
        level: 'debug',
        logRequests: true,
        logResponses: true,
        logErrors: true
      }
    );

    // Display the token storage file path in a clear format
    console.log(`TOKEN FILE: ${tokenStorage.filePath}`);

    // Read and display the contents of the token file (if it exists)
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(tokenStorage.filePath, 'utf8');
      console.log(`TOKEN CONTENT: ${content}`);
    } catch (err) {
      console.log("TOKEN CONTENT: (No token file found or unable to read)");
    }

    // Load and validate existing token from storage
    const isAuthenticated = await api.validateExistingToken();

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
      const result = await (api as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[endpoint.method](...endpoint.args);

      // Handle different response structures
      if (result) {
        const resultObj = result as Record<string, unknown>;
        
        // Check if it's an ApiResponse wrapper
        if ('code' in resultObj && resultObj.code !== undefined) {
          if (resultObj.code === 0) {
            console.log(chalk.green("✓ Success"));
            
            // Display useful information based on the endpoint
            const data = resultObj.data as Record<string, unknown> | undefined;
            if (endpoint.method === "getLoggedInDriverConfiguration" && data?.driver_info) {
              const driver = data.driver_info as Record<string, unknown>;
              console.log(chalk.gray(`   Driver: ${driver.first_name || 'N/A'} ${driver.last_name || 'N/A'}`));
              const vehicleInfo = data.vehicle_info as Record<string, unknown> | undefined;
              console.log(chalk.gray(`   Vehicle: ${vehicleInfo?.make || 'N/A'} ${vehicleInfo?.model || 'N/A'}`));
            } else if (endpoint.method === "getScheduledRideRequests" && data?.scheduled_requests) {
              const scheduledRequests = data.scheduled_requests as unknown[];
              console.log(chalk.gray(`   Scheduled rides: ${scheduledRequests.length}`));
            } else if (endpoint.method === "getEarningLandingScreen" && data) {
              console.log(chalk.gray(`   Today's earnings: ${(data as Record<string, unknown>).today_earnings || '0'}`));
            } else if (endpoint.method === "getActivityRides" && data?.activity_rides) {
              const activityRides = data.activity_rides as unknown[];
              console.log(chalk.gray(`   Activity rides: ${activityRides.length}`));
            } else if (endpoint.method === "getOrderHistoryPaginated" && data?.orders) {
              const orders = data.orders as unknown[];
              console.log(chalk.gray(`   Order history: ${orders.length} orders`));
            } else if (endpoint.method === "getHelpDetails" && data) {
              console.log(chalk.gray(`   Help sections: ${Object.keys(data).length}`));
            }
          } else {
            console.log(
              chalk.yellow(`⚠ Non-zero response code: ${resultObj.code} - ${(resultObj as Record<string, unknown>).message || 'Unknown error'}`)
            );
          }
        } else {
          // Direct response without wrapper (like getLoggedInDriverConfiguration)
          console.log(chalk.green("✓ Success"));
          
          // Display specific information for known direct response endpoints
          if (endpoint.method === "getLoggedInDriverConfiguration") {
            if ('driver_info' in resultObj) {
              const driver = resultObj.driver_info as Record<string, unknown>;
              console.log(chalk.gray(`   Driver: ${driver.first_name || 'N/A'} ${driver.last_name || 'N/A'}`));
              const vehicleInfo = resultObj.vehicle_info as Record<string, unknown> | undefined;
              console.log(chalk.gray(`   Vehicle: ${vehicleInfo?.make || 'N/A'} ${vehicleInfo?.model || 'N/A'}`));
              console.log(chalk.gray(`   Phone: ${driver.phone || 'N/A'}`));
            }
          } else {
            // Generic handling for other direct responses - show ALL data in full detail with beautiful formatting
            if (typeof result === 'object' && result !== null) {
              console.log(chalk.cyan('   📊 Full Response Data:'));
              console.log(chalk.gray('   ┌─────────────────────────────────────────────────────────────────'));
              
              const displayFullValue = (value: unknown, indent: string = '   │ ', prefix: string = '', isLast: boolean = false): void => {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStatus = (error as { statusCode?: number }).statusCode;
      
      if (errorMessage.includes("NOT_AUTHORIZED") || errorStatus === 401) {
        console.log(chalk.yellow("⚠ Token expired or invalid (NOT_AUTHORIZED)"));
        console.log(chalk.gray("   This is normal - token may have expired"));
      } else {
        console.log(chalk.red(`❌ Error: ${errorMessage}`));
        const errorWithResponse = error as { response?: { data?: unknown } };
        if (errorWithResponse.response?.data) {
          console.log(chalk.gray(`   Response: ${JSON.stringify(errorWithResponse.response.data).substring(0, 100)}...`));
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

// Only run if this file is executed directly (not imported)
if (require.main === module) {
  runBoltDriverExample().catch((error) => {
    logError("Unhandled Error in Bolt Driver Example", error);
    process.exit(1);
  });
}
