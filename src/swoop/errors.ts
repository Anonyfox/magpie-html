/**
 * Base error type for `swoop()`.
 */
export class SwoopError extends Error {
  override name = 'SwoopError';
}

/**
 * Thrown when the current runtime cannot execute `swoop()`.
 */
export class SwoopEnvironmentError extends SwoopError {
  override name = 'SwoopEnvironmentError';
}

/**
 * Thrown when `swoop()` exceeds its configured timeout.
 */
export class SwoopTimeoutError extends SwoopError {
  override name = 'SwoopTimeoutError';
}

/**
 * Thrown when script execution fails in a non-recoverable way.
 */
export class SwoopExecutionError extends SwoopError {
  override name = 'SwoopExecutionError';
}

/**
 * Thrown when `swoop()` is asked to execute potentially unsafe scripts
 * in a context where the caller should explicitly acknowledge the risk.
 */
export class SwoopSecurityError extends SwoopError {
  override name = 'SwoopSecurityError';
}
