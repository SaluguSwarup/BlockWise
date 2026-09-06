import { useMemo, useState } from 'react';
import { useApp } from '../context/AppState.jsx';
import { TICKET_STATUS } from '../data/tickets.js';
import { TRACK_BY_ID, DEPARTMENTS } from '../data/tracks.js';
import { Badge, CloseButton, DeptTag, Drawer, HealthValue, Icon, KV, Panel, Stat } from '../components/common/UI.jsx';
import TrackSearch from '../components/visualizer/TrackSearch.jsx';
import TicketForm from '../components/visualizer/TicketForm.jsx';
import { Modal } from '../components/common/UI.jsx';

export default function TicketsPage() {
  const { tickets } = useApp();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [openTicket, setOpenTicket] = useState(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [ticketFor, setTicketFor] = useState(null);

  const filtered = useMemo(() => tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (deptFilter !== 'ALL' && t.dept !== deptFilter) return false;
    if (query && !`${t.id} ${t.section} ${t.reason} ${t.raisedBy} ${t.region}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [tickets, statusFilter, deptFilter, query]);

  const counts = useMemo(() => ({
    open: tickets.filter((t) => t.status === TICKET_STATUS.OPEN).length,
    ack: tickets.filter((t) => t.status === TICKET_STATUS.ACKNOWLEDGED).length,
    sched: tickets.filter((t) => t.status === TICKET_STATUS.INSPECTION_SCHEDULED).length,
    immediate: tickets.filter((t) => t.urgency === 'IMMEDIATE').length,
  }), [tickets]);

  const track = openTicket ? TRACK_BY_ID[openTicket.section] : null;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Inspection Tickets</div>
          <div className="page-sub">Field inspection requests raised against sections — each ticket carries its section record</div>
        </div>
        <span className="spacer" />
        <button className="btn primary" onClick={() => setPickOpen(true)}>
          <Icon name="plus" /> New inspection ticket
        </button>
      </div>

      <div className="grid grid-4 mb-16">
        <Stat tone="warn" label="Open" value={counts.open} foot="Awaiting acknowledgement" />
        <Stat tone="info" label="Acknowledged" value={counts.ack} foot="Taken up by the department" />
        <Stat tone="ok" label="Inspection scheduled" value={counts.sched} foot="Inspection party detailed" />
        <Stat tone="crit" label="Immediate urgency" value={counts.immediate} foot="Requires same-day attention" />
      </div>

      <Panel
        title={`Ticket register — ${filtered.length} tickets`}
        icon="ticket"
        bodyClass="tight"
        right={(
          <div className="row gap-8">
            <select className="select" style={{ width: 170, padding: '5px 9px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All statuses</option>
              {Object.values(TICKET_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select" style={{ width: 150, padding: '5px 9px' }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="ALL">All departments</option>
              {Object.values(DEPARTMENTS).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input className="input" style={{ width: 200, padding: '5px 9px' }} placeholder="Search tickets…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        )}
      >
        <table className="tbl">
          <thead>
            <tr>
              <th>Ticket ID</th><th>Time requested</th><th>Section</th><th>Region</th>
              <th>Department</th><th>Reason</th><th>Urgency</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="clickable" onClick={() => setOpenTicket(t)}>
                <td className="mono bold">{t.id}</td>
                <td className="tiny muted nowrap">{t.raisedOn}</td>
                <td className="mono">{t.section}</td>
                <td className="tiny">{t.region}</td>
                <td><DeptTag dept={t.dept} /></td>
                <td style={{ maxWidth: 260 }}>{t.reason}</td>
                <td><Badge>{t.urgency}</Badge></td>
                <td><Badge>{t.status}</Badge></td>
                <td className="right"><Icon name="chevronR" size={13} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9}><div className="empty">No tickets match the current filters.</div></td></tr>
            )}
          </tbody>
        </table>
      </Panel>

      {/* ---------- ticket detail ---------- */}
      <Drawer open={!!openTicket} onClose={() => setOpenTicket(null)}>
        {openTicket && (
          <>
            <header className="drawer-head">
              <div className="row gap-12">
                <div>
                  <div className="row gap-8">
                    <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{openTicket.id}</span>
                    <Badge>{openTicket.status}</Badge>
                    <Badge>{openTicket.urgency}</Badge>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{openTicket.reason}</div>
                </div>
                <span className="spacer" />
                <CloseButton onClick={() => setOpenTicket(null)} />
              </div>
            </header>
            <div className="drawer-body">
              <div className="section-label mb-8">Request details</div>
              <KV k="Time requested" v={openTicket.raisedOn} />
              <KV k="Section number" v={<span className="mono bold">{openTicket.section}</span>} />
              <KV k="Region details" v={openTicket.region} />
              <KV k="Department" v={<DeptTag dept={openTicket.dept} full />} />
              <KV k="Reason" v={openTicket.reason} />
              <KV k="Urgency" v={<Badge>{openTicket.urgency}</Badge>} />
              <KV k="Raised by" v={openTicket.raisedBy} />
              <KV k="Assigned to" v={openTicket.assignedTo} />
              <KV k="Outcome" v={openTicket.outcome} />

              <div className="divider" />
              <div className="section-label mb-8">Observations</div>
              <div style={{ fontSize: 12.5 }}>{openTicket.remarks}</div>

              {track && (
                <>
                  <div className="divider" />
                  <div className="section-label mb-8">Attached section record (implicit)</div>
                  <div className="callout info mb-12">
                    <span className="ico"><Icon name="layers" size={14} /></span>
                    <div>These fields travelled with the ticket automatically — the field engineer did not re-enter them.</div>
                  </div>
                  <KV k="Track ID" v={<span className="mono">{track.trackId}</span>} />
                  <KV k="Section name" v={track.name} />
                  <KV k="Corridor" v={track.corridor} />
                  <KV k="Chainage" v={<span className="mono">{track.chainage}</span>} />
                  <KV k="Track health" v={<HealthValue value={track.health} />} />
                  <KV k="Current status" v={<Badge>{track.status}</Badge>} />
                  <KV k="Open defects" v={`${track.defects.length}`} />
                  <KV k="Last inspection" v={track.lastInspection} />
                  <KV k="Next scheduled maintenance" v={track.nextScheduledMaintenance} />
                </>
              )}
            </div>
          </>
        )}
      </Drawer>

      {/* ---------- track picker for a new ticket ---------- */}
      <Modal open={pickOpen} onClose={() => setPickOpen(false)} width={560}>
        <div className="modal-head row">
          <div>
            <span className="panel-title">Select the section</span>
            <div className="tiny dim">A ticket must be raised against a section so its record can be attached</div>
          </div>
          <span className="spacer" />
          <CloseButton onClick={() => setPickOpen(false)} />
        </div>
        <div className="modal-body" style={{ minHeight: 260 }}>
          <TrackSearch
            placeholder="Type a section number, e.g. SEC-104…"
            onSelect={(id) => {
              if (!id) return;
              setPickOpen(false);
              setTicketFor(TRACK_BY_ID[id]);
            }}
          />
          <div className="callout info mt-16">
            <span className="ico"><Icon name="alert" size={14} /></span>
            <div>You can also raise a ticket directly from the Network Visualiser by clicking a section on the map.</div>
          </div>
        </div>
      </Modal>

      <TicketForm track={ticketFor} open={!!ticketFor} onClose={() => setTicketFor(null)} />
    </>
  );
}
