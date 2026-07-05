/**
 * Base error class for all VideoForge errors.
 */
export class VideoForgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when configuration validation fails.
 */
export class ConfigValidationError extends VideoForgeError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Error thrown when video rendering fails.
 */
export class RenderError extends VideoForgeError {
  constructor(message: string) {
    super(message);
  }
}
