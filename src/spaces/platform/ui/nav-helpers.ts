/**
 * Navigation utilities for handling page transitions
 */

export function navigateToHome(): void {
  navigateWithFullPageTransition("/");
}

/**
 * Performs a full page transition to the specified URL
 * This completely reloads the page and re-initializes all contexts
 *
 * @param url - The URL to navigate to
 */
export function navigateWithFullPageTransition(url: string): void {
  window.location.href = url;
}

/**
 * Navigates to a tenant's dashboard with full page transition
 *
 * @param tenantSlug - The tenant slug to navigate to
 */
export function navigateToTenantDashboard(tenantSlug: string): void {
  navigateWithFullPageTransition(`/${tenantSlug}/`);
}

/**
 * Checks if we're in a browser environment (not SSR)
 * Useful for navigation functions that use window object
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Safe navigation function that checks for browser environment
 *
 * @param url - The URL to navigate to
 */
export function safeNavigateWithFullPageTransition(url: string): void {
  if (isBrowser()) {
    navigateWithFullPageTransition(url);
  }
}
