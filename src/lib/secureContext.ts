/**
 * Secure context detection for HTTP LAN graceful degradation.
 *
 * APIs like `crypto.subtle` and `navigator.serviceWorker` require a
 * Secure Context (HTTPS or `localhost`).  On HTTP LAN these APIs
 * throw `DOMException: The operation is insecure.`
 */

/** `true` when the page is served over HTTPS or from `localhost` */
export function isSecureContext(): boolean {
  return window.isSecureContext === true
}

/** `true` when the hostname is `localhost` or `127.0.0.1` (loopback) */
export function isLocalhost(): boolean {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

/** `true` when the page is served over plain HTTP on a LAN address */
export function isHttpLan(): boolean {
  return window.location.protocol === 'http:' && !isLocalhost()
}

/**
 * Human-readable description of the current context for use in UI warnings.
 */
export function contextLabel(): string {
  if (isSecureContext()) return 'HTTPS / localhost (seguro)'
  if (isLocalhost()) return 'HTTP localhost (parcialmente seguro)'
  return 'HTTP LAN (não seguro)'
}