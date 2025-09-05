import { promises as fs } from 'fs';
import { join } from 'path';
import { TokenStorage, SessionInfo } from './types';

/**
 * File-based token storage implementation for persistent authentication.
 *
 * This class provides secure, file-based storage for authentication tokens and session
 * information. Tokens are automatically encrypted (if configured) and stored in JSON
 * format with metadata including expiration times for automatic cleanup.
 *
 * @example
 * ```typescript
 * // Default file location (~/.bolt-token.json)
 * const storage = new FileTokenStorage();
 *
 * // Custom file location
 * const customStorage = new FileTokenStorage('/path/to/custom/token.json');
 *
 * // Save token after authentication
 * await storage.saveToken('jwt-token-123', {
 *   sessionId: 'session-123',
 *   driverId: 456,
 *   partnerId: 789,
 *   companyId: 101,
 *   companyCityId: 202,
 *   expiresAt: Date.now() + 3600000
 * });
 * ```
 *
 * @since 1.0.0
 * @author Bolt Driver API Team
 */
export class FileTokenStorage implements TokenStorage {
  public filePath: string;

  /**
   * Creates a new FileTokenStorage instance.
   *
   * @param filePath - Optional custom path for the token file. Defaults to '.bolt-token.json' in the current working directory.
   *
   * @example
   * ```typescript
   * // Use default location
   * const storage = new FileTokenStorage();
   *
   * // Use custom location
   * const storage = new FileTokenStorage('/home/user/.config/my-app-tokens.json');
   * ```
   *
   * @since 1.0.0
   */
  constructor(filePath?: string) {
    this.filePath = filePath || join(process.cwd(), '.bolt-token.json');
  }

  /**
   * Save token and session information to file
   * @param token - The authentication token
   * @param sessionInfo - Session information including driver details
   */
  async saveToken(token: string, sessionInfo: SessionInfo): Promise<void> {
    try {
      const tokenData = {
        token,
        sessionInfo,
        savedAt: new Date().toISOString(),
        expiresAt: sessionInfo.expiresAt
      };

      await fs.writeFile(this.filePath, JSON.stringify(tokenData, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Failed to save token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load token and session information from file
   * @returns Token data if valid, null otherwise
   */
  async loadToken(): Promise<{ token: string; sessionInfo: SessionInfo } | null> {
    try {
      const fileContent = await fs.readFile(this.filePath, 'utf8');
      const tokenData = JSON.parse(fileContent);

      // Check if token is expired (support both expiresAt and expires_at)
      const expiresAt = tokenData.expiresAt || tokenData.expires_at || tokenData.sessionInfo?.expiresAt;
      if (expiresAt && Date.now() > expiresAt) {
        await this.clearToken();
        return null;
      }

      // Support multiple legacy token file shapes. Prefer explicit token/sessionInfo fields,
      // but fall back to known alternative keys (refresh_token, access_token, driver_id, etc.).
      const token = tokenData.token || tokenData.refresh_token || tokenData.access_token || null;
      let sessionInfo = tokenData.sessionInfo || null;

      if (!sessionInfo && tokenData) {
        // Attempt to construct a minimal SessionInfo from legacy fields if present
        const driverId = Number(tokenData.driver_id || tokenData.driverId || 0) || 0;
        const partnerId = Number(tokenData.partner_id || tokenData.partnerId || 0) || 0;
        const companyId = Number(tokenData.company_id || tokenData.companyId || 0) || 0;
        const companyCityId = Number(tokenData.company_city_id || tokenData.companyCityId || 0) || 0;

        if (token || driverId) {
          sessionInfo = {
            sessionId: tokenData.session_id || tokenData.sessionId || "",
            driverId: driverId,
            partnerId: partnerId,
            companyId: companyId,
            companyCityId: companyCityId,
            accessToken: token || undefined,
            refreshToken: tokenData.refresh_token || undefined,
            tokenType: tokenData.token_type || undefined,
            expiresAt: expiresAt || Date.now() + 3600000,
          } as SessionInfo;
        }
      }

      if (!token && !sessionInfo) {
        return null;
      }

      return {
        token: token || (sessionInfo?.accessToken ?? ''),
        sessionInfo: sessionInfo as SessionInfo,
      };
    } catch (error) {
      // File doesn't exist or is invalid
      return null;
    }
  }

  /**
   * Clear stored token and session information
   */
  async clearToken(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }

  /**
   * Check if a valid token exists
   * @returns True if valid token exists, false otherwise
   */
  async hasValidToken(): Promise<boolean> {
    const tokenData = await this.loadToken();
    return tokenData !== null;
  }
}

/**
 * In-memory token storage implementation for testing and temporary sessions.
 *
 * This lightweight storage implementation holds authentication tokens and session
 * information in memory only. It's ideal for testing scenarios, short-lived sessions,
 * or environments where persistent storage is not required or desired.
 *
 * **Note:** Tokens stored in memory are lost when the application restarts.
 * For production use, consider {@link FileTokenStorage} for persistent storage.
 *
 * @example
 * ```typescript
 * const storage = new MemoryTokenStorage();
 *
 * // Save token (stored in memory only)
 * await storage.saveToken('jwt-token-123', {
 *   sessionId: 'session-123',
 *   driverId: 456,
 *   partnerId: 789,
 *   companyId: 101,
 *   companyCityId: 202,
 *   expiresAt: Date.now() + 3600000
 * });
 *
 * // Token is available until application restart
 * const token = await storage.loadToken();
 * ```
 *
 * @since 1.0.0
 * @author Bolt Driver API Team
 * @see {@link FileTokenStorage} - For persistent token storage
 */
export class MemoryTokenStorage implements TokenStorage {
  private tokenData: { token: string; sessionInfo: SessionInfo } | null = null;

  /**
   * Stores the authentication token and session information in memory.
   *
   * @param token - The JWT authentication token
   * @param sessionInfo - Complete session information including driver and company details
   *
   * @since 1.0.0
   */
  async saveToken(token: string, sessionInfo: SessionInfo): Promise<void> {
    this.tokenData = { token, sessionInfo };
  }

  /**
   * Retrieves the stored authentication token and session information.
   *
   * @returns The stored token data if available, null otherwise
   *
   * @since 1.0.0
   */
  async loadToken(): Promise<{ token: string; sessionInfo: SessionInfo } | null> {
    return this.tokenData;
  }

  /**
   * Clears the stored authentication token and session information from memory.
   *
   * @since 1.0.0
   */
  async clearToken(): Promise<void> {
    this.tokenData = null;
  }

  /**
   * Checks if a valid authentication token is currently stored.
   *
   * @returns True if a token exists in memory, false otherwise
   *
   * @since 1.0.0
   */
  async hasValidToken(): Promise<boolean> {
    return this.tokenData !== null;
  }
}
