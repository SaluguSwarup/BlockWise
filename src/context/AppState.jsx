import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { REQUEST_STATUS } from '../data/blockRequests.js';
import { INSPECTION_TICKETS, TICKET_STATUS } from '../data/tickets.js';
import { SANCTIONED_BLOCKS, USERS } from '../data/plans.js';
import { TRACKS } from '../data/tracks.js';
// Frozen fixture (R3) — requests carry a baked `priority` (the ScoringOutput score record) so
// nothing in the frontend computes a score itself. See src/mocks/README.md.
import REQUESTS_FIXTURE from '../mocks/requests.json';

const BLOCK_REQUESTS = REQUESTS_FIXTURE.data;

const AppStateContext = createContext(null);

let ticketSeq = 400;

export function AppStateProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState(INSPECTION_TICKETS);
  const [requests, setRequests] = useState(BLOCK_REQUESTS);
  const [planBlocks, setPlanBlocks] = useState(SANCTIONED_BLOCKS);
  const [planResult, setPlanResult] = useState(null); // last engine run
  const [toast, setToast] = useState(null);

  const login = useCallback((role) => setUser(USERS[role]), []);
  const logout = useCallback(() => {
    setUser(null);
    setPlanResult(null);
  }, []);

  const notify = useCallback((message, tone = 'info') => {
    setToast({ message, tone, key: Date.now() });
    setTimeout(() => setToast(null), 4200);
  }, []);

  const raiseTicket = useCallback((draft) => {
    ticketSeq += 1;
    const ticket = {
      id: `INS-2026-0${ticketSeq}`,
      status: TICKET_STATUS.OPEN,
      ...draft,
    };
    setTickets((prev) => [ticket, ...prev]);
    return ticket;
  }, []);

  const setRequestStatus = useCallback((ids, status) => {
    const set = new Set(Array.isArray(ids) ? ids : [ids]);
    setRequests((prev) => prev.map((r) => (set.has(r.id) ? { ...r, status } : r)));
  }, []);

  const commitPlan = useCallback((result) => {
    setPlanResult(result);
    setPlanBlocks((prev) => {
      const withoutOld = prev.filter((b) => b.source !== 'OPTIMISED');
      return [...withoutOld, ...result.blocks];
    });
    const ids = result.blocks.flatMap((b) => b.tasks.map((t) => t.requestId));
    setRequestStatus(ids, REQUEST_STATUS.SCHEDULED);
  }, [setRequestStatus]);

  const resetPlan = useCallback(() => {
    setPlanResult(null);
    setPlanBlocks(SANCTIONED_BLOCKS);
    setRequests(BLOCK_REQUESTS);
  }, []);

  const selectedRequests = useMemo(
    () => requests.filter((r) => r.status === REQUEST_STATUS.SELECTED),
    [requests],
  );

  const value = useMemo(
    () => ({
      user, login, logout,
      isAdmin: user?.role === 'ADMIN',
      tracks: TRACKS,
      tickets, raiseTicket,
      requests, setRequestStatus, selectedRequests,
      planBlocks, planResult, commitPlan, resetPlan,
      toast, notify,
    }),
    [user, login, logout, tickets, raiseTicket, requests, setRequestStatus, selectedRequests, planBlocks, planResult, commitPlan, resetPlan, toast, notify],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider');
  return ctx;
}
