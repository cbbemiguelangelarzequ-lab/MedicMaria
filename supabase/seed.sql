-- ============================================
-- FARMACIA PC - DATOS DE PRUEBA (SEED)
-- ============================================

-- Limpiar datos existentes (solo para desarrollo)
TRUNCATE TABLE movimientos, lotes, medicamentos, categorias RESTART IDENTITY CASCADE;

-- ============================================
-- 1. CATEGORÍAS
-- ============================================

INSERT INTO categorias (nombre, descripcion) VALUES
('Analgésicos', 'Medicamentos para aliviar el dolor'),
('Antibióticos', 'Medicamentos para combatir infecciones bacterianas'),
('Antiinflamatorios', 'Medicamentos para reducir la inflamación'),
('Jarabes', 'Medicamentos en forma líquida'),
('Inyectables', 'Medicamentos de administración parenteral'),
('Vitaminas', 'Suplementos vitamínicos y minerales'),
('Antihistamínicos', 'Medicamentos para alergias'),
('Antipiréticos', 'Medicamentos para reducir la fiebre');

-- ============================================
-- 2. MEDICAMENTOS
-- ============================================

INSERT INTO medicamentos (nombre, descripcion, codigo_barras, principio_activo, laboratorio, categoria_id, stock_minimo) VALUES
-- Analgésicos
('Paracetamol 500mg', 'Analgésico y antipirético', '7501234567890', 'Paracetamol', 'Bayer', 1, 10),
('Aspirina 100mg', 'Analgésico y antiagregante plaquetario', '7501234567891', 'Ácido Acetilsalicílico', 'Bayer', 1, 15),
('Tramadol 50mg', 'Analgésico opioide', '7501234567892', 'Tramadol', 'Grünenthal', 1, 5),

-- Antibióticos
('Amoxicilina 500mg', 'Antibiótico de amplio espectro', '7502345678901', 'Amoxicilina', 'GlaxoSmithKline', 2, 20),
('Azitromicina 500mg', 'Antibiótico macrólido', '7502345678902', 'Azitromicina', 'Pfizer', 2, 10),
('Ciprofloxacino 500mg', 'Antibiótico fluoroquinolona', '7502345678903', 'Ciprofloxacino', 'Bayer', 2, 8),

-- Antiinflamatorios
('Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', '7503456789012', 'Ibuprofeno', 'Pfizer', 3, 15),
('Diclofenaco 50mg', 'Antiinflamatorio no esteroideo', '7503456789013', 'Diclofenaco', 'Novartis', 3, 12),
('Naproxeno 250mg', 'Antiinflamatorio no esteroideo', '7503456789014', 'Naproxeno', 'Bayer', 3, 10),

-- Jarabes
('Ambroxol Jarabe 15mg/5ml', 'Expectorante y mucolítico', '7504567890123', 'Ambroxol', 'Boehringer', 4, 8),
('Loratadina Jarabe 5mg/5ml', 'Antihistamínico', '7504567890124', 'Loratadina', 'Schering-Plough', 4, 6),

-- Inyectables
('Diclofenaco Inyectable 75mg', 'Antiinflamatorio inyectable', '7505678901234', 'Diclofenaco', 'Novartis', 5, 10),
('Complejo B Inyectable', 'Vitaminas del complejo B', '7505678901235', 'Complejo B', 'Bayer', 5, 15),

-- Vitaminas
('Vitamina C 1000mg', 'Suplemento de vitamina C', '7506789012345', 'Ácido Ascórbico', 'Nature Made', 6, 20),
('Multivitamínico', 'Complejo multivitamínico', '7506789012346', 'Multivitamínico', 'Centrum', 6, 15),

-- Antihistamínicos
('Loratadina 10mg', 'Antihistamínico de segunda generación', '7507890123456', 'Loratadina', 'Schering-Plough', 7, 12),
('Cetirizina 10mg', 'Antihistamínico de segunda generación', '7507890123457', 'Cetirizina', 'UCB', 7, 10);

-- ============================================
-- 3. LOTES CON DIFERENTES FECHAS DE VENCIMIENTO
-- ============================================

-- Paracetamol - 3 lotes (uno próximo a vencer para testing FEFO)
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7501234567890'), 'L2025-001', '2025-01-15', 25, 3.50, 8.00),  -- CRÍTICO: 26 días
((SELECT id FROM medicamentos WHERE codigo_barras = '7501234567890'), 'L2025-002', '2026-08-20', 50, 3.50, 8.00),  -- NORMAL
((SELECT id FROM medicamentos WHERE codigo_barras = '7501234567890'), 'L2025-003', '2026-12-15', 30, 3.50, 8.00);  -- NORMAL

-- Aspirina - 2 lotes
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7501234567891'), 'L2025-010', '2025-03-10', 40, 2.00, 5.00),  -- ADVERTENCIA: 80 días
((SELECT id FROM medicamentos WHERE codigo_barras = '7501234567891'), 'L2025-011', '2026-06-15', 35, 2.00, 5.00);  -- NORMAL

-- Tramadol - 1 lote (stock bajo)
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7501234567892'), 'L2025-020', '2026-09-30', 3, 8.00, 15.00);  -- STOCK BAJO

-- Amoxicilina - 2 lotes (uno crítico)
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7502345678901'), 'L2025-030', '2025-01-05', 8, 4.00, 12.50),  -- CRÍTICO: 16 días
((SELECT id FROM medicamentos WHERE codigo_barras = '7502345678901'), 'L2025-031', '2026-11-20', 45, 4.00, 12.50); -- NORMAL

-- Azitromicina - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7502345678902'), 'L2025-040', '2026-07-15', 28, 6.50, 18.00);

-- Ciprofloxacino - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7502345678903'), 'L2025-050', '2026-10-30', 22, 5.00, 14.00);

-- Ibuprofeno - 2 lotes (uno advertencia)
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7503456789012'), 'L2025-060', '2025-02-28', 12, 2.50, 6.00),  -- ADVERTENCIA: 70 días
((SELECT id FROM medicamentos WHERE codigo_barras = '7503456789012'), 'L2025-061', '2026-05-10', 38, 2.50, 6.00);  -- NORMAL

-- Diclofenaco - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7503456789013'), 'L2025-070', '2026-04-20', 30, 3.00, 7.50);

-- Naproxeno - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7503456789014'), 'L2025-080', '2026-08-15', 25, 2.80, 6.50);

-- Ambroxol Jarabe - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7504567890123'), 'L2025-090', '2025-12-31', 18, 4.50, 10.00);

-- Loratadina Jarabe - 1 lote (stock bajo)
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7504567890124'), 'L2025-100', '2026-03-25', 4, 3.80, 9.00);  -- STOCK BAJO

-- Diclofenaco Inyectable - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7505678901234'), 'L2025-110', '2026-06-30', 32, 5.50, 12.00);

-- Complejo B Inyectable - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7505678901235'), 'L2025-120', '2026-09-15', 40, 4.00, 9.50);

-- Vitamina C - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7506789012345'), 'L2025-130', '2027-01-20', 60, 2.00, 5.50);

-- Multivitamínico - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7506789012346'), 'L2025-140', '2026-11-10', 45, 3.50, 8.50);

-- Loratadina 10mg - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7507890123456'), 'L2025-150', '2026-07-25', 35, 1.80, 4.50);

-- Cetirizina - 1 lote
INSERT INTO lotes (medicamento_id, codigo_lote, fecha_vencimiento, stock_actual, costo_compra, precio_venta) VALUES
((SELECT id FROM medicamentos WHERE codigo_barras = '7507890123457'), 'L2025-160', '2026-10-05', 28, 2.20, 5.00);

-- ============================================
-- 4. MOVIMIENTOS DE EJEMPLO (HISTORIAL)
-- ============================================

-- Entradas iniciales
INSERT INTO movimientos (lote_id, medicamento_id, tipo_movimiento, cantidad, precio_unitario, total, observaciones) VALUES
((SELECT id FROM lotes WHERE codigo_lote = 'L2025-001'), (SELECT id FROM medicamentos WHERE codigo_barras = '7501234567890'), 'ENTRADA', 50, 3.50, 175.00, 'Compra inicial'),
((SELECT id FROM lotes WHERE codigo_lote = 'L2025-002'), (SELECT id FROM medicamentos WHERE codigo_barras = '7501234567890'), 'ENTRADA', 50, 3.50, 175.00, 'Compra inicial'),
((SELECT id FROM lotes WHERE codigo_lote = 'L2025-030'), (SELECT id FROM medicamentos WHERE codigo_barras = '7502345678901'), 'ENTRADA', 30, 4.00, 120.00, 'Compra inicial');

-- Ventas de ejemplo
INSERT INTO movimientos (lote_id, medicamento_id, tipo_movimiento, cantidad, precio_unitario, total, observaciones) VALUES
((SELECT id FROM lotes WHERE codigo_lote = 'L2025-001'), (SELECT id FROM medicamentos WHERE codigo_barras = '7501234567890'), 'VENTA', -25, 8.00, -200.00, 'Venta al público'),
((SELECT id FROM lotes WHERE codigo_lote = 'L2025-030'), (SELECT id FROM medicamentos WHERE codigo_barras = '7502345678901'), 'VENTA', -22, 12.50, -275.00, 'Venta al público');

-- Ajustes de inventario
INSERT INTO movimientos (lote_id, medicamento_id, tipo_movimiento, cantidad, precio_unitario, total, observaciones) VALUES
((SELECT id FROM lotes WHERE codigo_lote = 'L2025-060'), (SELECT id FROM medicamentos WHERE codigo_barras = '7503456789012'), 'AJUSTE', -8, 6.00, -48.00, 'Ajuste por inventario físico');

-- ============================================
-- RESUMEN DE DATOS CREADOS
-- ============================================

-- Verificar categorías
SELECT 'Categorías creadas:' as resumen, COUNT(*) as total FROM categorias;

-- Verificar medicamentos
SELECT 'Medicamentos creados:' as resumen, COUNT(*) as total FROM medicamentos;

-- Verificar lotes
SELECT 'Lotes creados:' as resumen, COUNT(*) as total FROM lotes;

-- Verificar movimientos
SELECT 'Movimientos registrados:' as resumen, COUNT(*) as total FROM movimientos;

-- Stock total
SELECT 'Stock total de unidades:' as resumen, SUM(stock_actual) as total FROM lotes;

-- Productos con stock bajo
SELECT 'Productos con stock bajo:' as resumen, COUNT(*) as total FROM vista_stock_bajo;

-- Productos próximos a vencer
SELECT 'Productos próximos a vencer (< 90 días):' as resumen, COUNT(*) as total FROM vista_proximos_vencer;

-- ============================================
-- DATOS LISTOS PARA TESTING
-- ============================================

-- Escenarios de prueba disponibles:
-- 1. FEFO: Paracetamol tiene 3 lotes, el primero vence en 26 días
-- 2. Stock Bajo: Tramadol (3 unidades), Loratadina Jarabe (4 unidades)
-- 3. Vencimiento Crítico: Amoxicilina L2025-030 (16 días), Paracetamol L2025-001 (26 días)
-- 4. Vencimiento Advertencia: Aspirina L2025-010 (80 días), Ibuprofeno L2025-060 (70 días)
