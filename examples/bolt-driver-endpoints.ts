#!/usr/bin/env ts-node

import { BoltDriverAPI, FileTokenStorage } from "../src";
import {
  DeviceInfo,
  AuthConfig,
  GpsInfo,
} from "../src/types";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import boxen from "boxen";
import inquirer from "inquirer";

// Load environment variables
dotenv.config();

// Utility function for logging
function logSection(title: string, content?: any) {
  console.log(
    boxen(
      chalk.bold.blue(title) +
        (content ? `\n\n${JSON.stringify(content, null, 2)}` : ""),
      {
        padding: 1,
        margin: 1,
        borderColor: "blue",
        borderStyle: "round",
      }
    )
  );
}

// Utility function for error logging
function logError(message: string, error?: any) {
  console.error(
    boxen(chalk.bold.red(message) + (error ? `\n\n${error.toString()}` : ""), {
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

async function runBoltDriverExample() {
  // Banner
  console.log(
    chalk.bold.green(
      boxen("🚗 Bolt Driver API Example", {
        padding: 1,
        margin: 1,
        borderColor: "green",
        borderStyle: "double",
      })
    )
  );

  // Check for saved token first
  const credentialsPath = path.join(__dirname, "..", ".magic-link-token.json");
  let savedToken: any = null;
  let credentials: any = null;

  try {
    if (fs.existsSync(credentialsPath)) {
      const tokenData = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
      if (tokenData && tokenData.phoneNumber) {
        const { useSaved } = await inquirer.prompt([
          {
            type: "confirm",
            name: "useSaved",
            message: `Found saved credentials for ${tokenData.phoneNumber}. Use saved token?`,
            default: true,
          },
        ]);

        if (useSaved) {
          savedToken = tokenData;
          credentials = tokenData;
        }
      }
    }
  } catch (error) {
    console.log(chalk.yellow("Could not read saved token file"));
  }

  // If no saved credentials, get them interactively
  if (!credentials) {
    console.log(chalk.blue("\n🔑 No saved credentials found. Let's set up authentication..."));
    credentials = await getCredentialsInteractively();
    
    // Save the new credentials
    try {
      fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
      console.log(chalk.green("✅ Credentials saved for future use"));
    } catch (error) {
      console.log(chalk.yellow("⚠️ Could not save credentials, but continuing..."));
    }
  }

  // Prepare device and auth configuration
  const deviceParams: DeviceInfo = {
    deviceId:
      savedToken?.deviceId || credentials.deviceId || "example_device_id",
    deviceType: (savedToken?.deviceType ||
      credentials.deviceType ||
      "iphone") as "iphone" | "android",
    deviceName:
      savedToken?.deviceName || credentials.deviceName || "iPhone17,3",
    deviceOsVersion:
      savedToken?.deviceOsVersion || credentials.deviceOsVersion || "iOS18.6",
    appVersion: "DI.115.0",
  };

  const authConfig: AuthConfig = {
    authMethod: (credentials.authMethod || "phone") as "phone" | "email",
    brand: credentials.brand || "bolt",
    country: credentials.country || "pl",
    language: credentials.language || "en-GB",
    theme: (credentials.theme || "dark") as "light" | "dark",
  };

  // Create token storage and API instance
  const tokenStorage = new FileTokenStorage(credentialsPath);
  const api = new BoltDriverAPI(
    deviceParams,
    authConfig,
    undefined,
    tokenStorage
  );

  // Wait for token initialization to complete
  await new Promise((resolve) => setTimeout(resolve, 100));

  let isAuthenticated = false;

  // Debug: Check token storage and API state
  const hasStoredToken = await tokenStorage.hasValidToken();
  const apiAuthenticated = api.isAuthenticated();
  console.log(chalk.blue(`📊 Token Debug Info:`));
  console.log(
    chalk.gray(`   Token storage has valid token: ${hasStoredToken}`)
  );
  console.log(chalk.gray(`   API is authenticated: ${apiAuthenticated}`));
  console.log(
    chalk.gray(
      `   Current access token: ${
        api.getCurrentAccessToken() ? "Set" : "Not set"
      }`
    )
  );
  console.log(
    chalk.gray(
      `   Current refresh token: ${
        api.getCurrentRefreshToken() ? "Set" : "Not set"
      }`
    )
  );

  // Check if API is authenticated (either from stored token or fresh authentication)
  if (apiAuthenticated) {
    try {
      logSection(
        "Validating Token",
        "Checking if existing token is still valid..."
      );
      const isValid = await api.validateExistingToken();

      if (isValid) {
        logSection("Authentication", "Using existing valid token");
        isAuthenticated = true;
      } else {
        logSection(
          "Token Validation Failed",
          "Existing token is invalid or expired"
        );
        isAuthenticated = await handleTokenFailure(
          api,
          credentials,
          credentialsPath
        );
      }
    } catch (error) {
      logSection(
        "Token Validation Error",
        "Error occurred during token validation"
      );
      isAuthenticated = await handleTokenFailure(
        api,
        credentials,
        credentialsPath
      );
    }
  } else {
    // Perform authentication
    isAuthenticated = await performAuthentication(
      api,
      credentials,
      credentialsPath
    );
  }

  // Only demonstrate API methods if authentication was successful
  if (isAuthenticated) {
    await demonstrateApiMethods(api);
  } else {
    logError(
      "Authentication Failed",
      "Cannot demonstrate API methods without authentication"
    );
  }
}

async function getCredentialsInteractively(): Promise<any> {
  console.log(chalk.cyan("\n📱 Please provide your authentication details:\n"));
  
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "phoneNumber",
      message: "Enter your phone number (with country code):",
      default: "+48123456789",
      validate: (input: string) => {
        if (input.startsWith("+") && input.length >= 10) {
          return true;
        }
        return "Please enter a valid phone number with country code (e.g., +48123456789)";
      }
    },
    {
      type: "list",
      name: "country",
      message: "Select your country:",
      choices: [
        { name: "🇵🇱 Poland", value: "pl" },
        { name: "🇪🇪 Estonia", value: "ee" },
        { name: "🇱🇻 Latvia", value: "lv" },
        { name: "🇱🇹 Lithuania", value: "lt" },
        { name: "🇫🇮 Finland", value: "fi" },
        { name: "🇺🇦 Ukraine", value: "ua" },
        { name: "🇿🇦 South Africa", value: "za" },
        { name: "🇳🇬 Nigeria", value: "ng" },
        { name: "🇰🇪 Kenya", value: "ke" },
        { name: "🇬🇭 Ghana", value: "gh" }
      ],
      default: "pl"
    },
    {
      type: "list",
      name: "language",
      message: "Select your preferred language:",
      choices: [
        { name: "🇬🇧 English", value: "en-GB" },
        { name: "🇵🇱 Polish", value: "pl-PL" },
        { name: "🇪🇪 Estonian", value: "et-EE" },
        { name: "🇱🇻 Latvian", value: "lv-LV" },
        { name: "🇱🇹 Lithuanian", value: "lt-LT" },
        { name: "🇫🇮 Finnish", value: "fi-FI" },
        { name: "🇺🇦 Ukrainian", value: "uk-UA" }
      ],
      default: "en-GB"
    },
    {
      type: "list",
      name: "deviceType",
      message: "Select your device type:",
      choices: [
        { name: "📱 iPhone", value: "iphone" },
        { name: "🤖 Android", value: "android" }
      ],
      default: "iphone"
    },
    {
      type: "input",
      name: "driver_id",
      message: "Enter your driver ID (or press Enter for test_driver_id):",
      default: "test_driver_id"
    },
    {
      type: "input",
      name: "session_id",
      message: "Enter your session ID (or press Enter for test_session_id):",
      default: "test_session_id"
    }
  ]);

  return {
    ...answers,
    deviceId: generateDeviceId(),
    deviceName: answers.deviceType === "iphone" ? "iPhone17,3" : "Samsung Galaxy S24",
    deviceOsVersion: answers.deviceType === "iphone" ? "iOS18.6" : "Android 14",
    appVersion: "DI.115.0",
    authMethod: "phone",
    brand: "bolt",
    theme: "dark"
  };
}

function generateDeviceId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }).toUpperCase();
}

async function performAuthentication(
  api: BoltDriverAPI,
  credentials: any,
  credentialsPath: string
): Promise<boolean> {
  try {
    logSection(
      "Authentication Required",
      "Existing token is invalid or expired."
    );

    // Use magic link authentication instead of SMS
    logSection(
      "Magic Link Authentication",
      "Initiating Magic Link authentication..."
    );

    // Get email from user
    const { email } = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: "Enter your email for magic link authentication:",
        validate: (input: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(input)
            ? true
            : "Please enter a valid email address";
        },
      },
    ]);

    try {
      // Send magic link
      await api.sendMagicLink(email);
      logSection("Magic Link Sent", "Check your email for the magic link");

      // Get magic link URL from user
      const { magicLinkUrl } = await inquirer.prompt([
        {
          type: "input",
          name: "magicLinkUrl",
          message: "Paste the magic link URL from your email:",
          validate: (input: string) => {
            if (!input || input.trim().length === 0) {
              return "Please enter a valid magic link URL";
            }
            return true;
          },
        },
      ]);

      // Extract token and authenticate
      const token = BoltDriverAPI.extractTokenFromMagicLink(magicLinkUrl);
      const gpsInfo = createSampleGpsInfo();
      const authResponse = await api.authenticateWithMagicLink(
        token,
        {
          deviceId: credentials.deviceId || "example_device_id",
          deviceType: "iphone",
          deviceName: "iPhone17,3",
          deviceOsVersion: "iOS18.6",
          appVersion: "DI.115.0",
        },
        gpsInfo
      );

      if (authResponse.code === 0 && authResponse.data.refresh_token) {
        logSection(
          "Magic Link Authentication Successful",
          "Saved new credentials"
        );

        // Update credentials with new token
        credentials.refresh_token = authResponse.data.refresh_token;
        fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
        console.log(chalk.green("✅ Magic Link authentication successful!"));
        return true;
      } else {
        logError("Magic Link Authentication Failed", authResponse);
        console.log(chalk.red("❌ Magic Link authentication failed."));
        return false;
      }
    } catch (error) {
      logError("Magic Link Authentication Error", error);
      console.log(chalk.red("❌ Magic Link authentication failed."));
      return false;
    }
  } catch (error) {
    logError("Authentication Error", error);
    return false;
  }
}

async function handleTokenFailure(
  api: BoltDriverAPI,
  credentials: any,
  credentialsPath: string
): Promise<boolean> {
  console.log(
    chalk.red("⚠ Token validation failed. Attempting to re-authenticate...")
  );

  const { reauthMethod } = await inquirer.prompt([
    {
      type: "list",
      name: "reauthMethod",
      message: "Choose re-authentication method:",
      choices: [
        { name: "Magic Link (requires email)", value: "magic_link" },
        { name: "Phone (requires phone number)", value: "phone" },
        { name: "Cancel", value: "cancel" },
      ],
      default: "magic_link",
    },
  ]);

  if (reauthMethod === "cancel") {
    console.log(chalk.yellow("Re-authentication cancelled."));
    return false;
  }

  if (reauthMethod === "magic_link") {
    logSection(
      "Magic Link Authentication",
      "Initiating Magic Link authentication..."
    );

    // Get email from user
    const { email } = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: "Enter your email for magic link authentication:",
        validate: (input: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(input)
            ? true
            : "Please enter a valid email address";
        },
      },
    ]);

    try {
      // Send magic link
      await api.sendMagicLink(email);
      logSection("Magic Link Sent", "Check your email for the magic link");

      // Get magic link URL from user
      const { magicLinkUrl } = await inquirer.prompt([
        {
          type: "input",
          name: "magicLinkUrl",
          message: "Paste the magic link URL from your email:",
          validate: (input: string) => {
            if (!input || input.trim().length === 0) {
              return "Please enter a valid magic link URL";
            }
            return true;
          },
        },
      ]);

      // Extract token and authenticate
      const token = BoltDriverAPI.extractTokenFromMagicLink(magicLinkUrl);
      const gpsInfo = createSampleGpsInfo();
      const authResponse = await api.authenticateWithMagicLink(
        token,
        {
          deviceId: credentials.deviceId || "example_device_id",
          deviceType: "iphone",
          deviceName: "iPhone17,3",
          deviceOsVersion: "iOS18.6",
          appVersion: "DI.115.0",
        },
        gpsInfo
      );

      if (authResponse.code === 0 && authResponse.data.refresh_token) {
        logSection(
          "Magic Link Authentication Successful",
          "Saved new credentials"
        );

        // Update credentials with new token
        credentials.refresh_token = authResponse.data.refresh_token;
        fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
        console.log(chalk.green("✅ Magic Link re-authentication successful!"));
        return true;
      } else {
        logError("Magic Link Authentication Failed", authResponse);
        console.log(chalk.red("❌ Magic Link re-authentication failed."));
        return false;
      }
    } catch (error) {
      logError("Magic Link Authentication Error", error);
      console.log(chalk.red("❌ Magic Link re-authentication failed."));
      return false;
    }
  } else if (reauthMethod === "phone") {
    logSection("Phone Authentication", "Initiating Phone authentication...");

    // Get phone number from user
    const { phoneNumber } = await inquirer.prompt([
      {
        type: "input",
        name: "phoneNumber",
        message: "Enter your phone number (with country code):",
        default: credentials.phoneNumber || "+48123456789",
        validate: (input: string) => {
          if (input.startsWith("+") && input.length >= 10) {
            return true;
          }
          return "Please enter a valid phone number with country code (e.g., +48123456789)";
        },
      },
    ]);

    try {
      // Start phone authentication
      await api.startAuthentication(
        {
          authMethod: "phone",
          brand: "bolt",
          country: "pl",
          language: "en-GB",
          theme: "dark",
        },
        {
          deviceId: credentials.deviceId || "example_device_id",
          deviceType: "iphone",
          deviceName: "iPhone17,3",
          deviceOsVersion: "iOS18.6",
          appVersion: "DI.115.0",
        },
        {
          driver_id: credentials.driver_id || "test_driver_id",
          session_id: credentials.session_id || "test_session_id",
        }
      );

      logSection("SMS Sent", `Verification code sent to ${phoneNumber}`);

      // Get SMS code from user
      const { smsCode } = await inquirer.prompt([
        {
          type: "input",
          name: "smsCode",
          message: "Enter the SMS verification code:",
          validate: (input: string) => {
            if (input.length === 6 && /^\d+$/.test(input)) {
              return true;
            }
            return "Please enter a valid 6-digit SMS code";
          },
        },
      ]);

      // Confirm authentication
      const confirmAuthResponse = await api.confirmAuthentication(
        {
          authMethod: "phone",
          brand: "bolt",
          country: "pl",
          language: "en-GB",
          theme: "dark",
        },
        {
          deviceId: credentials.deviceId || "example_device_id",
          deviceType: "iphone",
          deviceName: "iPhone17,3",
          deviceOsVersion: "iOS18.6",
          appVersion: "DI.115.0",
        },
        {
          driver_id: credentials.driver_id || "test_driver_id",
          session_id: credentials.session_id || "test_session_id",
        },
        smsCode
      );

      if (
        confirmAuthResponse.token &&
        confirmAuthResponse.token.refresh_token
      ) {
        logSection("Phone Authentication Successful", "Saved new credentials");

        // Update credentials with new token
        credentials.refresh_token = confirmAuthResponse.token.refresh_token;
        fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
        console.log(chalk.green("✅ Phone re-authentication successful!"));
        return true;
      } else {
        logError("Phone Authentication Failed", confirmAuthResponse);
        console.log(chalk.red("❌ Phone re-authentication failed."));
        return false;
      }
    } catch (error) {
      logError("Phone Authentication Error", error);
      console.log(chalk.red("❌ Phone re-authentication failed."));
      return false;
    }
  }

  return false;
}

async function demonstrateApiMethods(api: BoltDriverAPI) {
  // Verify authentication before proceeding
  if (!api.isAuthenticated()) {
    logError(
      "Not Authenticated",
      "Cannot demonstrate API methods without authentication"
    );
    console.log(chalk.yellow("💡 Please complete authentication first"));
    return;
  }

  console.log("\n🚀 Demonstrating New API Endpoints...\n");

  // Create sample GPS info for all requests
  const gpsInfo = createSampleGpsInfo();

  // Endpoints to demonstrate with their new signatures
  const endpointDemos = [
    {
      name: "Scheduled Ride Requests",
      method: "getScheduledRideRequests",
      args: [gpsInfo, "upcoming"],
    },
    {
      name: "Earnings Landing Screen",
      method: "getEarningLandingScreen",
      args: [gpsInfo],
    },
    {
      name: "Activity Rides",
      method: "getActivityRides",
      args: [gpsInfo, "all"],
    },
    {
      name: "Order History",
      method: "getOrderHistoryPaginated",
      args: [gpsInfo, 10, 0],
    },
    {
      name: "Help Details",
      method: "getHelpDetails",
      args: [gpsInfo],
    },
    {
      name: "Earn More Details",
      method: "getEarnMoreDetails",
      args: [gpsInfo],
    },
    {
      name: "Score Overview",
      method: "getScoreOverview",
      args: [gpsInfo],
    },
    {
      name: "Driver Sidebar",
      method: "getDriverSidebar",
      args: [gpsInfo],
    },
  ];

  // Run endpoint demonstrations
  for (const endpoint of endpointDemos) {
    try {
      logSection(`Fetching: ${endpoint.name}`);

      const result = await (api as any)[endpoint.method](...endpoint.args);

      if (result && result.code === 0) {
        console.log(chalk.green("✓ Success"));
        console.log(JSON.stringify(result.data, null, 2));
      } else if (result) {
        console.log(chalk.yellow("⚠ Non-zero response code"));
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.green("✓ Success (no response data)"));
      }
    } catch (error) {
      logError(`Error in ${endpoint.name}`, error);
    }
  }

  // Final summary
  console.log(
    chalk.bold.green(
      boxen("🎉 Bolt Driver API Example Completed", {
        padding: 1,
        margin: 1,
        borderColor: "green",
        borderStyle: "double",
      })
    )
  );
}

// Run the example
if (require.main === module) {
  runBoltDriverExample().catch((error) => {
    logError("Unhandled Error in Bolt Driver Example", error);
    process.exit(1);
  });
}
