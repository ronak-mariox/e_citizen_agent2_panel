import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { isPayoutMissing, usePayoutAccount } from '../hooks/usePayoutAccount.js';
import '../styles/case.css';

/* Without a bank account or UPI ID the company cannot pay this agent for the
   cases they finish, so until one is saved: a dialog once per browser session
   (first thing after signing in), and a strip on every page after that. */

const SEEN_KEY = 'agent2.payoutReminderSeen';
const SETTINGS_PATH = '/settings?tab=payout';

const seenThisSession = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const markSeen = () => {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Private mode: the dialog may show again, which is harmless.
  }
};

export function PayoutReminder() {
  const account = usePayoutAccount();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const missing = isPayoutMissing(account);
  const onSettings = pathname === '/settings';
  // Read once: a dialog already shown this session stays dismissed.
  const [dismissed, setDismissed] = useState(seenThisSession);
  const dialogOpen = missing && !onSettings && !dismissed;

  useEffect(() => {
    if (dialogOpen) markSeen();
  }, [dialogOpen]);

  if (!missing) return null;

  return (
    <>
      {!onSettings && (
        <div className="payout-reminder" role="status">
          <p className="payout-reminder__text">
            <strong>Add your bank details to get paid.</strong> The company sends your service amount to your bank
            account or UPI ID — until you add one, you cannot be paid for completed cases.
          </p>
          <Link className="payout-reminder__link" to={SETTINGS_PATH}>
            Add Bank Details
          </Link>
        </div>
      )}

      {dialogOpen && (
        <div className="modal" role="presentation" onClick={() => setDismissed(true)}>
          <div
            className="modal__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payout-reminder-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="modal__title" id="payout-reminder-title">
              Add your bank details first
            </h2>
            <p className="modal__body">
              Fill in your bank account or UPI ID to receive your service amount. Without it, the company cannot pay
              you even after you complete a case.
            </p>
            <div className="modal__actions">
              <button className="modal__cancel" type="button" onClick={() => setDismissed(true)}>
                Later
              </button>
              <button
                className="modal__confirm"
                type="button"
                onClick={() => {
                  setDismissed(true);
                  navigate(SETTINGS_PATH);
                }}
              >
                Add Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PayoutReminder;
