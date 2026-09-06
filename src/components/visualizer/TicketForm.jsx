import { useMemo, useState } from 'react';
import { DEPARTMENTS, healthLabel } from '../../data/tracks.js';
import { REASON_OPTIONS, REGION_BY_SECTION, URGENCY_OPTIONS } from '../../data/tickets.js';
import { CORRIDOR_BY_ID } from '../../data/network.js';
import { Badge, CloseButton, DeptTag, HealthValue, Icon, KV, Modal } from '../common/UI.jsx';
import { useApp } from '../../context/AppState.jsx';

export default function TicketForm({ track, open, onClose }) {
  const { raiseTicket, user, notify } = useApp();
  const [dept, setDept] = useState('ENGG');
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [remarks, setRemarks] = useState('');
  const [urgency, setUrgency] = useState('HIGH');
  const [time, setTime] = useState('2026-09-06T10:00');
  const [region, setRegion] = useState('');
  const [created, setCreated] = useState(null);

  const regionValue = region || (track ? REGION_BY_SECTION[track.id] : '');

  const attached = useMemo(() => {
    if (!track) return null;
    return {
      'Track ID': track.trackId,
      'Route / corridor': `${track.corridor} · ${CORRIDOR_BY_ID[track.corridor].shortName}`,
      'Section name': track.name,
      'Chainage': track.chainage,
      'Current status': track.status,
      'Track health': `${track.health}% (${healthLabel(track.health)})`,
      'Open defects': `${track.defects.length}`,
      'Last inspection': track.lastInspection,
      'Section in charge': track.inCharge,
    };
  }, [track]);

  if (!track) return null;

  const submit = () => {
    const ticket = raiseTicket({
      section: track.id,
      dept,
      reason,
      remarks: remarks || 'No additional remarks recorded.',
      urgency,
      raisedBy: user.role === 'STAFF' ? user.designation.replace('Senior Section Engineer (P.Way)', 'SSE/P.Way/ALJN') : 'Sr.DOM/DLI',
      raisedOn: `${time.slice(8, 10)} Sep 2026, ${time.slice(11, 16)}`,
      region: regionValue,
      assignedTo: `${DEPARTMENTS[dept].name} — ${regionValue.split('—')[1]?.trim() || 'Division'}`,
      outcome: 'Awaiting acknowledgement',
      attachedTrack: {
        trackId: track.trackId, health: track.health, status: track.status,
        corridor: track.corridor, defects: track.defects.length,
      },
    });
    setCreated(ticket);
    notify(`Inspection ticket ${ticket.id} raised for ${track.id}`, 'info');
  };

  const close = () => {
    setCreated(null);
    setRemarks('');
    onClose();
  };

  return (
    <Modal open={open} onClose={close} width={created ? 480 : 660}>
      {created ? (
        <>
          <div className="modal-head row">
            <span className="panel-title">Inspection ticket raised</span>
            <span className="spacer" />
            <CloseButton onClick={close} />
          </div>
          <div className="modal-body">
            <div className="ticket-confirm">
              <div className="tick"><Icon name="check" size={24} /></div>
              <div style={{ fontSize: 16, fontWeight: 650 }}>Ticket {created.id} created</div>
              <div className="muted mt-4" style={{ fontSize: 12.5 }}>
                Raised against section <span className="mono">{created.section}</span> and forwarded to {created.assignedTo}.
              </div>
              <div className="mt-16" style={{ textAlign: 'left' }}>
                <KV k="Ticket ID" v={<span className="mono">{created.id}</span>} />
                <KV k="Section" v={<span className="mono">{created.section}</span>} />
                <KV k="Department" v={<DeptTag dept={created.dept} full />} />
                <KV k="Urgency" v={<Badge>{created.urgency}</Badge>} />
                <KV k="Status" v={<Badge>{created.status}</Badge>} />
                <KV k="Time requested" v={created.raisedOn} />
              </div>
              <div className="callout info mt-16" style={{ textAlign: 'left' }}>
                <span className="ico"><Icon name="layers" size={14} /></span>
                <div>
                  Full section record (health {created.attachedTrack.health}%, {created.attachedTrack.defects} open defects,
                  status {created.attachedTrack.status}) has been attached automatically. No re-entry of track data was required.
                </div>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn primary" onClick={close}>Done</button>
          </div>
        </>
      ) : (
        <>
          <div className="modal-head row">
            <div>
              <span className="panel-title">Raise inspection ticket</span>
              <div className="tiny dim">Section context is attached automatically — enter only request-specific details</div>
            </div>
            <span className="spacer" />
            <CloseButton onClick={close} />
          </div>

          <div className="modal-body">
            <div className="callout ok mb-16">
              <span className="ico"><Icon name="layers" size={14} /></span>
              <div>
                <strong>Attached automatically from the selected track</strong>
                <div className="row gap-8 mt-8 wrap">
                  <span className="mono bold">{track.id}</span>
                  <span className="muted">{track.name}</span>
                  <Badge>{track.status}</Badge>
                  <HealthValue value={track.health} size={12} />
                  <span className="tiny dim">{track.defects.length} open defects</span>
                </div>
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: 14 }}>
              <div className="field">
                <label>Section number <span className="req">*</span></label>
                <div className="locked-field">
                  <span className="lock"><Icon name="shield" size={12} /></span>
                  <span className="mono bold">{track.id}</span>
                  <span className="spacer" />
                  <span className="tiny dim">prefilled from selection</span>
                </div>
                <span className="hint">Track ID {track.trackId} · {track.chainage}</span>
              </div>

              <div className="field">
                <label>Time requested <span className="req">*</span></label>
                <input className="input" type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>

              <div className="field">
                <label>Region details <span className="req">*</span></label>
                <input className="input" value={regionValue} onChange={(e) => setRegion(e.target.value)} />
                <span className="hint">Prefilled from the section master — editable</span>
              </div>

              <div className="field">
                <label>Department <span className="req">*</span></label>
                <select className="select" value={dept} onChange={(e) => setDept(e.target.value)}>
                  {Object.values(DEPARTMENTS).map((d) => (
                    <option key={d.id} value={d.id}>{d.full} ({d.abbr})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Reason for inspection <span className="req">*</span></label>
              <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASON_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Observations / remarks</label>
              <textarea
                className="textarea" value={remarks} onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Jerk felt at Km 141/6 while working 12312. Fish plate appears loose."
              />
            </div>

            <div className="field">
              <label>Urgency <span className="req">*</span></label>
              <div className="radio-row">
                {URGENCY_OPTIONS.map((u) => (
                  <button
                    key={u}
                    className={`radio-chip ${urgency === u ? `on ${u === 'IMMEDIATE' ? 'crit' : ''}` : ''}`}
                    onClick={() => setUrgency(u)}
                  >{u}</button>
                ))}
              </div>
            </div>

            <details style={{ marginTop: 6 }}>
              <summary className="section-label" style={{ cursor: 'pointer' }}>
                Section record attached to this ticket ({Object.keys(attached).length} fields)
              </summary>
              <div className="mt-8" style={{ background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 3, padding: '8px 11px' }}>
                {Object.entries(attached).map(([k, v]) => <KV key={k} k={k} v={v} />)}
              </div>
            </details>
          </div>

          <div className="modal-foot">
            <button className="btn ghost" onClick={close}>Cancel</button>
            <button className="btn primary" onClick={submit}>
              <Icon name="check" /> Submit inspection ticket
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
