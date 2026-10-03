-- ============================================
-- MÓDULO CLÍNICO - PACIENTES Y CONSULTAS
-- ============================================

-- 1. TABLA DE PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    sexo TEXT CHECK (sexo IN ('M', 'F', 'Otro')),
    alergias TEXT, -- Información importante en formato texto
    antecedentes_medicos TEXT,
    tipo_sangre TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE CONSULTAS MÉDICAS
-- Registro de cada visita del paciente
CREATE TABLE IF NOT EXISTS consultas_medicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
    motivo_consulta TEXT NOT NULL,
    sintomas TEXT,
    diagnostico TEXT,
    observaciones TEXT,
    -- Signos vitales (Opcionales pero útiles)
    peso DECIMAL(5,2),
    talla DECIMAL(5,2),
    presion_arterial TEXT,
    temperatura DECIMAL(4,2),
    -- Metadatos
    costo_total DECIMAL(10,2) DEFAULT 0.00,
    fecha_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado TEXT DEFAULT 'COMPLETADA', -- PENDIENTE, COMPLETADA, CANCELADA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE RECETAS (VINCULADA A INVENTARIO)
-- Detalle de medicamentos recetados en una consulta
CREATE TABLE IF NOT EXISTS recetas_medicamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consulta_id UUID REFERENCES consultas_medicas(id) ON DELETE CASCADE NOT NULL,
    medicamento_id UUID REFERENCES medicamentos(id) ON DELETE SET NULL, -- Enlaza con el inventario actual
    medicamento_externo TEXT, -- Por si receta algo que no tiene en su farmacia
    cantidad INT NOT NULL DEFAULT 1,
    dosis TEXT NOT NULL,      -- Ej: "500mg"
    frecuencia TEXT NOT NULL, -- Ej: "Cada 8 horas"
    duracion TEXT NOT NULL,   -- Ej: "Por 5 días"
    indicaciones_adicionales TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRIGGERS PARA ACTUALIZAR FECHAS
-- ============================================

-- Trigger para pacientes
CREATE TRIGGER update_pacientes_updated_at
    BEFORE UPDATE ON pacientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para consultas
CREATE TRIGGER update_consultas_updated_at
    BEFORE UPDATE ON consultas_medicas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes(nombre, apellidos);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas_medicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_fecha ON consultas_medicas(fecha_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_recetas_consulta ON recetas_medicamentos(consulta_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Desactivar RLS para permitir operaciones desde el frontend sin autenticación compleja
-- Si deseas habilitar RLS en el futuro, puedes usar ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultas_medicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE recetas_medicamentos DISABLE ROW LEVEL SECURITY;
