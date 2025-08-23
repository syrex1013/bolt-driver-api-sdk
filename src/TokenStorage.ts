import { promises as fs } from 'fs';
import { join } from 'path';
import { TokenStorage, SessionInfo } from './types';

/**
 * File-based token storage implementation
 * Stores authentication tokens and session information in a JSON file
 */
export class FileTokenStorage implements TokenStorage {
  public filePath: string;

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

      // Check if token is expired
      if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
        await this.clearToken();
        return null;
      }

      return {
        token: tokenData.token,
        sessionInfo: tokenData.sessionInfo
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
 * Memory-based token storage for testing or temporary use
 */
export class MemoryTokenStorage implements TokenStorage {
  private tokenData: { token: string; sessionInfo: SessionInfo } | null = null;

  async saveToken(token: string, sessionInfo: SessionInfo): Promise<void> {
    this.tokenData = { token, sessionInfo };
  }

  async loadToken(): Promise<{ token: string; sessionInfo: SessionInfo } | null> {
    return this.tokenData;
  }

  async clearToken(): Promise<void> {
    this.tokenData = null;
  }

  async hasValidToken(): Promise<boolean> {
    return this.tokenData !== null;
  }
}
