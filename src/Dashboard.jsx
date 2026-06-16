import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

/* ─── Animated Counter ─── */
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return count;
}

function AnimatedNumber({ value }) {
  const n = useCountUp(value);
  return <>{n.toLocaleString()}</>;
}

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label, isSoporte }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (isSoporte && data.caso1 !== undefined) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="custom-tooltip"
        >
          <p className="label">Dia {label}</p>
          <p style={{ color: COLORS.indigo, marginBottom: '4px' }}>
            Total Correos: <strong>{data.correosTramitados}</strong>
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
            <p style={{ color: COLORS.cyan, fontSize: '0.75rem' }}>Credenciales: <strong>{data.caso1}</strong></p>
            <p style={{ color: COLORS.amber, fontSize: '0.75rem' }}>Ctas. Bloqueadas: <strong>{data.caso2}</strong></p>
            <p style={{ color: COLORS.rose, fontSize: '0.75rem' }}>Ctas. Eliminadas: <strong>{data.caso3}</strong></p>
            <p style={{ color: COLORS.emerald, fontSize: '0.75rem' }}>Gratuidad: <strong>{data.caso4}</strong></p>
          </div>
        </motion.div>
      );
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="custom-tooltip"
      >
        <p className="label">Dia {label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </motion.div>
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

/* ─── Animation Variants ─── */
const pageVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.25 } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const chartVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── KPI Card ─── */
function KpiCard({ label, value, days, icon, colorClass, delay = 0 }) {
  return (
    <motion.div
      className={`kpi-card ${colorClass}`}
      variants={cardVariants}
      whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <div className={`kpi-icon ${colorClass}`}>{icon}</div>
      </div>
      <div className="kpi-value">
        <AnimatedNumber value={value} />
      </div>
      <span className="kpi-subtitle">
        Correos tramitados
        <span className="kpi-days"><Calendar size={10} /> {days} dias</span>
      </span>
    </motion.div>
  );
}

/* ─── Chart Card ─── */
function ChartCard({ title, subtitle, tag, tagColor, fullWidth, children }) {
  return (
    <motion.div
      className={`chart-card${fullWidth ? ' full-width' : ''}`}
      variants={chartVariants}
      whileHover={{ borderColor: 'rgba(99,102,241,0.35)', transition: { duration: 0.2 } }}
    >
      <div className="chart-header">
        <div>
          <div className="chart-title">{title}</div>
          <div className="chart-subtitle">{subtitle}</div>
        </div>
        <span className={`chart-tag ${tagColor}`}>{tag}</span>
      </div>
      <div className="chart-area">{children}</div>
    </motion.div>
  );
}

/* ─── Dashboard ─── */
export default function Dashboard({ onNavigate }) {
  const [allData, setAllData] = useState(null);
  const [sortedMonths, setSortedMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: registros, error } = await supabase
      .from('registros_diarios')
      .select('*')
      .order('fecha', { ascending: true });

    if (error) { console.error(error); setLoading(false); return; }

    const grouped = {};
    registros.forEach(r => {
      const mesKey = r.mes;
      if (!grouped[mesKey]) {
        grouped[mesKey] = {
          soporteCorreo: { tendencia: [], casos: { caso1: 0, caso2: 0, caso3: 0, caso4: 0 }, totalTramitados: 0 },
          contactCenter: { tendencia: [], casos: { caso1: 0, caso2: 0, caso3: 0 }, totalTramitados: 0 },
          pqrs: { tendencia: [], totalTramitados: 0 },
        };
      }
      const g = grouped[mesKey];
      const dia = new Date(r.fecha + 'T12:00:00').getDate().toString();

      g.soporteCorreo.tendencia.push({ dia, correosTramitados: r.soporte_correos || 0, caso1: r.soporte_caso1 || 0, caso2: r.soporte_caso2 || 0, caso3: r.soporte_caso3 || 0, caso4: r.soporte_caso4 || 0 });
      g.soporteCorreo.totalTramitados += (r.soporte_correos || 0);
      g.soporteCorreo.casos.caso1 += (r.soporte_caso1 || 0);
      g.soporteCorreo.casos.caso2 += (r.soporte_caso2 || 0);
      g.soporteCorreo.casos.caso3 += (r.soporte_caso3 || 0);
      g.soporteCorreo.casos.caso4 += (r.soporte_caso4 || 0);

      g.contactCenter.tendencia.push({ dia, correosTramitados: r.cc_correos || 0, caso1: r.cc_caso1 || 0, caso2: r.cc_caso2 || 0, caso3: r.cc_caso3 || 0 });
      g.contactCenter.totalTramitados += (r.cc_correos || 0);
      g.contactCenter.casos.caso1 += (r.cc_caso1 || 0);
      g.contactCenter.casos.caso2 += (r.cc_caso2 || 0);
      g.contactCenter.casos.caso3 += (r.cc_caso3 || 0);

      g.pqrs.tendencia.push({ dia, correosTramitados: r.pqrs_correos || 0 });
      g.pqrs.totalTramitados += (r.pqrs_correos || 0);
    });

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

    // Ordenar: RESUMEN 2025 primero, luego meses 2026 en orden calendario
    const ORDEN_MESES = ['RESUMEN 2025', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const months = Object.keys(grouped).sort(
      (a, b) => ORDEN_MESES.indexOf(a) - ORDEN_MESES.indexOf(b)
    );

    setSortedMonths(months);

    // Seleccionar el mes mas reciente (ultimo de la lista excepto RESUMEN)
    const mesesReales = months.filter(m => m !== 'RESUMEN 2025');
    if (mesesReales.length > 0) setSelectedMonth(mesesReales[mesesReales.length - 1]);
    else if (months.length > 0) setSelectedMonth(months[0]);

    setLoading(false);
  }

  /* Loading Screen */
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-orb" />
        <div className="loading-content">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          >
            <Activity size={36} color="#6366f1" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            Cargando datos desde Supabase...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!allData || Object.keys(allData).length === 0) {
    return (
      <div className="app-layout">
        <Sidebar months={[]} selectedMonth="" onSelectMonth={() => {}} onNavigate={onNavigate} activePage="dashboard" />
        <main className="main-content">
          <div className="topbar"><span className="topbar-title">Dashboard</span></div>
          <div className="dashboard-content">
            <div className="empty-state" style={{ height: '60vh' }}>
              <PlusCircle size={48} strokeWidth={1.5} />
              <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>No hay datos registrados aun</p>
              <p style={{ fontSize: '0.85rem' }}>Haz clic en "Ingresar Datos" para comenzar</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const months = sortedMonths;
  const data = allData[selectedMonth];
  if (!data) return null;
  const { soporteCorreo, contactCenter, pqrs } = data;
  const hasContactData = contactCenter.totalTramitados > 0;
  const hasPQRSData = pqrs.totalTramitados > 0;
  const hasCasosData = soporteCorreo.casos.some(c => c.value > 0);

  // Si solo hay 1 registro en tendencia, es un mes resumen (sin desglose diario)
  const isSummaryMonth = soporteCorreo.tendencia.length <= 1;

  // Datos para grafica de barras de resumen
  const casosSoporteData = [
    { name: 'Credenciales', value: soporteCorreo.casos.find(c => c.name === 'Credenciales')?.value || 0, color: COLORS.cyan },
    { name: 'Ctas. Bloqueadas', value: soporteCorreo.casos.find(c => c.name === 'Cuentas Bloqueadas')?.value || 0, color: COLORS.amber },
    { name: 'Ctas. Eliminadas', value: soporteCorreo.casos.find(c => c.name === 'Cuentas Eliminadas')?.value || 0, color: COLORS.rose },
    { name: 'Gratuidad', value: soporteCorreo.casos.find(c => c.name === 'Gratuidad')?.value || 0, color: COLORS.emerald },
  ].filter(c => c.value > 0);

  return (
    <div className="app-layout">
      <Sidebar months={months} selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} onNavigate={onNavigate} activePage="dashboard" />

      <main className="main-content">
        <div className="topbar">
          <span className="topbar-title">
            Dashboard &mdash; {selectedMonth === 'RESUMEN 2025' ? '2025 — Total Anual' : `${selectedMonth} 2026`}
          </span>
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

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMonth}
            className="dashboard-content"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* KPIs */}
            <motion.div
              className="kpi-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <KpiCard
                label="Soporte Correo"
                value={soporteCorreo.totalTramitados}
                days={soporteCorreo.tendencia.length}
                icon={<Mail size={18} />}
                colorClass="soporte"
              />
              <KpiCard
                label="Contact Center"
                value={contactCenter.totalTramitados}
                days={contactCenter.tendencia.length}
                icon={<Headset size={18} />}
                colorClass="contact"
              />
              <KpiCard
                label="PQRS"
                value={pqrs.totalTramitados}
                days={pqrs.tendencia.length}
                icon={<FileWarning size={18} />}
                colorClass="pqrs"
              />
            </motion.div>

            {/* ── VISTA RESUMEN (meses sin desglose diario) ── */}
            {isSummaryMonth ? (
              <motion.div
                className="charts-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Banner informativo */}
                <motion.div
                  variants={chartVariants}
                  style={{
                    gridColumn: '1 / -1',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '12px',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#a78bfa',
                    fontSize: '0.85rem',
                  }}
                >
                  <TrendingUp size={18} />
                  <span>
                    <strong>Vista de resumen mensual:</strong> Este periodo no tiene desglose por día.
                    Se muestra el total acumulado del mes completo.
                  </span>
                </motion.div>

                {/* Barras de casos de Soporte */}
                <ChartCard title="Desglose por Tipo de Caso" subtitle="Soporte Correo — total del periodo" tag="Barras" tagColor="indigo" fullWidth>
                  {casosSoporteData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={casosSoporteData}
                        layout="vertical"
                        margin={{ top: 5, right: 40, bottom: 5, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} width={120} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#f1f5f9', fontSize: '0.8rem' }}
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <Bar dataKey="value" name="Casos" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1400} animationEasing="ease-out">
                          {casosSoporteData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState message="Sin desglose de casos para este periodo" />}
                </ChartCard>

                {/* Donut de distribución */}
                <ChartCard title="Distribucion de Casos" subtitle="Soporte Correo por tipo" tag="Donut" tagColor="rose">
                  {hasCasosData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={soporteCorreo.casos.filter(c => c.value > 0)}
                          cx="50%" cy="50%"
                          innerRadius={70} outerRadius={105}
                          paddingAngle={4} dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          isAnimationActive animationBegin={300} animationDuration={1200} animationEasing="ease-out"
                        >
                          {soporteCorreo.casos.filter(c => c.value > 0).map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#f1f5f9', fontSize: '0.8rem' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyState message="Sin datos de casos" />}
                </ChartCard>

                {/* Tarjeta resumen PQRS */}
                <ChartCard title="PQRS del Periodo" subtitle="Total de peticiones, quejas y reclamos" tag="Total" tagColor="amber">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                    <FileWarning size={40} color={COLORS.amber} strokeWidth={1.5} />
                    <div style={{ fontSize: '3.5rem', fontWeight: 800, color: COLORS.amber, lineHeight: 1 }}>
                      <AnimatedNumber value={pqrs.totalTramitados} />
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Correos PQRS tramitados</p>
                  </div>
                </ChartCard>
              </motion.div>

            ) : (

            /* ── VISTA NORMAL (meses con desglose diario) ── */
            <motion.div
              className="charts-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Tendencia Soporte */}
              <ChartCard title="Tendencia Diaria: Soporte Correo" subtitle="Volumen de correos tramitados por dia" tag="Area" tagColor="indigo" fullWidth>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={soporteCorreo.tendencia} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="dia" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip isSoporte={true} />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="correosTramitados" name="Total Correos" stroke={COLORS.indigo} fill="url(#gradIndigo)" strokeWidth={2.5} dot={{ r: 3, fill: COLORS.indigo }} activeDot={{ r: 7, fill: COLORS.indigo, stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={1800} animationEasing="ease-out" />
                    <Area type="monotone" dataKey="caso1" name="Credenciales" stroke={COLORS.cyan} fill="url(#gradCyan)" strokeWidth={1.5} dot={false} activeDot={{ r: 5, fill: COLORS.cyan }} isAnimationActive animationDuration={2200} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Distribución */}
              <ChartCard title="Distribucion de Casos" subtitle="Soporte Correo por tipo" tag="Donut" tagColor="rose">
                {hasCasosData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={soporteCorreo.casos.filter(c => c.value > 0)} cx="50%" cy="50%" innerRadius={70} outerRadius={105} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#475569', strokeWidth: 1 }} isAnimationActive animationBegin={300} animationDuration={1200} animationEasing="ease-out">
                        {soporteCorreo.casos.filter(c => c.value > 0).map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#f1f5f9', fontSize: '0.8rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyState message="Sin datos de casos para este mes" />}
              </ChartCard>

              {/* Contact Center */}
              <ChartCard title="Contact Center" subtitle="Correos tramitados por dia" tag="Barras" tagColor="violet">
                {hasContactData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contactCenter.tendencia.filter(d => d.correosTramitados > 0)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="dia" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="correosTramitados" name="Correos CC" fill={COLORS.violet} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1400} animationEasing="ease-out" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState message="Sin datos de Contact Center para este mes" />}
              </ChartCard>

              {/* PQRS */}
              <ChartCard title="Tendencia PQRS" subtitle="Peticiones, quejas, reclamos y sugerencias" tag="Linea" tagColor="amber" fullWidth>
                {hasPQRSData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pqrs.tendencia.filter(d => d.correosTramitados > 0)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="dia" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="correosTramitados" name="Correos PQRS" stroke={COLORS.amber} fill="url(#gradAmber)" strokeWidth={2.5} dot={{ r: 3, fill: COLORS.amber }} activeDot={{ r: 7, fill: COLORS.amber, stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={1800} animationEasing="ease-out" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyState message="Sin datos PQRS para este mes" />}
              </ChartCard>
            </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ─── SIDEBAR ─── */
export function Sidebar({ months, selectedMonth, onSelectMonth, onNavigate, activePage }) {
  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -260, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <BarChart3 size={18} color="#fff" />
        </div>
        <div>
          <h1>Atencion Panel</h1>
          <span>Control &amp; Metricas</span>
        </div>
      </div>

      <p className="sidebar-section-title">Navegacion</p>
      <ul className="sidebar-nav">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { id: 'entry', label: 'Ingresar Datos', icon: <PlusCircle size={18} /> },
        ].map(item => (
          <motion.li
            key={item.id}
            className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {item.icon}
            {item.label}
          </motion.li>
        ))}
      </ul>

      {months.length > 0 && (
        <>
          {/* Año anterior (RESUMEN 2025) */}
          {months.includes('RESUMEN 2025') && (
            <>
              <p className="sidebar-section-title">Año Anterior</p>
              <ul className="sidebar-nav">
                <motion.li
                  key="RESUMEN 2025"
                  className={`sidebar-nav-item ${selectedMonth === 'RESUMEN 2025' && activePage === 'dashboard' ? 'active' : ''}`}
                  onClick={() => { onSelectMonth('RESUMEN 2025'); onNavigate('dashboard'); }}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <TrendingUp size={18} />
                  2025 — Total anual
                </motion.li>
              </ul>
            </>
          )}

          {/* Meses del año actual */}
          <p className="sidebar-section-title">2026 — Meses</p>
          <ul className="sidebar-nav">
            {months.filter(m => m !== 'RESUMEN 2025').map((month, i) => (
              <motion.li
                key={month}
                className={`sidebar-nav-item ${selectedMonth === month && activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => { onSelectMonth(month); onNavigate('dashboard'); }}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
              >
                <Calendar size={18} />
                {month}
              </motion.li>
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
    </motion.aside>
  );
}
