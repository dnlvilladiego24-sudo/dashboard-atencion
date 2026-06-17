import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard, { Sidebar } from './Dashboard';
import DataEntry from './DataEntry';
import { BarChart3, LayoutDashboard, PlusCircle } from 'lucide-react';
import './index.css';

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:   { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <AnimatePresence mode="wait">
      {page === 'dashboard' ? (
        <motion.div key="dashboard" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
          <Dashboard onNavigate={setPage} />
        </motion.div>
      ) : (
        <motion.div key="entry" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
          <div className="app-layout">
            {/* Sidebar de DataEntry */}
            <motion.aside
              className="sidebar"
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
                  { id: 'entry',     label: 'Ingresar Datos', icon: <PlusCircle size={18} /> },
                ].map(item => (
                  <motion.li
                    key={item.id}
                    className={`sidebar-nav-item ${page === item.id ? 'active' : ''}`}
                    onClick={() => setPage(item.id)}
                    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.icon}
                    {item.label}
                  </motion.li>
                ))}
              </ul>

              <div className="sidebar-footer">
                <p className="sidebar-footer-text">
                  Conectado a Supabase<br />
                  Datos en tiempo real
                </p>
                <p className="sidebar-credits">
                  Desarrollado por<br />
                  <strong>Daniel Villadiego Abad</strong><br />
                  <strong>Nicolás David Dussan Quiroga</strong>
                </p>
              </div>
            </motion.aside>

            {/* Main */}
            <main className="main-content">
              <div className="topbar">
                <span className="topbar-title">Ingresar Datos</span>
                <div className="topbar-actions">
                  <div className="badge">
                    <span className="badge-dot"></span>
                    En linea
                  </div>
                </div>
              </div>
              <div className="dashboard-content">
                <DataEntry />
              </div>
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
