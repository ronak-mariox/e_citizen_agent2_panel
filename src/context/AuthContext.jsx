import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authApi from '@/api/auth';
import { getErrorMessage, setSessionExpiredHandler } from '@/api/client';
import { PANEL_ROLE, PANEL_WRONG_ROLE_MESSAGE } from '@/constants/auth';
import { clearSession, getAccessToken, getStoredUser, saveSession } from '@/utils/session';

const AuthContext = createContext(null);

/**
 * Holds the signed-in agent for the whole app.
 *
 * `status` is what the router waits on:
 *   'loading'       — still confirming a stored token, render nothing routed yet
 *   'authenticated' — `user` is a real, server-confirmed agent
 *   'anonymous'     — no session
 *
 * The status matters because without it a page refresh would flash the login
 * screen before /auth/me answers, and every guarded route would bounce.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [status, setStatus] = useState(getAccessToken() ? 'loading' : 'anonymous');

  const endSession = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus('anonymous');
  }, []);

  // The axios interceptor calls this when a refresh fails, which is the only
  // way the app learns a session died while it was idle.
  useEffect(() => {
    setSessionExpiredHandler(endSession);
  }, [endSession]);

  // A token in localStorage is only a claim. Confirm it against the server
  // before trusting the cached user — the account may have been blocked, or its
  // role changed, since that was written.
  useEffect(() => {
    if (!getAccessToken()) return;

    async function loadUser() {
      try {
        const userData = await authApi.getMe();

        if (userData.role !== PANEL_ROLE) {
          endSession();
          return;
        }

        saveSession({ user: userData });
        setUser(userData);
        setStatus('authenticated');
      } catch {
        // the interceptor already tried to refresh and failed
        endSession();
      }
    }

    loadUser();
  }, [endSession]);

  const signIn = useCallback(async (credentials) => {
    try {
      const { user: agent, accessToken } = await authApi.login(credentials);

      // Authorization, not just authentication: this build is the Agent 2
      // portal, so an Agent 1 or admin account is refused a session here even
      // though its password was correct.
      if (agent.role !== PANEL_ROLE) {
        throw new Error(PANEL_WRONG_ROLE_MESSAGE);
      }

      saveSession({ accessToken, user: agent });
      setUser(agent);
      setStatus('authenticated');

      return agent;
    } catch (error) {
      // Only an axios failure has `.response`. Running getErrorMessage on the
      // wrong-role Error above would report it as a network problem and lose
      // what it actually said.
      throw error.response ? new Error(getErrorMessage(error)) : error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The local session goes either way. Letting this reject would leave the
      // caller's navigate() unreached, stranding the agent on a screen whose
      // session has already been cleared.
    } finally {
      endSession();
    }
  }, [endSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      signIn,
      signOut,
    }),
    [user, status, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }

  return context;
}

export default AuthContext;
