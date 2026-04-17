import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import seedData from './mduData.json';
import './App.css';

const AES = ['Scott Picco', 'Julie Stanton', 'James Wholey', 'Roxy Scarborough'];
const STATUSES = ['Not Started', 'Contacted', 'In-Negotiation', 'Signed', 'Lost'];

const STATUS_META = {
  'Not Started':   { color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  'Contacted':     { color: '#1d4ed8', bg: '#dbeafe', dot: '#3b82f6' },
  'In-Negotiation':{ color: '#c2410c', bg: '#ffedd5', dot: '#f97316' },
  'Signed':        { color: '#15803d', bg: '#dcfce7', dot: '#22c55e' },
  'Lost':          { color: '#be123c', bg: '#ffe4e6', dot: '#f43f5e' },
};

const AE_COLORS = {
  'Scott Picco':      '#1e40af',
  'Julie Stanton':    '#166534',
  'James Wholey':     '#c2410c',
  'Roxy Scarborough': '#6b21a8',
};

const AE_INITIALS = {
  'Scott Picco':      'SP',
  'Julie Stanton':    'JS',
  'James Wholey':     'JW',
  'Roxy Scarborough': 'RS',
};

// ── Utility ──────────────────────────────────────────────────────────────────
function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

function StatBadge({ label, value, color = '#1e40af', small = false }) {
  return (
    <div className={`stat-badge ${small ? 'small' : ''}`} style={{ '--accent': color }}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function StatusPill({ status, onClick, editable = false }) {
  const meta = STATUS_META[status] || STATUS_META['Not Started'];
  return (
    <span
      className={`status-pill ${editable ? 'editable' : ''}`}
      style={{ color: meta.color, background: meta.bg, cursor: editable ? 'pointer' : 'default' }}
      onClick={onClick}
      title={editable ? 'Click to change status' : ''}
    >
      <span className="status-dot" style={{ background: meta.dot }} />
      {status}
    </span>
  );
}

function ProgressBar({ value, color, height = 6 }) {
  return (
    <div className="progress-track" style={{ height }}>
      <div className="progress-fill" style={{ width: `${Math.min(value, 100)}%`, background: color, height }} />
    </div>
  );
}

// ── AE Selector ───────────────────────────────────────────────────────────────
function AESelector({ selectedAE, onSelect }) {
  return (
    <div className="ae-selector">
      <span className="ae-selector-label">Who are you?</span>
      <div className="ae-pills">
        {AES.map(ae => (
          <button
            key={ae}
            className={`ae-pill ${selectedAE === ae ? 'active' : ''}`}
            style={{ '--ae-color': AE_COLORS[ae] }}
            onClick={() => onSelect(selectedAE === ae ? null : ae)}
          >
            <span className="ae-avatar">{AE_INITIALS[ae]}</span>
            {ae}
          </button>
        ))}
        {selectedAE && (
          <button className="ae-pill clear" onClick={() => onSelect(null)}>
            ✕ View All
          </button>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ properties }) {
  const total = properties.length;
  const totalUnits = properties.reduce((s, p) => s + (Number(p.totalUnits) || 0), 0);
  const byStat = useMemo(() => {
    const m = {};
    STATUSES.forEach(s => { m[s] = { count: 0, units: 0 }; });
    properties.forEach(p => {
      const s = p.status || 'Not Started';
      if (m[s]) { m[s].count++; m[s].units += Number(p.totalUnits) || 0; }
    });
    return m;
  }, [properties]);

  const aeStats = useMemo(() => AES.map(ae => {
    const mine = properties.filter(p => p.ae === ae);
    const signed = mine.filter(p => p.status === 'Signed');
    const units = mine.reduce((s, p) => s + (Number(p.totalUnits) || 0), 0);
    const signedUnits = signed.reduce((s, p) => s + (Number(p.totalUnits) || 0), 0);
    return { ae, total: mine.length, signed: signed.length, units, signedUnits };
  }).sort((a, b) => pct(b.signed, b.total) - pct(a.signed, a.total)), [properties]);

  return (
    <div className="dashboard">
      {/* KPI Row */}
      <div className="kpi-row">
        <div className="kpi-card primary">
          <div className="kpi-number">{total.toLocaleString()}</div>
          <div className="kpi-label">Total Properties</div>
        </div>
        <div className="kpi-card primary">
          <div className="kpi-number">{totalUnits.toLocaleString()}</div>
          <div className="kpi-label">Total Units</div>
        </div>
        {STATUSES.map(s => (
          <div key={s} className="kpi-card" style={{ '--kpi-accent': STATUS_META[s].dot }}>
            <div className="kpi-number" style={{ color: STATUS_META[s].color }}>
              {byStat[s].count}
            </div>
            <div className="kpi-label">{s}</div>
            <div className="kpi-sub">{byStat[s].units.toLocaleString()} units</div>
          </div>
        ))}
      </div>

      <div className="dash-bottom">
        {/* Leaderboard */}
        <div className="dash-card leaderboard">
          <h3 className="card-title">🏆 Leaderboard</h3>
          <div className="lb-list">
            {aeStats.map((row, i) => {
              const p = pct(row.signed, row.total);
              const medals = ['🥇', '🥈', '🥉', '4️⃣'];
              return (
                <div key={row.ae} className="lb-row">
                  <span className="lb-medal">{medals[i]}</span>
                  <span className="lb-avatar" style={{ background: AE_COLORS[row.ae] }}>
                    {AE_INITIALS[row.ae]}
                  </span>
                  <div className="lb-info">
                    <div className="lb-name">{row.ae}</div>
                    <ProgressBar value={p} color={AE_COLORS[row.ae]} height={5} />
                  </div>
                  <div className="lb-stats">
                    <span className="lb-pct" style={{ color: AE_COLORS[row.ae] }}>{p}%</span>
                    <span className="lb-detail">{row.signed}/{row.total} props</span>
                    <span className="lb-detail">{row.signedUnits}/{row.units} units</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="dash-card pipeline">
          <h3 className="card-title">Pipeline by Stage</h3>
          <div className="pipeline-list">
            {STATUSES.map(s => {
              const count = byStat[s].count;
              const p = pct(count, total);
              const meta = STATUS_META[s];
              return (
                <div key={s} className="pipeline-row">
                  <span className="pipeline-label" style={{ color: meta.color }}>{s}</span>
                  <div className="pipeline-bar-wrap">
                    <div className="pipeline-bar" style={{ width: `${p}%`, background: meta.dot }} />
                  </div>
                  <span className="pipeline-count">{count}</span>
                  <span className="pipeline-pct">{p}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-AE Summary */}
        <div className="dash-card ae-summary">
          <h3 className="card-title">AE Breakdown</h3>
          <table className="ae-table">
            <thead>
              <tr>
                <th>AE</th>
                {STATUSES.map(s => <th key={s}>{s}</th>)}
                <th>% Signed</th>
              </tr>
            </thead>
            <tbody>
              {AES.map(ae => {
                const mine = properties.filter(p => p.ae === ae);
                return (
                  <tr key={ae}>
                    <td>
                      <span className="ae-dot" style={{ background: AE_COLORS[ae] }} />
                      {ae}
                    </td>
                    {STATUSES.map(s => (
                      <td key={s} style={{ color: STATUS_META[s].color }}>
                        {mine.filter(p => (p.status || 'Not Started') === s).length}
                      </td>
                    ))}
                    <td>
                      <strong style={{ color: AE_COLORS[ae] }}>
                        {pct(mine.filter(p => p.status === 'Signed').length, mine.length)}%
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Property Detail Modal ─────────────────────────────────────────────────────
function PropertyModal({ property, currentAE, onClose, onSave }) {
  const [form, setForm] = useState({ ...property });
  const canEdit = currentAE === property.ae;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ '--ae-color': AE_COLORS[property.ae] }}>
          <div>
            <div className="modal-title">{property.vanityName || property.address}</div>
            {property.vanityName && <div className="modal-sub">{property.address}</div>}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {!canEdit && (
            <div className="read-only-banner">
              👁️ You can view but not edit {property.ae}'s properties. Select yourself above to edit your own.
            </div>
          )}

          <div className="modal-grid">
            <div className="modal-section">
              <h4>Property Info</h4>
              <div className="info-row"><span>City</span><span>{property.city}, {property.state} {property.zip}</span></div>
              <div className="info-row"><span>Building Type</span><span>{property.buildingType || '—'}</span></div>
              <div className="info-row"><span>Total Units</span><span>{property.totalUnits}</span></div>
              <div className="info-row"><span>Active Units</span><span>{property.activeUnits || 0}</span></div>
              <div className="info-row"><span>Penetration</span><span>{property.penetration || '0%'}</span></div>
              <div className="info-row"><span>Product</span><span>{property.product || '—'}</span></div>
              <div className="info-row"><span>Avg MRC</span><span>{property.avgMrc ? `$${property.avgMrc}` : '—'}</span></div>
              <div className="info-row"><span>Assigned AE</span>
                <span style={{ color: AE_COLORS[property.ae], fontWeight: 600 }}>{property.ae}</span>
              </div>
            </div>

            <div className="modal-section">
              <h4>Owner Contact</h4>
              <label>Vanity Name
                <input disabled={!canEdit} value={form.vanityName} onChange={e => set('vanityName', e.target.value)} />
              </label>
              <label>Owner Name
                <input disabled={!canEdit} value={form.ownerName} onChange={e => set('ownerName', e.target.value)} />
              </label>
              <label>Owner Phone
                <input disabled={!canEdit} value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value)} />
              </label>
              <label>Owner Email
                <input disabled={!canEdit} value={form.ownerEmail} onChange={e => set('ownerEmail', e.target.value)} />
              </label>
            </div>

            <div className="modal-section">
              <h4>Property Manager</h4>
              <label>PM Name
                <input disabled={!canEdit} value={form.pmName} onChange={e => set('pmName', e.target.value)} />
              </label>
              <label>PM Phone
                <input disabled={!canEdit} value={form.pmPhone} onChange={e => set('pmPhone', e.target.value)} />
              </label>
              <label>PM Email
                <input disabled={!canEdit} value={form.pmEmail} onChange={e => set('pmEmail', e.target.value)} />
              </label>
            </div>

            <div className="modal-section">
              <h4>Status & Activity</h4>
              <label>Status
                <select disabled={!canEdit} value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label>Last Contact Date
                <input type="date" disabled={!canEdit} value={form.lastContactDate}
                  onChange={e => set('lastContactDate', e.target.value)} />
              </label>
              <label>Notes
                <textarea disabled={!canEdit} rows={4} value={form.notes}
                  onChange={e => set('notes', e.target.value)} />
              </label>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Property Table ────────────────────────────────────────────────────────────
function PropertyTable({ properties, currentAE, onSelect, onStatusChange }) {
  const [sort, setSort] = useState({ col: 'ae', dir: 1 });
  const [search, setSearch] = useState('');
  const [filterAE, setFilterAE] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterState, setFilterState] = useState('All');
  const [page, setPage] = useState(0);
  const PER_PAGE = 50;

  const states = useMemo(() => ['All', ...Array.from(new Set(properties.map(p => p.state))).sort()], [properties]);

  const filtered = useMemo(() => {
    let rows = properties;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(p =>
        (p.address || '').toLowerCase().includes(q) ||
        (p.vanityName || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.ownerName || '').toLowerCase().includes(q)
      );
    }
    if (filterAE !== 'All') rows = rows.filter(p => p.ae === filterAE);
    if (filterStatus !== 'All') rows = rows.filter(p => (p.status || 'Not Started') === filterStatus);
    if (filterState !== 'All') rows = rows.filter(p => p.state === filterState);
    return [...rows].sort((a, b) => {
      let av = a[sort.col] ?? '', bv = b[sort.col] ?? '';
      if (typeof av === 'number') return (av - bv) * sort.dir;
      return String(av).localeCompare(String(bv)) * sort.dir;
    });
  }, [properties, search, filterAE, filterStatus, filterState, sort]);

  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const toggleSort = col => setSort(s => s.col === col ? { col, dir: -s.dir } : { col, dir: 1 });
  const SortIcon = ({ col }) => sort.col === col ? (sort.dir === 1 ? ' ↑' : ' ↓') : '';

  useEffect(() => setPage(0), [search, filterAE, filterStatus, filterState]);

  return (
    <div className="table-view">
      {/* Filters */}
      <div className="filters">
        <input className="search-input" placeholder="🔍 Search address, name, city..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filterAE} onChange={e => setFilterAE(e.target.value)}>
          <option value="All">All AEs</option>
          {AES.map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterState} onChange={e => setFilterState(e.target.value)}>
          {states.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="result-count">{filtered.length} properties</span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="prop-table">
          <thead>
            <tr>
              {[['address','Address'],['city','City'],['state','ST'],
                ['totalUnits','Units'],['ae','AE'],['status','Status'],
                ['lastContactDate','Last Contact'],['vanityName','Vanity Name']].map(([col, label]) => (
                <th key={col} onClick={() => toggleSort(col)} className="sortable">
                  {label}<SortIcon col={col} />
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(p => {
              const canEdit = currentAE === p.ae;
              return (
                <tr key={p.id} className={`prop-row ${canEdit ? 'editable-row' : ''}`}>
                  <td className="addr-cell">
                    <div className="addr-main">{p.vanityName || p.address}</div>
                    {p.vanityName && <div className="addr-sub">{p.address}</div>}
                  </td>
                  <td>{p.city}</td>
                  <td><span className="state-badge">{p.state}</span></td>
                  <td className="num-cell">{p.totalUnits}</td>
                  <td>
                    <span className="ae-tag" style={{ '--ae-color': AE_COLORS[p.ae] }}>
                      {AE_INITIALS[p.ae]}
                    </span>
                  </td>
                  <td>
                    <StatusPill
                      status={p.status || 'Not Started'}
                      editable={canEdit}
                      onClick={canEdit ? (e) => {
                        e.stopPropagation();
                        const cur = STATUSES.indexOf(p.status || 'Not Started');
                        const next = STATUSES[(cur + 1) % STATUSES.length];
                        onStatusChange(p.id, next);
                      } : undefined}
                    />
                  </td>
                  <td className="date-cell">{p.lastContactDate || '—'}</td>
                  <td>{p.vanityName || <span className="empty">—</span>}</td>
                  <td>
                    <button className="btn-detail" onClick={() => onSelect(p)}>
                      {canEdit ? '✏️ Edit' : '👁️ View'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(0)}>««</button>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
          <span>Page {page + 1} of {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next ›</button>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»»</button>
        </div>
      )}
    </div>
  );
}

// ── My Properties View ────────────────────────────────────────────────────────
function MyView({ properties, currentAE, onSelect, onStatusChange }) {
  const mine = properties.filter(p => p.ae === currentAE);
  const signed = mine.filter(p => p.status === 'Signed').length;
  const units = mine.reduce((s, p) => s + (Number(p.totalUnits) || 0), 0);
  const signedUnits = mine.filter(p => p.status === 'Signed')
    .reduce((s, p) => s + (Number(p.totalUnits) || 0), 0);

  return (
    <div className="my-view">
      <div className="my-kpis">
        <StatBadge label="My Properties" value={mine.length} color={AE_COLORS[currentAE]} />
        <StatBadge label="Signed" value={signed} color="#15803d" />
        <StatBadge label="% Signed" value={`${pct(signed, mine.length)}%`} color={AE_COLORS[currentAE]} />
        <StatBadge label="Total Units" value={units.toLocaleString()} color="#1d4ed8" />
        <StatBadge label="Units Signed" value={signedUnits.toLocaleString()} color="#15803d" />
      </div>
      <div className="status-breakdown">
        {STATUSES.map(s => {
          const count = mine.filter(p => (p.status || 'Not Started') === s).length;
          return (
            <div key={s} className="status-strip" style={{ background: STATUS_META[s].bg }}>
              <StatusPill status={s} />
              <strong style={{ color: STATUS_META[s].color }}>{count}</strong>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                ({pct(count, mine.length)}%)
              </span>
            </div>
          );
        })}
      </div>
      <PropertyTable
        properties={mine}
        currentAE={currentAE}
        onSelect={onSelect}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentAE, setCurrentAE] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [selected, setSelected] = useState(null);
  const [dbError, setDbError] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Load from Supabase, fall back to seed data
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('mdu_properties').select('*');
        if (error || !data || data.length === 0) throw new Error('empty');
        // Map snake_case DB cols back to camelCase
        const mapped = data.map(r => ({
          id: r.id,
          address: r.address,
          ae: r.ae,
          city: r.city,
          state: r.state,
          zip: r.zip,
          totalUnits: r.total_units,
          activeUnits: r.active_units,
          penetration: r.penetration,
          buildingType: r.building_type,
          product: r.product,
          avgMrc: r.avg_mrc,
          vanityName: r.vanity_name || '',
          ownerName: r.owner_name || '',
          ownerPhone: r.owner_phone || '',
          ownerEmail: r.owner_email || '',
          pmName: r.pm_name || '',
          pmPhone: r.pm_phone || '',
          pmEmail: r.pm_email || '',
          status: r.status || 'Not Started',
          lastContactDate: r.last_contact_date || '',
          notes: r.notes || '',
        }));
        setProperties(mapped);
      } catch {
        setDbError(true);
        // Use seed data with defaults
        setProperties(seedData.map(r => ({
          ...r,
          status: r.status || 'Not Started',
          lastContactDate: r.lastContactDate || '',
          notes: r.notes || '',
        })));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveProperty = useCallback(async (updated) => {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (dbError) return; // local only
    setSaving(true);
    try {
      await supabase.from('mdu_properties').upsert({
        id: updated.id,
        address: updated.address,
        ae: updated.ae,
        city: updated.city,
        state: updated.state,
        zip: updated.zip,
        total_units: updated.totalUnits,
        active_units: updated.activeUnits,
        penetration: updated.penetration,
        building_type: updated.buildingType,
        product: updated.product,
        avg_mrc: updated.avgMrc,
        vanity_name: updated.vanityName,
        owner_name: updated.ownerName,
        owner_phone: updated.ownerPhone,
        owner_email: updated.ownerEmail,
        pm_name: updated.pmName,
        pm_phone: updated.pmPhone,
        pm_email: updated.pmEmail,
        status: updated.status,
        last_contact_date: updated.lastContactDate || null,
        notes: updated.notes,
      });
      setLastSaved(new Date());
    } catch (e) {
      console.error('Save error', e);
    } finally {
      setSaving(false);
    }
  }, [dbError]);

  const handleStatusChange = useCallback((id, newStatus) => {
    const prop = properties.find(p => p.id === id);
    if (prop) saveProperty({ ...prop, status: newStatus });
  }, [properties, saveProperty]);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo">MDU<span>TRACKER</span></div>
      <div className="loading-spinner" />
      <div className="loading-text">Loading properties...</div>
    </div>
  );

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo">MDU<span>FIBER</span></div>
          <div className="brand-sub">Access Agreement Tracker</div>
        </div>
        <AESelector selectedAE={currentAE} onSelect={setCurrentAE} />
        <div className="header-right">
          {saving && <span className="save-indicator saving">⟳ Saving...</span>}
          {!saving && lastSaved && <span className="save-indicator saved">✓ Saved {lastSaved.toLocaleTimeString()}</span>}
          {dbError && <span className="save-indicator local">⚠ Local mode (DB not connected)</span>}
        </div>
      </header>

      {/* Nav */}
      <nav className="app-nav">
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'properties', label: '🏢 All Properties' },
          ...(currentAE ? [{ id: 'mine', label: `👤 My Properties` }] : []),
        ].map(t => (
          <button key={t.id} className={`nav-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="app-main">
        {tab === 'dashboard' && <Dashboard properties={properties} />}
        {tab === 'properties' && (
          <PropertyTable
            properties={properties}
            currentAE={currentAE}
            onSelect={setSelected}
            onStatusChange={handleStatusChange}
          />
        )}
        {tab === 'mine' && currentAE && (
          <MyView
            properties={properties}
            currentAE={currentAE}
            onSelect={setSelected}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      {/* Modal */}
      {selected && (
        <PropertyModal
          property={selected}
          currentAE={currentAE}
          onClose={() => setSelected(null)}
          onSave={updated => {
            saveProperty(updated);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
