#!/usr/bin/env ts-node

import { BoltDriverAPI, FileTokenStorage } from "../src";
import { GpsInfo } from "../src/types";
import * as dotenv from "dotenv";
import chalk from "chalk";
import * as util from "util";

// Load environment variables
dotenv.config();

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
    gps_speed_accuracy: 1, // Added missing property
  };
}

function prettyPrint(obj: any, label: string) {
  console.log(chalk.cyan(`\n📊 ${label}:`));
  console.log(chalk.gray("━".repeat(50)));
  
  // Use util.inspect for better formatting
  const formatted = util.inspect(obj, {
    colors: true,
    depth: 3,
    compact: false,
    breakLength: 80
  });
  
  console.log(formatted);
  
  // Also show top-level structure
  if (typeof obj === 'object' && obj !== null) {
    console.log(chalk.yellow("\n🔑 Top-level keys:"));
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
      console.log(chalk.gray(`  ${key}: ${type}`));
    });
  }
}

export async function inspectAllResponses() {
  console.log(chalk.blue.bold("\n🔍 Bolt Driver API Response Inspector\n"));

  const tokenStorage = new FileTokenStorage();
  
  // Try to create API instance with stored auth
  const api = new BoltDriverAPI(
    {
      deviceId: "INSPECTOR-DEVICE",
      deviceType: "iphone",
      deviceName: "Inspector",
      deviceOsVersion: "iOS18.6",
      appVersion: "DI.116.0",
    },
    {
      authMethod: "phone",
      brand: "bolt",
      country: "pl",
      language: "en-GB",
      theme: "light",
    },
    {},
    tokenStorage
  );

  // Check if we have valid authentication
  try {
    await api.validateExistingToken();
    console.log(chalk.green("✅ Using existing authentication\n"));
  } catch (error) {
    console.log(chalk.red("❌ No valid authentication found. Please run the auth example first."));
    console.log(chalk.yellow("Run: npm run examples:auth"));
    return;
  }

  const gpsInfo: GpsInfo = createSampleGpsInfo();

  const endpoints = [
    { 
      name: "Driver Configuration", 
      method: "getLoggedInDriverConfiguration", 
      args: [] 
    },
    { 
      name: "Scheduled Ride Requests", 
      method: "getScheduledRideRequests", 
      args: [gpsInfo, "upcoming"] 
    },
    { 
      name: "Earnings Landing Screen", 
      method: "getEarningLandingScreen", 
      args: [gpsInfo] 
    },
    { 
      name: "Activity Rides", 
      method: "getActivityRides", 
      args: [gpsInfo, "all"] 
    },
    { 
      name: "Order History", 
      method: "getOrderHistoryPaginated", 
      args: [gpsInfo, 10, 0] 
    },
    { 
      name: "Help Details", 
      method: "getHelpDetails", 
      args: [gpsInfo] 
    },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(chalk.cyan(`\n🔄 Fetching: ${endpoint.name}...`));
      const result = await (api as any)[endpoint.method](...endpoint.args);
      
      prettyPrint(result, endpoint.name);
      
    } catch (error: any) {
      console.log(chalk.red(`❌ Error in ${endpoint.name}:`));
      console.log(chalk.gray(error.message || error));
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(chalk.green.bold("\n✅ Response inspection completed!"));
}

// Run if called directly
if (require.main === module) {
  inspectAllResponses().catch(console.error);
}
