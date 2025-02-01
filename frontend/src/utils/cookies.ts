/**
 * Get cookie value by name from document.cookie.
 *
 * @param cookieName cookie name
 * @returns cookie value or undefined if not found
 */
export function getCookieValue(cookieName: string): string | undefined {
  return document.cookie.match('(^|;)\\s*' + cookieName + '\\s*=\\s*([^;]+)')?.pop() || undefined;
}
