import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6921d6d51a52f632e7db246b", 
  requiresAuth: true // Ensure authentication is required for all operations
});
