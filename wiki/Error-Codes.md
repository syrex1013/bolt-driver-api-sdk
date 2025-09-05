# Error Codes Reference

This document provides a comprehensive list of all error codes returned by the Bolt Driver API.

## Authentication Errors

### 299 - SMS_LIMIT_REACHED

**Description:** Maximum number of SMS authentication attempts reached in 24 hours.

**Common Causes:**

- Too many login attempts in a short period
- Multiple failed authentication attempts

**Resolution:**

- Wait 24 hours before trying SMS authentication again
- Use magic link authentication as an alternative

**Example:**

```typescript
try {
  await api.startAuthentication(...);
} catch (error) {
  if (error.code === 299) {
    // Switch to magic link
    await api.sendMagicLink(email);
  }
}
```

### 300 - INVALID_PHONE

**Description:** The provided phone number format is invalid.

**Common Causes:**

- Missing country code
- Invalid number format
- Non-existent country code

**Resolution:**

- Include full international format (e.g., +48123456789)
- Verify country code is correct
- Remove spaces and special characters

### 301 - DATABASE_ERROR

**Description:** Server-side database error occurred.

**Common Causes:**

- Temporary server issues
- Database maintenance

**Resolution:**

- Retry the request after a few seconds
- Contact support if issue persists

### 302 - INVALID_SMS_CODE

**Description:** The SMS verification code is incorrect or expired.

**Common Causes:**

- Typed wrong code
- Code expired (usually after 5 minutes)
- Using code from previous attempt

**Resolution:**

- Double-check the code
- Request a new code if expired
- Ensure using the latest SMS received

### 503 - NOT_AUTHORIZED

**Description:** Authentication failed or access denied.

**Common Causes:**

- Invalid credentials
- Account suspended
- Token expired

**Resolution:**

- Verify credentials are correct
- Re-authenticate if token expired
- Contact support for account issues

## API Response Errors

### 401 - UNAUTHORIZED

**Description:** Request requires authentication or token is invalid.

**Common Causes:**

- Missing authentication token
- Expired access token
- Invalid token format

**Resolution:**

```typescript
// Handle globally
if (error.response?.status === 401) {
  // Refresh token or re-authenticate
  await api.getAccessToken();
  // Retry request
}
```

### 400 - BAD_REQUEST

**Description:** Request parameters are invalid.

**Common Causes:**

- Missing required parameters
- Invalid parameter values
- Wrong data types

**Resolution:**

- Check API documentation for required parameters
- Validate input data before sending
- Review parameter types and formats

### 404 - NOT_FOUND

**Description:** Requested resource not found.

**Common Causes:**

- Invalid order ID
- Ride doesn't exist
- Wrong endpoint URL

**Resolution:**

- Verify resource ID is correct
- Check if resource still exists
- Ensure using correct API endpoint

### 429 - RATE_LIMITED

**Description:** Too many requests sent in a given time period.

**Common Causes:**

- Polling too frequently
- Batch operations too fast
- Not respecting polling intervals

**Resolution:**

```typescript
// Respect polling intervals
const state = await api.getDriverState(gps);
setTimeout(() => {
  // Next request
}, state.next_polling_in_sec * 1000);
```

### 500 - INTERNAL_SERVER_ERROR

**Description:** Server encountered an unexpected error.

**Common Causes:**

- Server malfunction
- Temporary service disruption

**Resolution:**

- Retry with exponential backoff
- Report persistent issues

## Business Logic Errors

### 1001 - DRIVER_OFFLINE

**Description:** Operation requires driver to be online.

**Common Causes:**

- Trying to accept rides while offline
- Accessing features requiring online status

**Resolution:**

- Set driver status to online first
- Check driver state before operations

### 1002 - RIDE_ALREADY_ACCEPTED

**Description:** Ride has already been accepted by another driver.

**Common Causes:**

- Slow response to ride request
- High demand area

**Resolution:**

- React faster to ride requests
- Move to less competitive areas

### 1003 - INVALID_LOCATION

**Description:** GPS location is invalid or outside service area.

**Common Causes:**

- GPS accuracy too low
- Outside Bolt service area
- Invalid coordinates

**Resolution:**

```typescript
// Ensure valid GPS data
const gpsInfo = {
  latitude: 52.237049,
  longitude: 21.017532,
  accuracy: 10, // Must be reasonable
  timestamp: Date.now()
};
```

### 1004 - PAYMENT_REQUIRED

**Description:** Driver has outstanding payments or fees.

**Common Causes:**

- Unpaid commission
- Outstanding fines
- Negative balance

**Resolution:**

- Check balance in earnings section
- Make required payments
- Contact support for payment plans

## Network Errors

### 0 - NETWORK_ERROR

**Description:** Network connection failed.

**Common Causes:**

- No internet connection
- Request timeout
- DNS resolution failure

**Resolution:**

```typescript
// Implement retry logic
async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 0 && i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}
```

## Error Handling Best Practices

### 1. Global Error Handler

```typescript
class ErrorHandler {
  static handle(error: BoltApiError): void {
    switch (error.code) {
      case 299:
        this.handleSmsLimit();
        break;
      case 401:
        this.handleUnauthorized();
        break;
      case 429:
        this.handleRateLimit();
        break;
      default:
        this.handleGeneric(error);
    }
  }
  
  static handleSmsLimit(): void {
    // Show magic link option
    console.log('SMS limit reached. Please use email authentication.');
  }
  
  static handleUnauthorized(): void {
    // Trigger re-authentication
    console.log('Session expired. Please login again.');
  }
  
  static handleRateLimit(): void {
    // Implement backoff
    console.log('Too many requests. Please wait.');
  }
}
```

### 2. Retry Strategy

```typescript
class RetryStrategy {
  static shouldRetry(error: BoltApiError): boolean {
    const retryableCodes = [0, 301, 429, 500];
    return retryableCodes.includes(error.code);
  }
  
  static getDelay(attempt: number, error: BoltApiError): number {
    if (error.code === 429) {
      // Rate limit - wait longer
      return 60000; // 1 minute
    }
    // Exponential backoff
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }
}
```

### 3. User-Friendly Messages

```typescript
class ErrorMessages {
  static getUserMessage(error: BoltApiError): string {
    const messages: Record<number, string> = {
      299: 'Too many login attempts. Please try email authentication.',
      300: 'Please enter a valid phone number with country code.',
      301: 'Server is temporarily unavailable. Please try again.',
      302: 'Invalid verification code. Please check and try again.',
      401: 'Your session has expired. Please login again.',
      429: 'Too many requests. Please wait a moment.',
      503: 'Access denied. Please check your credentials.',
    };
    
    return messages[error.code] || 'An unexpected error occurred.';
  }
}
```

## Logging Errors

```typescript
// Configure logging for better error tracking
const api = new BoltDriverAPI(
  deviceInfo,
  authConfig,
  {},
  null,
  {
    level: 'error',
    logRequests: true,
    logResponses: true
  }
);

// Custom error logging
api.getLogger().error('Custom error', {
  code: error.code,
  message: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

## Troubleshooting Common Issues

### Authentication Loop

**Problem:** Keep getting 401 errors even after authentication.

**Solution:**

```typescript
// Clear old tokens
api.clearAuthentication();

// Fresh authentication
await api.startAuthentication(...);
```

### Intermittent Network Errors

**Problem:** Random network errors in good connection.

**Solution:**

```typescript
// Increase timeout
const api = new BoltDriverAPI(
  deviceInfo,
  authConfig,
  {
    timeout: 60000, // 60 seconds
    retries: 5
  }
);
```

### Rate Limiting Issues

**Problem:** Frequently hitting rate limits.

**Solution:**

```typescript
// Implement request queue
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private minDelay = 1000; // 1 second between requests
  
  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }
  
  private async process(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
        await new Promise(r => setTimeout(r, this.minDelay));
      }
    }
    
    this.processing = false;
  }
}
```

## Getting Help

If you encounter errors not listed here:

1. Check the [FAQ](FAQ.md)
2. Search [GitHub Issues](https://github.com/bolt-driver-api/bolt-driver-api-sdk/issues)
3. Enable debug logging for more details
4. Contact support with error details and logs
