import { createAuthClient } from '@neondatabase/neon-js/auth';

// We fall back to empty string to prevent crashing during build if env isn't set yet.
const authUrl = import.meta.env.VITE_NEON_AUTH_URL || '';

export const authClient = createAuthClient(authUrl);
