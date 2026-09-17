// API base — empty string because we use Next.js API routes (same origin)
export const API_BASE = '';

// Route paths
export const ROUTES = {
  HOME: '/',
  JOURNEY: '/journey',
  DOCUMENTS: '/documents',
  CLAIM_DRAFT: '/claim/draft',
  CLAIM_TRACKING: '/claim/tracking',
  ESCALATION: '/escalation',
  PROFILE: '/profile',
  LOGIN: '/login',
  OFFICER: '/officer',
} as const;

// Journey step keys (match journey-steps.json)
export const STEP_KEYS = {
  INTENT: 'intent',
  POLICY: 'policy',
  DETAILS: 'details',
  DOCUMENTS: 'documents',
  VERIFY: 'verify',
  DRAFT: 'draft',
  SUBMIT: 'submit',
  TRACKING: 'tracking',
} as const;

// Navigation items for sidebar
export const NAV_ITEMS = [
  { label: 'Journey', href: ROUTES.JOURNEY, icon: 'journey' },
  { label: 'Documents', href: ROUTES.DOCUMENTS, icon: 'documents' },
  { label: 'Claim Draft', href: ROUTES.CLAIM_DRAFT, icon: 'claim' },
  { label: 'Track Claim', href: ROUTES.CLAIM_TRACKING, icon: 'tracking' },
  { label: 'Escalation', href: ROUTES.ESCALATION, icon: 'escalation' },
  { label: 'Profile', href: ROUTES.PROFILE, icon: 'profile' },
] as const;
