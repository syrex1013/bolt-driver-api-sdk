# Authentication Guide

This guide covers all authentication methods supported by the Bolt Driver API SDK.

## Overview

The Bolt Driver API requires authentication before accessing any endpoints. The SDK supports two primary authentication methods:

1. **SMS Authentication** - Traditional phone number verification
2. **Magic Link Authentication** - Email-based authentication (useful when SMS limit is reached)

## SMS Authentication

### Step 1: Start Authentication

```typescript
import { BoltDriverAPI } from 'bolt-driver-api';

const api = new BoltDriverAPI(deviceInfo, authConfig);

const credentials = {
  phone: '+48123456789',
  driver_id: 'unique_driver_id',
  session_id: 'unique_session_id'
};

try {
  const response = await api.startAuthentication(
    deviceInfo,
    authConfig,
    credentials
  );
  
  console.log('SMS sent to:', credentials.phone);
  console.log('Session ID:', response.sessionId);
} catch (error) {
  if (error.code === 299) {
    console.log('SMS limit reached, use magic link instead');
  }
}
```

### Step 2: Confirm Authentication

```typescript
// After receiving SMS code
const smsCode = '1234'; // Get from user input

try {
  const confirmResponse = await api.confirmAuthentication(
    response.sessionId,
    smsCode
  );
  
  console.log('Authentication successful!');
  console.log('Access token received');
} catch (error) {
  if (error.code === 302) {
    console.log('Invalid SMS code');
  }
}
```

## Magic Link Authentication

### When to Use Magic Link

Magic link authentication is recommended when:

- SMS limit has been reached (error code 299)
- Phone number verification is unavailable
- User prefers email authentication

### Step 1: Send Magic Link

```typescript
try {
  const email = 'driver@example.com';
  const response = await api.sendMagicLink(email);
  
  console.log('Magic link sent to:', email);
} catch (error) {
  console.error('Failed to send magic link:', error);
}
```

### Step 2: Authenticate with Magic Link

```typescript
// After user clicks the magic link in their email
const magicLinkUrl = 'https://partners.bolt.eu/driverapp/magic-login.html?token=...';

try {
  const response = await api.authenticateWithMagicLink(magicLinkUrl);
  
  console.log('Authentication successful!');
  console.log('Driver ID:', response.driverId);
} catch (error) {
  console.error('Magic link authentication failed:', error);
}
```

## Token Management

### Automatic Token Storage

By default, the SDK automatically stores authentication tokens:

```typescript
// Tokens are automatically saved after successful authentication
// Default storage location: .bolt-auth.json

// Check if authenticated
if (api.isAuthenticated()) {
  console.log('Already authenticated');
}

// Get current tokens
const accessToken = api.getCurrentAccessToken();
const refreshToken = api.getCurrentRefreshToken();
```

### Custom Token Storage

```typescript
import { TokenStorage, SessionInfo } from 'bolt-driver-api';

class DatabaseTokenStorage implements TokenStorage {
  async saveToken(token: string, sessionInfo: SessionInfo): Promise<void> {
    // Save to database
    await db.tokens.create({
      token,
      driverId: sessionInfo.driverId,
      expiresAt: sessionInfo.expiresAt
    });
  }
  
  async loadToken(): Promise<{ token: string; sessionInfo: SessionInfo } | null> {
    // Load from database
    const stored = await db.tokens.findLatest();
    if (!stored) return null;
    
    return {
      token: stored.token,
      sessionInfo: {
        sessionId: stored.sessionId,
        driverId: stored.driverId,
        // ... other fields
      }
    };
  }
  
  async clearToken(): Promise<void> {
    // Clear from database
    await db.tokens.deleteAll();
  }
}

// Use custom storage
const api = new BoltDriverAPI(
  deviceInfo,
  authConfig,
  {},
  new DatabaseTokenStorage()
);
```

## Error Handling

### Common Authentication Errors

```typescript
try {
  await api.startAuthentication(...);
} catch (error) {
  switch (error.code) {
    case 299:
      // SMS_LIMIT_REACHED
      console.log('Too many SMS attempts, try magic link');
      break;
      
    case 300:
      // INVALID_PHONE
      console.log('Invalid phone number format');
      break;
      
    case 301:
      // DATABASE_ERROR
      console.log('Server error, try again later');
      break;
      
    case 302:
      // INVALID_SMS_CODE
      console.log('Wrong SMS code');
      break;
      
    case 503:
      // NOT_AUTHORIZED
      console.log('Authentication failed');
      break;
      
    default:
      console.error('Unknown error:', error);
  }
}
```

## Session Management

### Validate Token

```typescript
// Check if current token is valid
const isValid = await api.validateToken();

if (!isValid) {
  // Re-authenticate
  await api.startAuthentication(...);
}
```

### Clear Authentication

```typescript
// Logout
api.clearAuthentication();
console.log('Logged out successfully');
```

### Get Session Information

```typescript
const sessionInfo = api.getSessionInfo();

if (sessionInfo) {
  console.log('Driver ID:', sessionInfo.driverId);
  console.log('Partner ID:', sessionInfo.partnerId);
  console.log('Company ID:', sessionInfo.companyId);
  console.log('Token expires at:', new Date(sessionInfo.expiresAt));
}
```

## Best Practices

### 1. Handle SMS Limits

```typescript
async function authenticate(api, credentials) {
  try {
    // Try SMS first
    const response = await api.startAuthentication(
      deviceInfo,
      authConfig,
      credentials
    );
    
    // Get SMS code from user
    const smsCode = await promptForSmsCode();
    await api.confirmAuthentication(response.sessionId, smsCode);
    
  } catch (error) {
    if (error.code === 299) {
      // Fallback to magic link
      const email = await promptForEmail();
      await api.sendMagicLink(email);
      
      const magicLink = await promptForMagicLink();
      await api.authenticateWithMagicLink(magicLink);
    } else {
      throw error;
    }
  }
}
```

### 2. Implement Token Refresh

```typescript
// Set up automatic token refresh
setInterval(async () => {
  if (api.isAuthenticated()) {
    const isValid = await api.validateToken();
    if (!isValid) {
      // Token expired, get new one
      await api.getAccessToken();
    }
  }
}, 60 * 60 * 1000); // Check every hour
```

### 3. Secure Token Storage

```typescript
// For production, implement secure storage
class SecureTokenStorage implements TokenStorage {
  async saveToken(token: string, sessionInfo: SessionInfo): Promise<void> {
    // Encrypt token before storing
    const encrypted = await encrypt(token);
    await secureStore.set('bolt_token', encrypted);
  }
  
  async loadToken(): Promise<{ token: string; sessionInfo: SessionInfo } | null> {
    const encrypted = await secureStore.get('bolt_token');
    if (!encrypted) return null;
    
    // Decrypt token
    const token = await decrypt(encrypted);
    return { token, sessionInfo };
  }
}
```

## Troubleshooting

### Authentication Keeps Failing

1. **Check device info**: Ensure all device parameters are correct
2. **Verify credentials**: Phone number must include country code
3. **Check network**: Ensure stable internet connection
4. **Rate limits**: Wait 24 hours if SMS limit reached

### Token Expired Errors

```typescript
// Handle token expiration globally
api.client.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try to refresh token
      await api.getAccessToken();
      
      // Retry original request
      return api.client.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Magic Link Not Received

1. Check spam/junk folder
2. Verify email address is correct
3. Wait up to 5 minutes for delivery
4. Try resending after 60 seconds

## Next Steps

- Learn about [Driver State Management](Driver-State-Management.md)
- Explore [Ride Management](Ride-Management.md)
- Read about [Error Handling](Error-Handling.md)
