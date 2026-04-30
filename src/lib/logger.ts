export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private formatLog(payload: LogPayload) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      ...payload,
    });
  }

  debug(message: string, data?: Record<string, unknown>) {
    if (process.env.LOG_LEVEL === "debug") {
      console.debug(this.formatLog({ level: "debug", message, ...data }));
    }
  }

  info(message: string, data?: Record<string, unknown>) {
    console.info(this.formatLog({ level: "info", message, ...data }));
  }

  warn(message: string, data?: Record<string, unknown>) {
    console.warn(this.formatLog({ level: "warn", message, ...data }));
  }

  error(message: string, data?: Record<string, unknown>) {
    console.error(this.formatLog({ level: "error", message, ...data }));
  }
}

export const logger = new Logger();
