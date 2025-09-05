#!/usr/bin/env ts-node

/**
 * Bolt Driver API - Ride Navigation and Directions Example
 * 
 * This example demonstrates how to use the Bolt Driver API for ride navigation,
 * including getting directions, tracking ride progress, and handling navigation events.
 * 
 * @example
 * ```bash
 * npm run example:navigation
 * # or
 * npx ts-node examples/ride-navigation.ts
 * ```
 */

import { BoltDriverAPI } from "../src";
import { GpsInfo, OrderHandle, OrderHistoryItem } from "../src/types";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";

/**
 * Navigation example class
 */
class RideNavigationExample {
  private api: BoltDriverAPI;
  
  constructor(api: BoltDriverAPI) {
    this.api = api;
  }

  /**
   * Display navigation header
   */
  private displayHeader(): void {
    console.clear();
    console.log(chalk.cyan.bold(`
   ╭──────────────────────────────────────────────╮
   │                                              │
   │   🗺️  Bolt Driver Navigation Example         │
   │                                              │
   ╰──────────────────────────────────────────────╯
    `));
  }

  /**
   * Get current GPS location (mock or real)
   */
  private async getCurrentLocation(): Promise<GpsInfo> {
    // In a real app, this would use device GPS
    const { useRealGPS } = await prompts({
      type: "confirm",
      name: "useRealGPS",
      message: "Use real GPS coordinates?",
      initial: false
    });

    if (useRealGPS) {
      const coordinates = await prompts([
        {
          type: "number",
          name: "latitude",
          message: "Enter latitude:",
          initial: 52.237049,
          validate: (value: number) => value >= -90 && value <= 90
        },
        {
          type: "number",
          name: "longitude",
          message: "Enter longitude:",
          initial: 21.017532,
          validate: (value: number) => value >= -180 && value <= 180
        }
      ]);

      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracy: 10,
        speed: 0,
        gps_speed_accuracy: 1,
        bearingAccuracyDeg: 180,
        timestamp: Date.now(),
        // Default values for missing GpsInfo properties
        bearing: 0,
        age: 0,
        accuracyMeters: 10,
        adjustedBearing: 0,
        speedAccuracyMps: 0,
      };
    }

    // Default Warsaw coordinates
    return {
      latitude: 52.237049,
      longitude: 21.017532,
      accuracy: 10,
      speed: 0,
      gps_speed_accuracy: 1,
      bearingAccuracyDeg: 180,
      timestamp: Date.now(),
      // Default values for missing GpsInfo properties
      bearing: 0,
      age: 0,
      accuracyMeters: 10,
      adjustedBearing: 0,
      speedAccuracyMps: 0,
    };
  }

  /**
   * Get active or recent ride
   */
  private async getActiveRide(gpsInfo: GpsInfo): Promise<OrderHandle | null> {
    const spinner = ora("Checking for active rides...").start();

    try {
      // First check driver state for active order
      const driverState = await this.api.getDriverState(gpsInfo, "foreground");
      
      if (driverState.active_order_handle) {
        spinner.succeed("Active ride found!");
        return driverState.active_order_handle;
      }

      // If no active ride, get recent rides
      spinner.text = "No active ride, fetching recent rides...";
      const orderHistory = await this.api.getOrderHistory(gpsInfo, 10, 0);
      
      if (orderHistory.data && orderHistory.data.orders && orderHistory.data.orders.length > 0) {
        spinner.stop();

        const orders: OrderHistoryItem[] = orderHistory.data.orders;

        console.log(chalk.yellow("\n📋 Recent Rides:"));
        orders.forEach((order: OrderHistoryItem, index: number) => {
          const statusColor = order.state === "finished" ? chalk.green : 
                            order.state === "client_cancelled" ? chalk.yellow :
                            order.state === "driver_rejected" ? chalk.red : chalk.gray;
          
          console.log(chalk.gray(`${index + 1}. ${order.address}`));
          console.log(`   ${statusColor(order.state)} - ${order.created}`);
          console.log(`   Payment: ${order.payment_type} - ${order.price_str || "N/A"}\n`);
        });

        const { selectedIndex } = await prompts({
          type: "number",
          name: "selectedIndex",
          message: "Select a ride (1-10):",
          initial: 1,
          validate: (value: number) => value >= 1 && value <= orders.length
        });

        if (selectedIndex !== undefined && selectedIndex >= 1 && selectedIndex <= orders.length) {
          return orders[selectedIndex - 1]!.order_handle;
        }
      }

      spinner.fail("No rides available");
      return null;
    } catch (error) {
      spinner.fail(`Failed to get rides: ${error}`);
      return null;
    }
  }

  /**
   * Display ride details with navigation info
   */
  private async displayRideDetails(gpsInfo: GpsInfo, orderHandle: OrderHandle): Promise<void> {
    const spinner = ora("Fetching ride details...").start();

    try {
      const rideDetails = await this.api.getRideDetails(gpsInfo, orderHandle);
      spinner.succeed("Ride details loaded");

      console.log(chalk.cyan("\n📍 Ride Information:"));
      console.log(chalk.gray("─".repeat(50)));

      // Basic ride info
      console.log(chalk.white(`Order ID: ${orderHandle.orderId}`));
      console.log(chalk.white(`Status: ${rideDetails.state || "Unknown"}`));
      
      if (rideDetails.pickup_address) {
        console.log(chalk.green(`\n🚦 Pickup: ${rideDetails.pickup_address}`));
        if (rideDetails.pickup_location) {
          console.log(chalk.gray(`   Coordinates: ${rideDetails.pickup_location.lat}, ${rideDetails.pickup_location.lng}`));
        }
      }

      if (rideDetails.destination_address) {
        console.log(chalk.blue(`\n🏁 Destination: ${rideDetails.destination_address}`));
        if (rideDetails.destination_location) {
          console.log(chalk.gray(`   Coordinates: ${rideDetails.destination_location.lat}, ${rideDetails.destination_location.lng}`));
        }
      }

      // Route information
      if (rideDetails.route_info) {
        console.log(chalk.yellow("\n🗺️  Route Information:"));
        console.log(chalk.gray(`   Distance: ${rideDetails.route_info.distance_km} km`));
        console.log(chalk.gray(`   Duration: ${rideDetails.route_info.duration_min} minutes`));
        console.log(chalk.gray(`   ETA: ${rideDetails.route_info.eta}`));
      }

      // Passenger info
      if (rideDetails.passenger_info) {
        console.log(chalk.magenta("\n👤 Passenger:"));
        console.log(chalk.gray(`   Name: ${rideDetails.passenger_info.name}`));
        console.log(chalk.gray(`   Rating: ${rideDetails.passenger_info.rating} ⭐`));
        console.log(chalk.gray(`   Phone: ${rideDetails.passenger_info.phone || "Hidden"}`));
      }

      // Payment info
      if (rideDetails.payment_info) {
        console.log(chalk.green("\n💳 Payment:"));
        console.log(chalk.gray(`   Method: ${rideDetails.payment_info.type}`));
        console.log(chalk.gray(`   Amount: ${rideDetails.payment_info.amount} ${rideDetails.payment_info.currency}`));
      }

      console.log(chalk.gray("\n─".repeat(50)));
    } catch (error) {
      spinner.fail(`Failed to get ride details: ${error}`);
    }
  }

  /**
   * Simulate navigation updates
   */
  private async simulateNavigation(gpsInfo: GpsInfo, orderHandle: OrderHandle): Promise<void> {
    console.log(chalk.cyan("\n🚗 Starting Navigation Simulation..."));
    
    const navigationOptions = [
      { title: "Update current location", value: "update_location" },
      { title: "Report arrival at pickup", value: "arrive_pickup" },
      { title: "Start ride", value: "start_ride" },
      { title: "Update ride progress", value: "update_progress" },
      { title: "Complete ride", value: "complete_ride" },
      { title: "Report issue", value: "report_issue" },
      { title: "Exit navigation", value: "exit" }
    ];

    let navigating = true;
    while (navigating) {
      const { action } = await prompts({
        type: "select",
        name: "action",
        message: "Select navigation action:",
        choices: navigationOptions
      });

      switch (action) {
        case "update_location":
          await this.updateDriverLocation(gpsInfo);
          break;
        
        case "arrive_pickup":
          await this.arriveAtPickup(gpsInfo, orderHandle);
          break;
        
        case "start_ride":
          await this.startRide(gpsInfo, orderHandle);
          break;
        
        case "update_progress":
          await this.updateRideProgress(gpsInfo, orderHandle);
          break;
        
        case "complete_ride":
          await this.completeRide(gpsInfo, orderHandle);
          navigating = false;
          break;
        
        case "report_issue":
          await this.reportNavigationIssue(gpsInfo, orderHandle);
          break;
        
        case "exit":
          navigating = false;
          break;
      }
    }
  }

  /**
   * Update driver location during navigation
   */
  private async updateDriverLocation(currentGps: GpsInfo): Promise<void> {
    const spinner = ora("Updating location...").start();
    
    try {
      // In a real app, this would update continuously
      const newGps = { ...currentGps, timestamp: Date.now() };
      
      // Update driver state with new location
      const state = await this.api.getDriverState(newGps, "foreground");
      
      spinner.succeed("Location updated");
      console.log(chalk.gray(`New coordinates: ${newGps.latitude}, ${newGps.longitude}`));
      
      if (state.next_polling_in_sec) {
        console.log(chalk.gray(`Next update in: ${state.next_polling_in_sec}s`));
      }
    } catch (error) {
      spinner.fail(`Failed to update location: ${error}`);
    }
  }

  /**
   * Report arrival at pickup location
   */
  private async arriveAtPickup(_gpsInfo: GpsInfo, _orderHandle: OrderHandle): Promise<void> {
    const spinner = ora("Reporting arrival at pickup...").start();
    
    try {
      // This would trigger the actual arrival API call
      console.log(chalk.green("\n📍 Arrived at pickup location"));
      console.log(chalk.yellow("Waiting for passenger..."));
      
      // In real implementation, this would update order status
      spinner.succeed("Arrival reported");
    } catch (error) {
      spinner.fail(`Failed to report arrival: ${error}`);
    }
  }

  /**
   * Start the ride
   */
  private async startRide(gpsInfo: GpsInfo, orderHandle: OrderHandle): Promise<void> {
    const spinner = ora("Starting ride...").start();
    
    try {
      console.log(chalk.green("\n🚗 Ride started!"));
      console.log(chalk.gray("Navigation active..."));
      
      // Show initial route info
      const rideDetails = await this.api.getRideDetails(gpsInfo, orderHandle);
      if (rideDetails.route_info) {
        console.log(chalk.blue(`\nRoute: ${rideDetails.route_info.distance_km} km, ~${rideDetails.route_info.duration_min} min`));
      }
      
      spinner.succeed("Ride in progress");
    } catch (error) {
      spinner.fail(`Failed to start ride: ${error}`);
    }
  }

  /**
   * Update ride progress
   */
  private async updateRideProgress(_gpsInfo: GpsInfo, _orderHandle: OrderHandle): Promise<void> {
    const { progress } = await prompts({
      type: "number",
      name: "progress",
      message: "Enter ride completion percentage (0-100):",
      initial: 50,
      validate: (value: number) => value >= 0 && value <= 100
    });

    console.log(chalk.blue(`\n📊 Ride Progress: ${progress}%`));
    console.log(chalk.gray("═".repeat(50)));
    console.log(chalk.green("█".repeat(Math.floor(progress / 2))) + chalk.gray("░".repeat(50 - Math.floor(progress / 2))));
    console.log(chalk.gray("═".repeat(50)));
  }

  /**
   * Complete the ride
   */
  private async completeRide(gpsInfo: GpsInfo, orderHandle: OrderHandle): Promise<void> {
    const spinner = ora("Completing ride...").start();
    
    try {
      console.log(chalk.green("\n✅ Ride completed successfully!"));
      
      // Get final ride details
      const rideDetails = await this.api.getRideDetails(gpsInfo, orderHandle);
      
      if (rideDetails.payment_info) {
        console.log(chalk.green(`\n💰 Fare: ${rideDetails.payment_info.amount} ${rideDetails.payment_info.currency}`));
        console.log(chalk.gray(`Payment method: ${rideDetails.payment_info.type}`));
      }
      
      spinner.succeed("Ride completed");
      
      // Rate passenger prompt
      const { rating } = await prompts({
        type: "number",
        name: "rating",
        message: "Rate the passenger (1-5):",
        initial: 5,
        validate: (value: number) => value >= 1 && value <= 5
      });
      
      console.log(chalk.yellow(`\n⭐ Passenger rated: ${rating}/5`));
    } catch (error) {
      spinner.fail(`Failed to complete ride: ${error}`);
    }
  }

  /**
   * Report navigation issue
   */
  private async reportNavigationIssue(_gpsInfo: GpsInfo, _orderHandle: OrderHandle): Promise<void> {
    const issueTypes = [
      { title: "Wrong pickup location", value: "wrong_pickup" },
      { title: "Wrong destination", value: "wrong_destination" },
      { title: "Road closed", value: "road_closed" },
      { title: "Heavy traffic", value: "traffic" },
      { title: "Passenger not found", value: "no_passenger" },
      { title: "Other", value: "other" }
    ];

    const { issueType } = await prompts({
      type: "select",
      name: "issueType",
      message: "Select issue type:",
      choices: issueTypes
    });

    console.log(chalk.red(`\n⚠️ Issue reported: ${issueType}`));
    console.log(chalk.gray("Support team will be notified"));
  }

  /**
   * Run the navigation example
   */
  async run(): Promise<void> {
    this.displayHeader();

    // Check authentication
    if (!(await this.api.validateExistingToken())) {
      console.log(chalk.red("\n❌ Not authenticated. Please run the authentication example first."));
      return;
    }

    try {
      // Get current location
      const gpsInfo = await this.getCurrentLocation();
      console.log(chalk.green("\n✓ GPS location acquired"));

      // Get active or recent ride
      const orderHandle = await this.getActiveRide(gpsInfo);
      
      if (!orderHandle) {
        console.log(chalk.yellow("\n⚠ No rides available for navigation demo"));
        return;
      }

      // Display ride details
      await this.displayRideDetails(gpsInfo, orderHandle);

      // Start navigation simulation
      const { startNav } = await prompts({
        type: "confirm",
        name: "startNav",
        message: "Start navigation simulation?",
        initial: true
      });

      if (startNav) {
        await this.simulateNavigation(gpsInfo, orderHandle);
      }

      console.log(chalk.cyan("\n🏁 Navigation example completed!"));
    } catch (error) {
      console.error(chalk.red("\n❌ Navigation error:"), error);
    }
  }
}

// Run the example
(async () => {
  // Initialize API from saved credentials
  const api = new BoltDriverAPI(
    {
      deviceId: "navigation-example-device",
      deviceType: "iphone",
      deviceName: "iPhone17,3",
      deviceOsVersion: "iOS18.6",
      appVersion: "DI.116.0"
    },
    {
      country: "pl",
      language: "en-GB",
      brand: "bolt",
      authMethod: "phone", // Added missing property
      theme: "dark" // Added missing property
    }
  );

  const example = new RideNavigationExample(api);
  await example.run();
})();
