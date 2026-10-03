-- ============================================
-- MIGRACIÓN: Eliminar campo codigo_barras
-- ============================================
-- Este script elimina el campo codigo_barras de la tabla medicamentos
-- y su restricción de unicidad asociada
-- NOTA: Usa CASCADE porque las vistas vista_stock_total y vista_stock_bajo
-- dependen de esta columna y serán recreadas automáticamente

-- Eliminar el índice de código de barras
DROP INDEX IF EXISTS idx_medicamentos_codigo_barras;

-- Eliminar la restricción única
ALTER TABLE medicamentos DROP CONSTRAINT IF EXISTS medicamentos_codigo_barras_key;

-- Eliminar la columna codigo_barras (CASCADE eliminará las vistas dependientes)
ALTER TABLE medicamentos DROP COLUMN IF EXISTS codigo_barras CASCADE;

-- ============================================
-- RECREAR VISTAS SIN CODIGO_BARRAS
-- ============================================

-- Vista: Stock total por medicamento (suma de todos los lotes)
CREATE OR REPLACE VIEW vista_stock_total AS
SELECT 
    m.id,
    m.nombre,
    m.principio_activo,
    m.laboratorio,
    c.nombre as categoria,
    m.categoria_id,
    m.stock_minimo,
    COALESCE(SUM(l.stock_actual), 0) as total_disponible,
    MIN(l.fecha_vencimiento) as proximo_vencimiento,
    MIN(l.precio_venta) as precio_venta,
    COUNT(l.id) FILTER (WHERE l.activo = TRUE) as cantidad_lotes_activos,
    -- Semáforo de stock
    CASE 
        WHEN COALESCE(SUM(l.stock_actual), 0) < m.stock_minimo THEN 'BAJO'
        WHEN COALESCE(SUM(l.stock_actual), 0) < m.stock_minimo * 1.5 THEN 'MEDIO'
        ELSE 'ALTO'
    END as estado_stock,
    -- Semáforo de vencimiento
    CASE 
        WHEN MIN(l.fecha_vencimiento) - CURRENT_DATE < 30 THEN 'CRITICO'
        WHEN MIN(l.fecha_vencimiento) - CURRENT_DATE < 90 THEN 'ADVERTENCIA'
        ELSE 'NORMAL'
    END as estado_vencimiento
FROM medicamentos m
LEFT JOIN lotes l ON m.id = l.medicamento_id AND l.activo = TRUE
LEFT JOIN categorias c ON m.categoria_id = c.id
WHERE m.activo = TRUE
GROUP BY m.id, m.nombre, m.principio_activo, m.laboratorio, c.nombre, m.categoria_id, m.stock_minimo;

-- Vista: Productos con stock bajo
CREATE OR REPLACE VIEW vista_stock_bajo AS
SELECT * FROM vista_stock_total
WHERE total_disponible < stock_minimo
ORDER BY total_disponible ASC;

-- Verificar que la columna fue eliminada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'medicamentos' 
ORDER BY ordinal_position;
