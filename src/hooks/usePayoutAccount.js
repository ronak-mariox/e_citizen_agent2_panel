import { useEffect, useState } from 'react';

import { getPayoutAccount } from '../api/profile.js';

/* The agent's payout account, shared by the reminder on every page and the
   Settings panel — asked once per page load rather than on every navigation,
   and updated in place when the panel saves, so the reminder goes away the
   moment the details are in. */

let cached;
let inFlight = null;
const listeners = new Set();

const announce = (account) => {
  cached = account;
  listeners.forEach((listener) => listener(account));
};

export function setPayoutAccount(account) {
  announce(account);
}

/** Forget it on sign-out, so the next agent in this tab is asked afresh. */
export function resetPayoutAccount() {
  cached = undefined;
}

/** Undefined while loading; null when it could not be read. */
export function usePayoutAccount() {
  const [account, setAccount] = useState(cached);

  useEffect(() => {
    listeners.add(setAccount);
    if (cached === undefined && !inFlight) {
      inFlight = getPayoutAccount()
        .then(announce)
        .catch(() => announce(null))
        .finally(() => {
          inFlight = null;
        });
    }
    return () => listeners.delete(setAccount);
  }, []);

  return account;
}

/** Neither a bank account nor a UPI ID — the company cannot pay this agent. */
export const isPayoutMissing = (account) => Boolean(account) && !account.hasBankAccount && !account.hasUpi;
