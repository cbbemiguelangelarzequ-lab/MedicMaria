-- ============================================
-- Script para LIMPIAR DATOS de la Base de Datos
-- Mantiene: Categorías
-- Elimina: Medicamentos, Lotes, Movimientos
-- ============================================

-- Eliminar movimientos (primero por las foreign keys)
DELETE FROM movimientos;

-- Eliminar lotes
DELETE FROM lotes;

-- Eliminar medicamentos
DELETE FROM medicamentos;

-- Reiniciar secuencias (IDs) - usando TRUNCATE que es más eficiente
-- TRUNCATE reinicia automáticamente las secuencias
TRUNCATE TABLE movimientos RESTART IDENTITY CASCADE;
TRUNCATE TABLE lotes RESTART IDENTITY CASCADE;
TRUNCATE TABLE medicamentos RESTART IDENTITY CASCADE;

-- Mensaje de confirmación
SELECT 
    'Datos eliminados correctamente' as mensaje,
    (SELECT COUNT(*) FROM categorias) as categorias_restantes,
    (SELECT COUNT(*) FROM medicamentos) as medicamentos_restantes,
    (SELECT COUNT(*) FROM lotes) as lotes_restantes,
    (SELECT COUNT(*) FROM movimientos) as movimientos_restantes;
