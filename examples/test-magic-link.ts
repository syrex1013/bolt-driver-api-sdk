#!/usr/bin/env ts-node

import { BoltDriverAPI } from '../src';
import chalk from 'chalk';

/**
 * Test Magic Link Token Extraction
 * 
 * This utility helps test the magic link token extraction functionality
 */

function testMagicLinkExtraction() {
  console.log(chalk.blue.bold('🔗 Magic Link Token Extraction Test\n'));

  // Test URLs based on the example provided
  const testUrls = [
    // AWS tracking redirect URL (example from user)
    'https://3zf1wp45.r.eu-central-1.awstrack.me/L0/https:%2F%2Fpartners.bolt.eu%2Fdriverapp%2Fmagic-login.html%3Fplatform=iOS%26token=26Lvk26X8xCXA7XadEfrJqOdVP8uZLan3zas6tETqxAneloJIczwIB8NiDlTzxCTPuuomUpiO04fHPNLxQzYy2lFmuQ4KNMdXmhV438Zb7mPpKLjFlz9sW8ojExKzR0PdkFL5tl9yjFVYwZOc0NAmwkjD5Hdh4N21lKun7h8I0BWFh3N8ZDGGwyJ5hjPuZUSqhbuALur3NexNhLp78djj46Ga5GVVvs30nwLLTBq03ppgqayHSnlLmpysTHXgxv/1/01070198d4240875-0fa43577-8a96-4536-8399-965c9eb17f74-000000/pibilGVmZsjPw9pEGx42cY8w0_o=221',
    
    // Direct Bolt URL (decoded)
    'https://partners.bolt.eu/driverapp/magic-login.html?platform=iOS&token=26Lvk26X8xCXA7XadEfrJqOdVP8uZLan3zas6tETqxAneloJIczwIB8NiDlTzxCTPuuomUpiO04fHPNLxQzYy2lFmuQ4KNMdXmhV438Zb7mPpKLjFlz9sW8ojExKzR0PdkFL5tl9yjFVYwZOc0NAmwkjD5Hdh4N21lKun7h8I0BWFh3N8ZDGGwyJ5hjPuZUSqhbuALur3NexNhLp78djj46Ga5GVVvs30nwLLTBq03ppgqayHSnlLmpysTHXgxv',
    
    // Simple test URL
    'https://partners.bolt.eu/driverapp/magic-login.html?token=testToken123&platform=iOS'
  ];

  testUrls.forEach((url, index) => {
    console.log(`${chalk.cyan('Test')} ${index + 1}:`);
    console.log(`URL: ${url.substring(0, 100)}...`);
    
    try {
      const token = BoltDriverAPI.extractTokenFromMagicLink(url);
      console.log(`${chalk.green('✅ Success:')} Extracted token: ${token.substring(0, 20)}...`);
    } catch (error) {
      console.log(`${chalk.red('❌ Failed:')} ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log('');
  });

  console.log(chalk.yellow.bold('💡 Usage Instructions:'));
  console.log('1. Copy the magic link URL from your email');
  console.log('2. Use the magic link example: npm run examples:magic-link');
  console.log('3. Paste the complete URL when prompted');
  console.log('4. The token will be automatically extracted and verified');
}

// Run the test
if (require.main === module) {
  testMagicLinkExtraction();
}
