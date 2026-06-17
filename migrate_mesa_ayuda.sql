-- =====================================================================
-- ACTUALIZACIÓN: Mesa de Ayuda + datos 2025
-- Fuente: "Cronograma de atención (2) 1.xlsx"
-- Pegar y ejecutar en: Supabase > SQL Editor > New Query
-- (Revisa los valores antes de ejecutar; son editables)
-- =====================================================================

-- 1) Nueva columna para Mesa de Ayuda (total de correos, como PQRS)
ALTER TABLE registros_diarios
  ADD COLUMN IF NOT EXISTS mesa_correos INTEGER DEFAULT 0;

-- 2) Datos de 2025 (RESUMEN 2025): se actualizan y Mesa de Ayuda
--    reemplaza a Contact Center en este periodo (cc_* quedan en 0).
UPDATE registros_diarios SET
  soporte_correos = 20000,
  soporte_caso1   = 10000,   -- Credenciales
  soporte_caso2   = 5000,    -- Ctas. Bloqueadas
  soporte_caso3   = 5000,    -- Ctas. Eliminadas
  soporte_caso4   = 0,       -- Gratuidad
  pqrs_correos    = 598,
  mesa_correos    = 3000,    -- Mesa de Ayuda (en lugar de Contact Center)
  cc_correos = 0, cc_caso1 = 0, cc_caso2 = 0, cc_caso3 = 0
WHERE mes = 'RESUMEN 2025';

-- 3) Totales de Mesa de Ayuda por mes de 2026.
--    El total mensual se carga en el primer día registrado del mes;
--    el dashboard suma mesa_correos por mes, así que el KPI sale correcto.
--    (Valores tomados de cada hoja del Excel)
UPDATE registros_diarios SET mesa_correos = 2  -- ENERO
  WHERE id = (SELECT id FROM registros_diarios WHERE mes='ENERO'   AND anio=2026 ORDER BY fecha ASC LIMIT 1);
UPDATE registros_diarios SET mesa_correos = 7  -- FEBRERO
  WHERE id = (SELECT id FROM registros_diarios WHERE mes='FEBRERO' AND anio=2026 ORDER BY fecha ASC LIMIT 1);
UPDATE registros_diarios SET mesa_correos = 8  -- MARZO
  WHERE id = (SELECT id FROM registros_diarios WHERE mes='MARZO'   AND anio=2026 ORDER BY fecha ASC LIMIT 1);
UPDATE registros_diarios SET mesa_correos = 7  -- ABRIL
  WHERE id = (SELECT id FROM registros_diarios WHERE mes='ABRIL'   AND anio=2026 ORDER BY fecha ASC LIMIT 1);
UPDATE registros_diarios SET mesa_correos = 5  -- MAYO
  WHERE id = (SELECT id FROM registros_diarios WHERE mes='MAYO'    AND anio=2026 ORDER BY fecha ASC LIMIT 1);
UPDATE registros_diarios SET mesa_correos = 6  -- JUNIO
  WHERE id = (SELECT id FROM registros_diarios WHERE mes='JUNIO'   AND anio=2026 ORDER BY fecha ASC LIMIT 1);

-- 4) Verificación rápida (opcional)
-- SELECT mes, SUM(mesa_correos) AS mesa, SUM(pqrs_correos) AS pqrs, SUM(soporte_correos) AS soporte
-- FROM registros_diarios GROUP BY mes ORDER BY mes;
