import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  LayoutDashboard, Mail, Headset, FileWarning, TrendingUp, Calendar,
  BarChart3, Activity, PlusCircle
} from 'lucide-react';
import { supabase } from './lib/supabase';

const COLORS = {
  indigo: '#6366f1',
  cyan: '#22d3ee',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  violet: '#a78bfa',
};

const PIE_COLORS = [COLORS.indigo, COLORS.cyan, COLORS.rose, COLORS.amber];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">Dia {label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EmptyState = ({ message }) => (
  <div className="empty-state">
    <Activity size={32} strokeWidth={1.5} />
    <p>{message || 'Sin datos para este periodo'}</p>
  </div>
);

export default function Dashboard({ onNavigate }) {
  const [allData, setAllData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: registros, error } = await supabase
      .from('registros_diarios')
      .select('*')
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
      return;
    }

    // Agrupar por mes
    const grouped = {};
    registros.forEach(r => {
      const mesKey = `${r.mes}`;
      if (!grouped[mesKey]) {
        grouped[mesKey] = {
          soporteCorreo: { tendencia: [], casos: {caso1:0,caso2:0,caso3:0,caso4:0}, totalTramitados: 0 },
          contactCenter: { tendencia: [], casos: {caso1:0,caso2:0,caso3:0}, totalTramitados: 0 },
          pqrs: { tendencia: [], totalTramitados: 0 },
        };
      }
      const g = grouped[mesKey];
      const dia = new Date(r.fecha + 'T12:00:00').getDate().toString();

      // Soporte
      g.soporteCorreo.tendencia.push({
        dia,
        correosTramitados: r.soporte_correos || 0,
        caso1: r.soporte_caso1 || 0,
        caso2: r.soporte_caso2 || 0,
        caso3: r.soporte_caso3 || 0,
        caso4: r.soporte_caso4 || 0,
      });
      g.soporteCorreo.totalTramitados += (r.soporte_correos || 0);
      g.soporteCorreo.casos.caso1 += (r.soporte_caso1 || 0);
      g.soporteCorreo.casos.caso2 += (r.soporte_caso2 || 0);
      g.soporteCorreo.casos.caso3 += (r.soporte_caso3 || 0);
      g.soporteCorreo.casos.caso4 += (r.soporte_caso4 || 0);

      // Contact Center
      g.contactCenter.tendencia.push({
        dia,
        correosTramitados: r.cc_correos || 0,
        caso1: r.cc_caso1 || 0,
        caso2: r.cc_caso2 || 0,
        caso3: r.cc_caso3 || 0,
      });
      g.contactCenter.totalTramitados += (r.cc_correos || 0);
      g.contactCenter.casos.caso1 += (r.cc_caso1 || 0);
      g.contactCenter.casos.caso2 += (r.cc_caso2 || 0);
      g.contactCenter.casos.caso3 += (r.cc_caso3 || 0);

      // PQRS
      g.pqrs.tendencia.push({
        dia,
        correosTramitados: r.pqrs_correos || 0,
      });
      g.pqrs.totalTramitados += (r.pqrs_correos || 0);
    });

    // Formatear casos como array para los gráficos
    Object.keys(grouped).forEach(mes => {
      const g = grouped[mes];
      g.soporteCorreo.casos = [
        { name: 'Credenciales', value: g.soporteCorreo.casos.caso1 },
        { name: 'Cuentas Bloqueadas', value: g.soporteCorreo.casos.caso2 },
        { name: 'Cuentas Eliminadas', value: g.soporteCorreo.casos.caso3 },
        { name: 'Gratuidad', value: g.soporteCorreo.casos.caso4 },
      ];
      g.contactCenter.casos = [
        { name: 'Caso 1', value: g.contactCenter.casos.caso1 },
        { name: 'Caso 2', value: g.contactCenter.casos.caso2 },
        { name: 'Caso 3', value: g.contactCenter.casos.caso3 },
      ];
    });

    setAllData(grouped);
    const months = Object.keys(grouped);
    if (months.length > 0) {
      setSelectedMonth(months[months.length - 1]);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0e1a' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <Activity size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>Cargando datos desde Supabase...</p>
        </div>
      </div>
    );
  }

  if (!allData || Object.keys(allData).length === 0) {
    return (
      <div className="app-layout">
        <Sidebar months={[]} selectedMonth="" onSelectMonth={() => {}} onNavigate={onNavigate} activePage="dashboard" />
        <main className="main-content">
          <div className="topbar">
            <span className="topbar-title">Dashboard</span>
          </div>
          <div className="dashboard-content">
            <div className="empty-state" style={{ height: '60vh' }}>
              <PlusCircle size={48} strokeWidth={1.5} />
              <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>No hay datos registrados aun</p>
              <p style={{ fontSize: '0.85rem' }}>Haz clic en "Ingresar Datos" en la barra lateral para comenzar</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const months = Object.keys(allData);
  const data = allData[selectedMonth];
  const { soporteCorreo, contactCenter, pqrs } = data;

  const hasContactData = contactCenter.totalTramitados > 0;
  const hasPQRSData = pqrs.totalTramitados > 0;
  const hasCasosData = soporteCorreo.casos.some(c => c.value > 0);

  return (
    <div className="app-layout">
      <Sidebar months={months} selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} onNavigate={onNavigate} activePage="dashboard" />

      <main className="main-content">
        <div className="topbar">
          <span className="topbar-title">Dashboard &mdash; {selectedMonth} 2026</span>
          <div className="topbar-actions">
            <div className="badge">
              <span className="badge-dot"></span>
              En linea
            </div>
            <div className="month-selector">
              <Calendar size={16} color="#6366f1" />
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card soporte">
              <div className="kpi-header">
                <span className="kpi-label">Soporte Correo</span>
                <div className="kpi-icon soporte"><Mail size={18} /></div>
              </div>
              <div className="kpi-value">{soporteCorreo.totalTramitados.toLocaleString()}</div>
              <span className="kpi-subtitle">
                Correos tramitados
                <span className="kpi-days"><Calendar size={10} /> {soporteCorreo.tendencia.length} dias</span>
              </span>
            </div>

            <div className="kpi-card contact">
              <div className="kpi-header">
                <span className="kpi-label">Contact Center</span>
                <div className="kpi-icon contact"><Headset size={18} /></div>
              </div>
              <div className="kpi-value">{contactCenter.totalTramitados.toLocaleString()}</div>
              <span className="kpi-subtitle">
                Correos tramitados
                <span className="kpi-days"><Calendar size={10} /> {contactCenter.tendencia.length} dias</span>
              </span>
            </div>

            <div className="kpi-card pqrs">
              <div className="kpi-header">
                <span className="kpi-label">PQRS</span>
                <div className="kpi-icon pqrs"><FileWarning size={18} /></div>
              </div>
              <div className="kpi-value">{pqrs.totalTramitados.toLocaleString()}</div>
              <span className="kpi-subtitle">
                Correos tramitados
                <span className="kpi-days"><Calendar size={10} /> {pqrs.tendencia.length} dias</span>
              </span>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            {/* Tendencia Soporte */}
            <div className="chart-card full-width">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Tendencia Diaria: Soporte Correo</div>
                  <div className="chart-subtitle">Volumen de correos tramitados por dia</div>
                </div>
                <span className="chart-tag indigo">Area</span>
              </div>
              <div className="chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={soporteCorreo.tendencia} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="dia" stroke="#475569" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="correosTramitados" name="Total Correos" stroke={COLORS.indigo} fill="url(#gradIndigo)" strokeWidth={2} dot={{ r: 3, fill: COLORS.indigo }} />
                    <Area type="monotone" dataKey="caso1" name="Credenciales" stroke={COLORS.cyan} fill="url(#gradCyan)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribución de Casos */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Distribucion de Casos</div>
                  <div className="chart-subtitle">Soporte Correo por tipo</div>
                </div>
                <span className="chart-tag rose">Donut</span>
              </div>
              <div className="chart-area">
                {hasCasosData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={soporteCorreo.casos.filter(c => c.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={105}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                      >
                        {soporteCorreo.casos.filter(c => c.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#f1f5f9', fontSize: '0.8rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Sin datos de casos para este mes" />
                )}
              </div>
            </div>

            {/* Contact Center */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Contact Center</div>
                  <div className="chart-subtitle">Correos tramitados por dia</div>
                </div>
                <span className="chart-tag violet">Barras</span>
              </div>
              <div className="chart-area">
                {hasContactData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contactCenter.tendencia.filter(d => d.correosTramitados > 0)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="dia" stroke="#475569" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="correosTramitados" name="Correos CC" fill={COLORS.violet} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Sin datos de Contact Center para este mes" />
                )}
              </div>
            </div>

            {/* PQRS */}
            <div className="chart-card full-width">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Tendencia PQRS</div>
                  <div className="chart-subtitle">Peticiones, quejas, reclamos y sugerencias</div>
                </div>
                <span className="chart-tag amber">Linea</span>
              </div>
              <div className="chart-area">
                {hasPQRSData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pqrs.tendencia.filter(d => d.correosTramitados > 0)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="dia" stroke="#475569" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="correosTramitados" name="Correos PQRS" stroke={COLORS.amber} fill="url(#gradAmber)" strokeWidth={2.5} dot={{ r: 3, fill: COLORS.amber }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Sin datos PQRS para este mes" />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ===== SIDEBAR COMPONENT =====
export function Sidebar({ months, selectedMonth, onSelectMonth, onNavigate, activePage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <BarChart3 size={18} color="#fff" />
        </div>
        <div>
          <h1>Atencion Panel</h1>
          <span>Control & Metricas</span>
        </div>
      </div>

      <p className="sidebar-section-title">Navegacion</p>
      <ul className="sidebar-nav">
        <li
          className={`sidebar-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </li>
        <li
          className={`sidebar-nav-item ${activePage === 'entry' ? 'active' : ''}`}
          onClick={() => onNavigate('entry')}
        >
          <PlusCircle size={18} />
          Ingresar Datos
        </li>
      </ul>

      {months.length > 0 && (
        <>
          <p className="sidebar-section-title">Meses Disponibles</p>
          <ul className="sidebar-nav">
            {months.map(month => (
              <li
                key={month}
                className={`sidebar-nav-item ${selectedMonth === month && activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => { onSelectMonth(month); onNavigate('dashboard'); }}
              >
                <Calendar size={18} />
                {month}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="sidebar-footer">
        <p className="sidebar-footer-text">
          Conectado a Supabase<br />
          Datos en tiempo real
        </p>
      </div>
    </aside>
  );
}
