-- =============================================
-- SQL para crear la tabla en Supabase
-- Copia y pega esto en: Supabase > SQL Editor > New Query
-- =============================================

-- Tabla principal de registros diarios
CREATE TABLE IF NOT EXISTS registros_diarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  mes TEXT NOT NULL,
  anio INTEGER NOT NULL DEFAULT 2026,
  
  -- Soporte Correo
  soporte_correos INTEGER DEFAULT 0,
  soporte_caso1 INTEGER DEFAULT 0,
  soporte_caso2 INTEGER DEFAULT 0,
  soporte_caso3 INTEGER DEFAULT 0,
  soporte_caso4 INTEGER DEFAULT 0,
  
  -- Contact Center
  cc_correos INTEGER DEFAULT 0,
  cc_caso1 INTEGER DEFAULT 0,
  cc_caso2 INTEGER DEFAULT 0,
  cc_caso3 INTEGER DEFAULT 0,
  
  -- PQRS
  pqrs_correos INTEGER DEFAULT 0,

  -- Mesa de Ayuda
  mesa_correos INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar registros duplicados para el mismo día
  UNIQUE(fecha)
);

-- Índice para consultas por mes (rendimiento)
CREATE INDEX IF NOT EXISTS idx_registros_mes ON registros_diarios(mes, anio);

-- Habilitar Row Level Security (requerido por Supabase)
ALTER TABLE registros_diarios ENABLE ROW LEVEL SECURITY;

-- Política: cualquier persona puede leer (sin login)
CREATE POLICY "Lectura pública" ON registros_diarios
  FOR SELECT USING (true);

-- Política: cualquier persona puede insertar (sin login)
CREATE POLICY "Inserción pública" ON registros_diarios
  FOR INSERT WITH CHECK (true);

-- Política: cualquier persona puede actualizar (sin login)
CREATE POLICY "Actualización pública" ON registros_diarios
  FOR UPDATE USING (true);

-- Política: cualquier persona puede eliminar (sin login)
CREATE POLICY "Eliminación pública" ON registros_diarios
  FOR DELETE USING (true);
