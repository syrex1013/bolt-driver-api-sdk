import { FileTokenStorage, MemoryTokenStorage } from '../src/TokenStorage';
import { SessionInfo } from '../src/types';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('TokenStorage', () => {
  describe('MemoryTokenStorage', () => {
    let storage: MemoryTokenStorage;

    beforeEach(() => {
      storage = new MemoryTokenStorage();
    });

    it('should save and load token data', async () => {
      const token = 'test-token-123';
      const sessionInfo: SessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: token,
        refreshToken: token,
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };

      await storage.saveToken(token, sessionInfo);
      const loaded = await storage.loadToken();

      expect(loaded).toBeDefined();
      expect(loaded!.token).toBe(token);
      expect(loaded!.sessionInfo).toEqual(sessionInfo);
    });

    it('should clear token data', async () => {
      const token = 'test-token-123';
      const sessionInfo: SessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: token,
        refreshToken: token,
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };

      await storage.saveToken(token, sessionInfo);
      expect(await storage.hasValidToken()).toBe(true);

      await storage.clearToken();
      expect(await storage.hasValidToken()).toBe(false);
      expect(await storage.loadToken()).toBeNull();
    });

    it('should check if valid token exists', async () => {
      expect(await storage.hasValidToken()).toBe(false);

      const token = 'test-token-123';
      const sessionInfo: SessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: token,
        refreshToken: token,
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };

      await storage.saveToken(token, sessionInfo);
      expect(await storage.hasValidToken()).toBe(true);
    });
  });

  describe('FileTokenStorage', () => {
    let storage: FileTokenStorage;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = join(__dirname, 'temp-tokens');
      await fs.mkdir(tempDir, { recursive: true });
      storage = new FileTokenStorage(join(tempDir, 'test-token.json'));
    });

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should save and load token data to/from file', async () => {
      const token = 'test-token-123';
      const sessionInfo: SessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: token,
        refreshToken: token,
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };

      await storage.saveToken(token, sessionInfo);
      
      // Verify file was created
      const fileExists = await fs.access(storage.filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const loaded = await storage.loadToken();
      expect(loaded).toBeDefined();
      expect(loaded!.token).toBe(token);
      expect(loaded!.sessionInfo).toEqual(sessionInfo);
    });

    it('should handle expired tokens', async () => {
      const token = 'test-token-123';
      const sessionInfo: SessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: token,
        refreshToken: token,
        tokenType: 'driver',
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      };

      await storage.saveToken(token, sessionInfo);
      
      // Should return null for expired token
      const loaded = await storage.loadToken();
      expect(loaded).toBeNull();

      // File should be deleted
      const fileExists = await fs.access(storage.filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should clear token data and delete file', async () => {
      const token = 'test-token-123';
      const sessionInfo: SessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: token,
        refreshToken: token,
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };

      await storage.saveToken(token, sessionInfo);
      expect(await storage.hasValidToken()).toBe(true);

      await storage.clearToken();
      expect(await storage.hasValidToken()).toBe(false);
      expect(await storage.loadToken()).toBeNull();

      // File should be deleted
      const fileExists = await fs.access(storage.filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should handle missing token file gracefully', async () => {
      const loaded = await storage.loadToken();
      expect(loaded).toBeNull();
      expect(await storage.hasValidToken()).toBe(false);
    });

    it('should handle invalid JSON in token file', async () => {
      // Create a file with invalid JSON
      await fs.writeFile(storage.filePath, 'invalid json content', 'utf8');
      
      const loaded = await storage.loadToken();
      expect(loaded).toBeNull();
    });

    it('should check if valid token exists', async () => {
      expect(await storage.hasValidToken()).toBe(false);

      const token = 'test-token-123';
      const sessionInfo: SessionInfo = {
        sessionId: 'session-123',
        driverId: 12345,
        partnerId: 67890,
        companyId: 111,
        companyCityId: 222,
        accessToken: token,
        refreshToken: token,
        tokenType: 'driver',
        expiresAt: Date.now() + 3600000
      };

      await storage.saveToken(token, sessionInfo);
      expect(await storage.hasValidToken()).toBe(true);
    });
  });
});
