import React, { useState } from 'react';
import Dashboard, { Sidebar } from './Dashboard';
import DataEntry from './DataEntry';
import {
  BarChart3, LayoutDashboard, PlusCircle, Calendar
} from 'lucide-react';
import './index.css';

function App() {
  const [page, setPage] = useState('dashboard');

  if (page === 'dashboard') {
    return <Dashboard onNavigate={setPage} />;
  }

  // Data Entry page con su propia sidebar
  return (
    <div className="app-layout">
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
          <li className="sidebar-nav-item" onClick={() => setPage('dashboard')}>
            <LayoutDashboard size={18} />
            Dashboard
          </li>
          <li className="sidebar-nav-item active" onClick={() => setPage('entry')}>
            <PlusCircle size={18} />
            Ingresar Datos
          </li>
        </ul>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">
            Conectado a Supabase<br />
            Datos en tiempo real
          </p>
        </div>
      </aside>

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
  );
}

export default App;
