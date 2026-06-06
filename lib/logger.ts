/**
 * POLARIS PROTOCOL — STRUCTURED LOGGER
 * Standardizes [POLARIS] prefix and log levels across the application.
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "FHE" | "DEBUG";

interface LogMetadata {
  module?: string;
  txHash?: string;
  address?: string;
  amount?: string;
  asset?: string;
  error?: any;
  [key: string]: any;
}

class PolarisLogger {
  private format(level: LogLevel, module: string, message: string): string {
    return `[POLARIS][${level}][${module.toUpperCase()}] ${message}`;
  }

  info(module: string, message: string, metadata?: LogMetadata) {
    console.log(this.format("INFO", module, message), metadata || "");
  }

  warn(module: string, message: string, metadata?: LogMetadata) {
    console.warn(this.format("WARN", module, message), metadata || "");
  }

  error(module: string, message: string, metadata?: LogMetadata) {
    console.error(this.format("ERROR", module, message), metadata || "");
  }

  fhe(module: string, message: string, metadata?: LogMetadata) {
    // Special level for FHE operations (vibrant cyan if browser supports it)
    console.log(
      `%c${this.format("FHE", module, message)}`,
      "color: #00e5ff; font-weight: bold;",
      metadata || ""
    );
  }

  debug(module: string, message: string, metadata?: LogMetadata) {
    if (process.env.NODE_ENV === "development") {
      console.log(this.format("DEBUG", module, message), metadata || "");
    }
  }

  /**
   * Special lifecycle logger for FHE operations.
   */
  logFheLifecycle(module: string, step: "ENCRYPTION_START" | "ENCRYPTION_SUCCESS" | "BROADCAST" | "CONFIRMED" | "REVERT", metadata?: LogMetadata) {
    const emojis = {
      ENCRYPTION_START: "🔐",
      ENCRYPTION_SUCCESS: "✅",
      BROADCAST: "🛰️",
      CONFIRMED: "🏁",
      REVERT: "❌"
    };

    this.fhe(module, `${emojis[step]} ${step}`, metadata);
  }
}

export const logger = new PolarisLogger();
