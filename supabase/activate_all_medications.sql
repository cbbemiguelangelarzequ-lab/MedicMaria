-- ============================================
-- ACTIVAR TODOS LOS MEDICAMENTOS
-- ============================================
-- Este script activa todos los medicamentos en la base de datos
-- para que aparezcan en el inventario de la aplicación

UPDATE medicamentos 
SET activo = true 
WHERE activo = false OR activo IS NULL;

-- Verificar cuántos medicamentos están activos ahora
SELECT 
    COUNT(*) as total_medicamentos,
    COUNT(*) FILTER (WHERE activo = true) as medicamentos_activos,
    COUNT(*) FILTER (WHERE activo = false OR activo IS NULL) as medicamentos_inactivos
FROM medicamentos;
