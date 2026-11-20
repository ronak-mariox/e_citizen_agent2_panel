import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import * as queueApi from '../api/queue.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';

/* The agent's own open cases, shared by the sidebar badge and the dashboard's
 * Active Cases list — the two places that need "what is on my desk" without
 * being the desk screen itself (that is AssignedQueuePage's own fetch, and
 * Gov. Processing's — each reads the API directly, since neither is a light
 * summary).
 *
 * One fetch here rather than one per consumer: the badge and the list are
 * both reading the count in the same request cycle, and two independent
 * fetches racing would occasionally show the badge and the list disagreeing.
 */

const PRIORITY_LABEL = { urgent: 'High', high: 'High', normal: 'Medium', low: 'Low' };

/* Agent 1 forwards a case at `pending_submission`; the rest are Agent 2's own
   workflow. Same fold AssignedQueuePage's own STAGE_OF uses. */
const STAGE_OF = {
  pending_submission: 'Pending Submission',
  submitted_to_department: 'Gov. Processing',
  in_progress: 'Gov. Processing',
  escalated: 'Awaiting Decision',
  on_hold: 'Awaiting Decision',
};

const initialsOf = (name) => {
  const trimmed = name?.trim();
  if (!trimmed) return '—';

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
};

const toSummaryRow = (application) => ({
  id: application.id,
  initials: initialsOf(application.citizen?.fullName),
  name: application.citizen?.fullName ?? application.citizen?.mobile ?? 'Unknown',
  priority: PRIORITY_LABEL[application.priority] ?? 'Medium',
  meta: `${application.applicationNumber} · ${application.service?.name ?? '—'}`,
  stage: STAGE_OF[application.status] ?? 'Pending Submission',
});

const CasesContext = createContext(null);

export function CasesProvider({ children }) {
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);

  // A case forwarded or reassigned elsewhere moves the badge without a reload.
  const [reloadToken, setReloadToken] = useState(0);
  useLiveRefresh(() => setReloadToken((token) => token + 1), ['applications']);

  useEffect(() => {
    let cancelled = false;
    const silent = reloadToken > 0;

    queueApi
      .listMyCases({ limit: 50 })
      .then((data) => {
        if (!cancelled) setAssigned(data.applications.map(toSummaryRow));
      })
      .catch(() => {
        // The badge and the dashboard card fall back to "nothing open" on a
        // failed fetch rather than showing an error of their own — both are
        // secondary reads, and AssignedQueuePage's own screen is where a
        // failure actually needs reporting.
        if (!cancelled && !silent) setAssigned([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const value = useMemo(() => ({ assigned, loading }), [assigned, loading]);

  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases() {
  const context = useContext(CasesContext);
  if (!context) throw new Error('useCases must be used inside a CasesProvider');

  return context;
}

export default CasesContext;
