-- ============================================
-- NUEVAS FUNCIONALIDADES - Ejecutar en Supabase SQL Editor
-- 1. Foto de perfil para pacientes
-- 2. Nombre del paciente en movimientos de venta
-- 3. Vista de ventas del día
-- ============================================

-- 1. Agregar columna foto_url a pacientes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Agregar nombre_paciente a movimientos (para registrar a quién se vendió)
ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS paciente_nombre TEXT;

-- 3. Crear bucket de storage para fotos de pacientes
INSERT INTO storage.buckets (id, name, public)
VALUES ('pacientes-fotos', 'pacientes-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Políticas de Storage (sin IF NOT EXISTS, que no es soportado en CREATE POLICY)
-- Primero las eliminamos si existen, luego las creamos limpiamente.
DROP POLICY IF EXISTS "Fotos públicas" ON storage.objects;
DROP POLICY IF EXISTS "Subir fotos" ON storage.objects;
DROP POLICY IF EXISTS "Actualizar fotos" ON storage.objects;
DROP POLICY IF EXISTS "Eliminar fotos" ON storage.objects;

-- Leer fotos públicamente
CREATE POLICY "Fotos públicas" ON storage.objects
    FOR SELECT USING (bucket_id = 'pacientes-fotos');

-- Subir fotos
CREATE POLICY "Subir fotos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'pacientes-fotos');

-- Actualizar fotos
CREATE POLICY "Actualizar fotos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'pacientes-fotos');

-- Eliminar fotos
CREATE POLICY "Eliminar fotos" ON storage.objects
    FOR DELETE USING (bucket_id = 'pacientes-fotos');

-- 5. Vista de ventas del día con nombre de paciente
CREATE OR REPLACE VIEW vista_ventas_hoy AS
SELECT 
    mv.id,
    mv.fecha,
    m.nombre AS medicamento,
    m.principio_activo,
    ABS(mv.cantidad) AS cantidad_vendida,
    mv.precio_unitario,
    ABS(mv.cantidad) * mv.precio_unitario AS total_linea,
    mv.paciente_nombre,
    mv.observaciones,
    l.codigo_lote
FROM movimientos mv
LEFT JOIN medicamentos m ON mv.medicamento_id = m.id
LEFT JOIN lotes l ON mv.lote_id = l.id
WHERE mv.tipo_movimiento = 'VENTA'
  AND mv.medicamento_id IS NOT NULL
  AND DATE(mv.fecha AT TIME ZONE 'America/La_Paz') = CURRENT_DATE
ORDER BY mv.fecha DESC;
