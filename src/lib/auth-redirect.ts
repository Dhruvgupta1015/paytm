import type { AuthRole } from '@/types';

/**
 * Reusable Safe Internal Redirect Validator
 *
 * Enforces strict destination whitelist and protocol sanitization
 * for both server (middleware) and client (login page).
 */

const ALLOWED_EXACT_OR_PREFIXES = [
  '/journey',
  '/officer',
  '/documents',
  '/claim',
  '/tracking',
  '/escalation',
  '/passport',
  '/profile',
];

export function getSafeRedirect(
  redirectParam: string | null | undefined,
  role: AuthRole | null | undefined
): string {
  const defaultTarget = role === 'officer' ? '/officer' : '/journey';

  if (!redirectParam || typeof redirectParam !== 'string') {
    return defaultTarget;
  }

  const trimmed = redirectParam.trim();

  // 1. Must start with '/'
  if (!trimmed.startsWith('/')) {
    return defaultTarget;
  }

  // 2. Reject scheme-relative (//) or backslash (/\) attempts
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return defaultTarget;
  }

  // 3. Reject any URL containing colon ':' (e.g. javascript:, https:, data:)
  if (trimmed.includes(':')) {
    return defaultTarget;
  }

  // 4. Reject redirect loops (/login or /unauthorized)
  if (
    trimmed === '/login' ||
    trimmed.startsWith('/login?') ||
    trimmed.startsWith('/login/') ||
    trimmed === '/unauthorized' ||
    trimmed.startsWith('/unauthorized?') ||
    trimmed.startsWith('/unauthorized/')
  ) {
    return defaultTarget;
  }

  // 5. Must match allowed route whitelist
  const isAllowedPath = ALLOWED_EXACT_OR_PREFIXES.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(prefix + '/') || trimmed.startsWith(prefix + '?')
  );

  if (!isAllowedPath) {
    return defaultTarget;
  }

  // 6. Role-specific boundary enforcement
  if (role === 'customer') {
    if (trimmed === '/officer' || trimmed.startsWith('/officer/') || trimmed.startsWith('/officer?')) {
      return '/journey';
    }
  } else if (role === 'officer') {
    // Officers must not be redirected to customer-only workflow routes
    const isCustomerRoute =
      trimmed.startsWith('/journey') ||
      trimmed.startsWith('/documents') ||
      trimmed.startsWith('/claim') ||
      trimmed.startsWith('/tracking') ||
      trimmed.startsWith('/passport') ||
      trimmed.startsWith('/profile') ||
      trimmed.startsWith('/escalation');

    if (isCustomerRoute) {
      return '/officer';
    }
  }

  return trimmed;
}
