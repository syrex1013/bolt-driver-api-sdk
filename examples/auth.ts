#!/usr/bin/env ts-node

import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";
import * as fs from "fs";
import * as path from "path";
import {
  BoltDriverAPI,
  DeviceInfo,
  AuthConfig,
  SmsLimitError,
  InvalidPhoneError,
  DatabaseError,
  Credentials,
  GpsInfo,
} from "../src";

interface UserInput {
  phoneNumber: string;
  country: string;
  language: string;
  deviceType: string;
  useRealCredentials: boolean;
  smsCode?: string;
  deviceId?: string;
  deviceName?: string;
  deviceOsVersion?: string;
}

/**
 * Interactive Authentication Flow Example
 * This example provides an interactive CLI for testing authentication
 */

function printHeader() {
  console.clear();
  console.log(
    boxen(chalk.blue.bold("🔐 Bolt Driver Authentication Example"), {
    padding: 1,
    margin: 1,
      borderStyle: "round",
      borderColor: "blue",
    })
  );
}

export async function authExample() {
  printHeader();

  const tokenPath = path.join(__dirname, "..", ".magic-link-token.json");
  let userInput = await getUserInput(tokenPath);

  // Device information
  const deviceInfo: DeviceInfo = {
    deviceId: userInput.deviceId || generateDeviceId(),
    deviceType: userInput.deviceType as "iphone" | "android",
    deviceName:
      userInput.deviceName ||
      (userInput.deviceType === "iphone"
        ? "iPhone17,3"
        : "Samsung Galaxy S24"),
    deviceOsVersion:
      userInput.deviceOsVersion ||
      (userInput.deviceType === "iphone" ? "iOS18.6" : "Android 14"),
    appVersion: "DI.116.0",
  };

  // Authentication configuration
  const authConfig: AuthConfig = {
    authMethod: "phone",
    brand: "bolt",
    country: userInput.country,
    language: userInput.language,
    theme: "dark",
  };

  console.log(chalk.cyan("\n📱 Device Information:"));
  console.log(`   ${chalk.gray("Device ID:")} ${deviceInfo.deviceId}`);
  console.log(`   ${chalk.gray("Device Type:")} ${deviceInfo.deviceType}`);
  console.log(`   ${chalk.gray("Device Name:")} ${deviceInfo.deviceName}`);
  console.log(`   ${chalk.gray("OS Version:")} ${deviceInfo.deviceOsVersion}`);

  try {
    // Initialize API
    const spinner = ora("Initializing Bolt Driver API...").start();
    const boltAPI = new BoltDriverAPI(deviceInfo, authConfig);
    boltAPI.updateLoggingConfig({
      logRequests: false,
      logResponses: false,
      logErrors: true,
    });
    spinner.succeed(chalk.green("API initialized successfully"));

    // Check if we have saved tokens that are still valid
    spinner.start("Checking for valid saved authentication...");
      const isValidToken = await boltAPI.validateToken();

      if (isValidToken && boltAPI.isAuthenticated()) {
      spinner.succeed(chalk.green("✅ Valid saved authentication found!"));
      await showAuthSuccess(boltAPI, true); // Don't re-run endpoints
        return;
      } else {
      spinner.fail(chalk.yellow("❌ No valid saved authentication found"));
      console.log(chalk.gray("   Proceeding with fresh authentication..."));
    }

    // Test network connectivity
    if (userInput.useRealCredentials) {
      await testNetworkConnectivity(spinner);
    }

    await performAuthentication(boltAPI, userInput);
  } catch (error) {
    await handleAuthError(error);
  }
}

async function getUserInput(tokenPath: string): Promise<UserInput> {
  try {
    if (fs.existsSync(tokenPath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
      if (tokenData && tokenData.phoneNumber) {
        const { useSaved } = await inquirer.prompt([
          {
            type: "confirm",
            name: "useSaved",
            message: `Found saved credentials for ${tokenData.phoneNumber}. Use them?`,
            default: true,
          },
        ]);

        if (useSaved) {
          return {
            phoneNumber: tokenData.phoneNumber,
            country: tokenData.country || "pl",
            language: tokenData.language || "en-GB",
            deviceType: tokenData.deviceType || "iphone",
            useRealCredentials: true,
            deviceId: tokenData.deviceId,
            deviceName: tokenData.deviceName,
            deviceOsVersion: tokenData.deviceOsVersion,
          };
        }
      }
    }
  } catch (error) {
    console.log(chalk.yellow("Could not read or use saved token file."));
  }

  return inquirer.prompt([
    {
      type: "input",
      name: "phoneNumber",
      message:
        "Enter your phone number in international format (e.g., +48123456789):",
      validate: (value) => {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return (
          phoneRegex.test(value) ||
          "Invalid phone number format. Must be in international format (e.g., +48123456789)."
        );
      },
    },
    {
      type: "list",
      name: "country",
      message: "Select your country:",
      choices: ["pl", "de", "uk"],
      default: "pl",
    },
    {
      type: "list",
      name: "language",
      message: "Select your language:",
      choices: ["en-GB", "de", "pl"],
      default: "en-GB",
    },
    {
      type: "list",
      name: "deviceType",
      message: "Select your device type:",
      choices: ["iphone", "android"],
      default: "iphone",
    },
    {
      type: "confirm",
      name: "useRealCredentials",
      message: "Use real credentials (requires a valid phone number)?",
      default: false,
    },
  ]);
}

async function testNetworkConnectivity(spinner: import("ora").Ora) {
  spinner.start("Testing network connectivity to Bolt servers...");
  try {
    const testUrl = "https://partnerdriver.live.boltsvc.net/partnerDriver";
    const response = await fetch(testUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    if (response.ok || response.status === 404) {
      spinner.succeed(chalk.green("Network accessible"));
    } else {
      spinner.warn(chalk.yellow("Network connectivity issue detected"));
    }
  } catch (networkError) {
    spinner.fail(chalk.red("Network connectivity issue detected"));
    console.log(
      chalk.yellow("\n⚠️  Unable to reach Bolt servers. Check your connection.\n")
    );
  }
}

async function performAuthentication(
  boltAPI: BoltDriverAPI,
  userInput: UserInput
) {
  const spinner = ora();
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      spinner.start(`Sending SMS to ${userInput.phoneNumber}...`);

      const credentials: Credentials = {
        driver_id: "test_driver_id",
        session_id: "test_session_id",
        phone: userInput.phoneNumber,
      };

      const authConfig: AuthConfig = {
        authMethod: "phone",
        brand: "bolt",
        country: userInput.country,
        language: userInput.language,
        theme: "dark",
      };

      const deviceInfo: DeviceInfo = {
        deviceId: userInput.deviceId || generateDeviceId(),
        deviceType: userInput.deviceType as "iphone" | "android",
        deviceName:
          userInput.deviceName ||
          (userInput.deviceType === "iphone"
            ? "iPhone17,3"
            : "Samsung Galaxy S24"),
        deviceOsVersion:
          userInput.deviceOsVersion ||
          (userInput.deviceType === "iphone" ? "iOS18.6" : "Android 14"),
        appVersion: "DI.116.0",
      };

      const authResponse = await boltAPI.startAuthentication(
        authConfig,
        deviceInfo,
        credentials
      );

      if (
        authResponse.code === 299 &&
        authResponse.message === "SMS_LIMIT_REACHED"
      ) {
        spinner.warn(
          chalk.yellow("SMS limit reached, switching to magic link authentication...")
        );
          await performMagicLinkAuthentication(boltAPI, deviceInfo);
          return;
        }
        
      spinner.succeed(chalk.green("SMS sent successfully"));

      const smsCode = await getSmsCode(userInput);
        credentials.verification_token = authResponse.data?.verification_token;
        credentials.verification_code = smsCode;

      spinner.start("Verifying SMS code...");
      const confirmResponse = await boltAPI.confirmAuthentication(
        authConfig,
        deviceInfo,
        credentials,
        smsCode
      );

        if (confirmResponse.code !== 0) {
        spinner.fail(
          chalk.red(`SMS verification failed: ${confirmResponse.message}`)
        );
        throw new Error(
          `Authentication confirmation failed: ${confirmResponse.message}`
        );
      }

      spinner.succeed(chalk.green("SMS code verified successfully"));
        await showAuthSuccess(boltAPI);
        return;
    } catch (authError) {
      spinner.fail(chalk.red("Authentication failed"));

      if (authError instanceof SmsLimitError) {
        if (await confirmRetry("SMS limit reached. Wait 30s and retry?")) {
          await new Promise((resolve) => setTimeout(resolve, 30000));
          retryCount++;
          continue;
        } else {
          return;
        }
      } else if (authError instanceof InvalidPhoneError) {
        console.log(chalk.red("Invalid phone number. Please check the format."));
        return;
      } else if (authError instanceof DatabaseError) {
        if (
          retryCount < maxRetries - 1 &&
          (await confirmRetry("Server database error. Retry?"))
        ) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
            retryCount++;
            continue;
        }
        return;
      } else {
        console.log(
          chalk.red(`\nAn unexpected error occurred: ${
            (authError as Error).message
          }`)
        );
        return;
      }
    }
  }
}

async function getSmsCode(userInput: UserInput): Promise<string> {
  if (userInput.useRealCredentials) {
    const { code } = await inquirer.prompt([
      {
        type: "input",
        name: "code",
        message: chalk.cyan("Enter the SMS code you received:"),
        validate: (input: string) =>
          (input.length === 6 && /^\d+$/.test(input)) ||
          chalk.red("Please enter a valid 6-digit SMS code"),
      },
    ]);
    return code;
  } else {
    console.log(chalk.yellow("\n💡 Using demo SMS code: 123456"));
    return "123456";
  }
}

async function confirmRetry(message: string): Promise<boolean> {
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message,
      default: true,
    },
  ]);
  return confirm;
}

async function showAuthSuccess(
  boltAPI: BoltDriverAPI,
  skipEndpointRun: boolean = false
) {
  try {
    console.log(
      boxen(chalk.green.bold("✅ Authentication Successful!"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
      })
    );

      const driverInfo = boltAPI.getDriverInfo();
      if (driverInfo) {
      console.log(chalk.cyan("👤 Driver Information:"));
      console.log(`   ${chalk.gray("Driver ID:")} ${driverInfo.driverId}`);
      console.log(`   ${chalk.gray("Partner ID:")} ${driverInfo.partnerId}`);
      console.log(
        `   ${chalk.gray("Company City ID:")} ${driverInfo.companyCityId}`
      );
    }

    if (!skipEndpointRun) {
      console.log(
        chalk.blue("\n🚀 Running Bolt Driver API Endpoints Example...")
      );
      try {
        const { runBoltDriverExample } = await import(
          "./bolt-driver-endpoints"
        );
        await runBoltDriverExample(boltAPI);
      } catch (error) {
        console.log(
          chalk.red("❌ Error running bolt-driver-endpoints example:"),
          error
        );
      }
    }

    console.log(
      chalk.green(
        "\n🎉 Authentication and API Examples Completed Successfully!"
      )
    );
  } catch (error) {
    console.error(chalk.red("❌ Error in showAuthSuccess:"), error);
  }
}

async function handleAuthError(error: any) {
  ora().fail(chalk.red("Authentication failed"));
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  console.log(
    boxen(`${chalk.red("❌ Authentication Failed")}\n\n${chalk.yellow("Error:")} ${errorMessage}`, {
      padding: 1,
      borderColor: "red",
      borderStyle: "round",
      margin: 1,
    })
  );
}

async function performMagicLinkAuthentication(
  boltAPI: BoltDriverAPI,
  deviceInfo: DeviceInfo
) {
  try {
    const { email } = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: chalk.cyan("Enter your email for magic link authentication:"),
        validate: (value) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
          chalk.red("Please enter a valid email address"),
      },
    ]);

    await boltAPI.sendMagicLink(email);
    console.log(chalk.green("✅ Magic link sent successfully to", email));
    
    const { magicLinkUrl } = await inquirer.prompt([
      {
        type: "input",
        name: "magicLinkUrl",
        message: chalk.cyan("Paste the magic link URL from your email:"),
      },
    ]);

    const token = BoltDriverAPI.extractTokenFromMagicLink(magicLinkUrl);
    console.log(chalk.green(`✓ Token extracted: ${token.substring(0, 20)}...`));

    const gpsInfo: GpsInfo = {
      latitude: 51.233186,
      longitude: 22.518373,
      accuracy: 19.791364,
      bearing: 0,
      speed: -1.000007,
      timestamp: Math.floor(Date.now() / 1000),
      age: 30.01,
      accuracyMeters: 19.791364,
      adjustedBearing: 0,
      bearingAccuracyDeg: 0,
      speedAccuracyMps: 1.179999947547913,
    };

    const authResponse = await boltAPI.authenticateWithMagicLink(
      token,
      deviceInfo,
      gpsInfo
    );
    
    if (authResponse.code === 0 && authResponse.data?.refresh_token) {
      await showAuthSuccess(boltAPI);
    } else {
      throw new Error(`Authentication failed: ${authResponse.message}`);
    }
  } catch (error) {
    console.log(
      chalk.red("\n❌ Magic Link Authentication Error:"),
      (error as Error).message
    );
  }
}

function generateDeviceId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
    })
    .toUpperCase();
}

if (require.main === module) {
    authExample().catch((error) => {
    console.error("❌ Application Error:", error);
      process.exit(1);
    });
}