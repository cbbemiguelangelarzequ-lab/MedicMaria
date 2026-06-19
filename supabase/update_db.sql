-- Actualización de la base de datos (Ejecutar en Supabase SQL Editor)
ALTER TABLE consultas_medicas ADD COLUMN IF NOT EXISTS costo_total DECIMAL(10,2) DEFAULT 0.00;

-- Opcional: Eliminar la restricción UNIQUE del dni si ya no la usas y causa el límite de pacientes.
-- Esto asegura que puedas crear más pacientes sin que choque la restricción.
ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS pacientes_dni_key;
