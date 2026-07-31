/**
 * This build is the Agent 2 portal, so only `agent_2` accounts belong in it.
 *
 * The backend issues a valid session to any staff account that signs in — one
 * /auth/login serves both panels — so refusing the wrong role is this app's job.
 * Backend routes that are genuinely Agent-2-only are additionally gated there
 * with `requireAgent2`; this check is about which shell to let someone into.
 */
export const PANEL_ROLE = 'agent_2';

export const PANEL_WRONG_ROLE_MESSAGE =
  'This account is not an Agent 2 account. Please sign in on the portal for your role.';
