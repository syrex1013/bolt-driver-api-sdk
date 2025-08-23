import { promises as fs } from 'fs';
import { join } from 'path';
import { LoggingConfig, LogEntry } from './types';

/**
 * Logger class for Bolt Driver API
 * Handles request/response logging with configurable levels and output
 */
export class Logger {
  private config: LoggingConfig;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = {
      enabled: true,
      level: 'info',
      logRequests: true,
      logResponses: false,
      logErrors: true,
      logToFile: false,
      logFilePath: join(process.cwd(), 'bolt-api.log'),
      ...config
    };

    // Set up periodic log flushing if logging to file
    if (this.config.logToFile && this.config.enabled) {
      this.flushInterval = setInterval(() => this.flushLogs(), 5000);
    }
  }

  /**
   * Internal log method
   * @param level - Log level
   * @param message - Message to log
   * @param data - Additional data to log
   * @private
   */
  private log(level: string, message: string, data?: any): void {
    if (this.shouldLog(level)) {
      this.consoleLog(level, message, data);
    }
  }

  /**
   * Log a debug message
   * @param message - Message to log
   * @param data - Additional data to log
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log an info message
   * @param message - Message to log
   * @param data - Additional data to log
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log a warning message
   * @param message - Message to log
   * @param data - Additional data to log
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log an error message
   * @param message - Message to log
   * @param data - Additional data to log
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Log an API request
   * @param method - HTTP method
   * @param url - Request URL
   * @param data - Request data
   */
  logRequest(method: string, url: string, data?: any): void {
    if (this.config.logRequests && this.config.enabled) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        method,
        url,
        requestData: data
      };
      
      this.addLogEntry(entry);
      this.consoleLog('info', `→ ${method} ${url}`, data);
    }
  }

  /**
   * Log an API response
   * @param method - HTTP method
   * @param url - Request URL
   * @param data - Response data
   * @param duration - Request duration in milliseconds
   */
  logResponse(method: string, url: string, data?: any, duration?: number): void {
    if (this.config.logResponses && this.config.enabled) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        method,
        url,
        responseData: data,
        ...(duration !== undefined && { duration })
      };
      
      this.addLogEntry(entry);
      const durationText = duration ? ` (${duration}ms)` : '';
      this.consoleLog('info', `← ${method} ${url}${durationText}`, data);
    }
  }

  /**
   * Log an API error
   * @param method - HTTP method
   * @param url - Request URL
   * @param error - Error details
   * @param duration - Request duration in milliseconds
   */
  logError(method: string, url: string, error: any, duration?: number): void {
    if (this.config.logErrors && this.config.enabled) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        method,
        url,
        error,
        ...(duration !== undefined && { duration })
      };
      
      this.addLogEntry(entry);
      const durationText = duration ? ` (${duration}ms)` : '';
      this.consoleLog('error', `✗ ${method} ${url}${durationText}`, error);
    }
  }

  /**
   * Check if a log level should be logged
   * @param level - Log level to check
   * @returns True if should log, false otherwise
   * @private
   */
  private shouldLog(level: string): boolean {
    if (!this.config.enabled) return false;
    
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= configLevelIndex;
  }

  /**
   * Add a log entry to the buffer
   * @param entry - Log entry to add
   * @private
   */
  private addLogEntry(entry: LogEntry): void {
    if (this.config.logToFile) {
      this.logBuffer.push(entry);
      
      // Flush immediately if buffer is getting large
      if (this.logBuffer.length > 100) {
        this.flushLogs();
      }
    }
  }

  /**
   * Log to console
   * @param level - Log level
   * @param message - Message to log
   * @param data - Additional data
   * @private
   */
  private consoleLog(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Flush buffered logs to file
   * @private
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.logToFile) return;

    try {
      const logs = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(this.config.logFilePath!, logs, 'utf8');
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to write logs to file:', error);
    }
  }

  /**
   * Update logging configuration
   * @param newConfig - New configuration options
   */
  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart flush interval if needed
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    if (this.config.logToFile && this.config.enabled) {
      this.flushInterval = setInterval(() => this.flushLogs(), 5000);
    }
  }

  /**
   * Get current logging configuration
   * @returns Current logging configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushLogs(); // Final flush
  }
}
