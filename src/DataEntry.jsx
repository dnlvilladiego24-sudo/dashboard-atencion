import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Save, CheckCircle, AlertCircle, CalendarDays, Mail, Headset, FileWarning, Loader2 } from 'lucide-react';

const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

function getTodayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getMesFromDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return MESES[d.getMonth()];
}

function getAnioFromDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').getFullYear();
}

export default function DataEntry() {
  const [fecha, setFecha] = useState(getTodayStr());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [statusMsg, setStatusMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [existingId, setExistingId] = useState(null);

  const [form, setForm] = useState({
    soporte_correos: '',
    soporte_caso1: '',
    soporte_caso2: '',
    soporte_caso3: '',
    soporte_caso4: '',
    cc_correos: '',
    cc_caso1: '',
    cc_caso2: '',
    cc_caso3: '',
    pqrs_correos: '',
  });

  // Verificar si ya existe un registro para la fecha seleccionada
  useEffect(() => {
    async function checkExisting() {
      setStatus(null);
      const { data, error } = await supabase
        .from('registros_diarios')
        .select('*')
        .eq('fecha', fecha)
        .maybeSingle();

      if (data) {
        setIsEditing(true);
        setExistingId(data.id);
        setForm({
          soporte_correos: data.soporte_correos || '',
          soporte_caso1: data.soporte_caso1 || '',
          soporte_caso2: data.soporte_caso2 || '',
          soporte_caso3: data.soporte_caso3 || '',
          soporte_caso4: data.soporte_caso4 || '',
          cc_correos: data.cc_correos || '',
          cc_caso1: data.cc_caso1 || '',
          cc_caso2: data.cc_caso2 || '',
          cc_caso3: data.cc_caso3 || '',
          pqrs_correos: data.pqrs_correos || '',
        });
      } else {
        setIsEditing(false);
        setExistingId(null);
        setForm({
          soporte_correos: '',
          soporte_caso1: '',
          soporte_caso2: '',
          soporte_caso3: '',
          soporte_caso4: '',
          cc_correos: '',
          cc_caso1: '',
          cc_caso2: '',
          cc_caso3: '',
          pqrs_correos: '',
        });
      }
    }
    checkExisting();
  }, [fecha]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    const record = {
      fecha,
      mes: getMesFromDate(fecha),
      anio: getAnioFromDate(fecha),
      soporte_correos: parseInt(form.soporte_correos) || 0,
      soporte_caso1: parseInt(form.soporte_caso1) || 0,
      soporte_caso2: parseInt(form.soporte_caso2) || 0,
      soporte_caso3: parseInt(form.soporte_caso3) || 0,
      soporte_caso4: parseInt(form.soporte_caso4) || 0,
      cc_correos: parseInt(form.cc_correos) || 0,
      cc_caso1: parseInt(form.cc_caso1) || 0,
      cc_caso2: parseInt(form.cc_caso2) || 0,
      cc_caso3: parseInt(form.cc_caso3) || 0,
      pqrs_correos: parseInt(form.pqrs_correos) || 0,
      updated_at: new Date().toISOString(),
    };

    // Usamos upsert para que, si ya existe la fecha, lo actualice automáticamente
    const result = await supabase
      .from('registros_diarios')
      .upsert(record, { onConflict: 'fecha' });

    setSaving(false);

    if (result.error) {
      setStatus('error');
      setStatusMsg(`Error: ${result.error.message}`);
    } else {
      setStatus('success');
      setStatusMsg(isEditing ? 'Registro actualizado correctamente' : 'Registro guardado correctamente');
      setIsEditing(true);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const mesActual = getMesFromDate(fecha);
  const diaNum = new Date(fecha + 'T12:00:00').getDate();

  return (
    <div className="data-entry-page">
      <div className="entry-header">
        <h2>Ingresar Datos del Dia</h2>
        <p className="entry-subtitle">Registra las metricas diarias de atencion</p>
      </div>

      {/* Status Messages */}
      {status === 'success' && (
        <div className="status-msg success">
          <CheckCircle size={18} /> {statusMsg}
        </div>
      )}
      {status === 'error' && (
        <div className="status-msg error">
          <AlertCircle size={18} /> {statusMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Fecha */}
        <div className="form-section">
          <div className="form-section-header">
            <CalendarDays size={18} />
            <span>Fecha del Registro</span>
            {isEditing && <span className="edit-badge">Editando registro existente</span>}
          </div>
          <div className="form-row">
            <div className="form-field" style={{ maxWidth: '280px' }}>
              <label>Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
              <span className="form-hint">Dia {diaNum} de {mesActual}</span>
            </div>
          </div>
        </div>

        {/* Soporte Correo */}
        <div className="form-section">
          <div className="form-section-header soporte">
            <Mail size={18} />
            <span>Soporte Correo</span>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Total Correos Tramitados</label>
              <input type="number" min="0" placeholder="0"
                value={form.soporte_correos}
                onChange={(e) => handleChange('soporte_correos', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Caso 1: Credenciales</label>
              <input type="number" min="0" placeholder="0"
                value={form.soporte_caso1}
                onChange={(e) => handleChange('soporte_caso1', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Caso 2: Ctas. Bloqueadas</label>
              <input type="number" min="0" placeholder="0"
                value={form.soporte_caso2}
                onChange={(e) => handleChange('soporte_caso2', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Caso 3: Ctas. Eliminadas</label>
              <input type="number" min="0" placeholder="0"
                value={form.soporte_caso3}
                onChange={(e) => handleChange('soporte_caso3', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Caso 4: Gratuidad</label>
              <input type="number" min="0" placeholder="0"
                value={form.soporte_caso4}
                onChange={(e) => handleChange('soporte_caso4', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Contact Center */}
        <div className="form-section">
          <div className="form-section-header contact">
            <Headset size={18} />
            <span>Contact Center</span>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Total Correos Tramitados</label>
              <input type="number" min="0" placeholder="0"
                value={form.cc_correos}
                onChange={(e) => handleChange('cc_correos', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Caso 1</label>
              <input type="number" min="0" placeholder="0"
                value={form.cc_caso1}
                onChange={(e) => handleChange('cc_caso1', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Caso 2</label>
              <input type="number" min="0" placeholder="0"
                value={form.cc_caso2}
                onChange={(e) => handleChange('cc_caso2', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Caso 3</label>
              <input type="number" min="0" placeholder="0"
                value={form.cc_caso3}
                onChange={(e) => handleChange('cc_caso3', e.target.value)} />
            </div>
          </div>
        </div>

        {/* PQRS */}
        <div className="form-section">
          <div className="form-section-header pqrs">
            <FileWarning size={18} />
            <span>PQRS</span>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Total Correos Tramitados</label>
              <input type="number" min="0" placeholder="0"
                value={form.pqrs_correos}
                onChange={(e) => handleChange('pqrs_correos', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            {saving ? 'Guardando...' : isEditing ? 'Actualizar Registro' : 'Guardar Registro'}
          </button>
        </div>
      </form>
    </div>
  );
}
