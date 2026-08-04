import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { ACTIVE_CASES } from '../constants/dashboard.js';

/* Which cases the agent has closed, and what the department decided.
 *
 * The five-step workflow ends on one screen but its result shows up on three —
 * the assigned badge, the dashboard's Active Cases list and the Completed Cases
 * tab — so the outcome is held here rather than inside the case screen.
 *
 * In memory only: closing a case will be a POST once the agent API exists, and
 * until then a reload puts every case back in the queue. */

const CasesContext = createContext(null);

export function CasesProvider({ children }) {
  // { [applicationId]: { decision, closedAt } }
  const [closed, setClosed] = useState({});

  const closeCase = useCallback((id, decision) => {
    setClosed((current) => ({ ...current, [id]: { decision, closedAt: new Date() } }));
  }, []);

  const value = useMemo(() => {
    const decided = (decision) =>
      ACTIVE_CASES.filter((item) => closed[item.id]?.decision === decision).map((item) => ({
        ...item,
        ...closed[item.id],
      }));

    return {
      closed,
      closeCase,
      isClosed: (id) => Boolean(closed[id]),
      // What is left to work, and what each closing tab shows.
      assigned: ACTIVE_CASES.filter((item) => !closed[item.id]),
      completed: decided('approved'),
      rejected: decided('rejected'),
    };
  }, [closed, closeCase]);

  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases() {
  const context = useContext(CasesContext);
  if (!context) throw new Error('useCases must be used inside a CasesProvider');

  return context;
}

export default CasesContext;
