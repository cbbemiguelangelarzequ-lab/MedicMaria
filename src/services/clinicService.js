import { supabase } from '../config/supabaseClient';

/**
 * Servicio Clínico - Maneja pacientes, consultas y recetas
 */

// ============================================
// PACIENTES
// ============================================

export const getPacientes = async () => {
    try {
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .eq('activo', true)
            .order('apellidos', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        return { success: false, error: error.message };
    }
};

export const getPacienteById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener paciente:', error);
        return { success: false, error: error.message };
    }
};

export const createPaciente = async (pacienteData) => {
    try {
        const { data, error } = await supabase
            .from('pacientes')
            .insert([pacienteData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al crear paciente:', error);
        return { success: false, error: error.message };
    }
};

export const updatePaciente = async (id, pacienteData) => {
    try {
        const { data, error } = await supabase
            .from('pacientes')
            .update(pacienteData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al actualizar paciente:', error);
        return { success: false, error: error.message };
    }
};

export const deletePaciente = async (id) => {
    try {
        // Hacemos un soft delete (solo lo marcamos como inactivo) 
        // para no perder el historial de consultas asociadas.
        const { data, error } = await supabase
            .from('pacientes')
            .update({ activo: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al eliminar paciente:', error);
        return { success: false, error: error.message };
    }
};

export const searchPacientes = async (query) => {
    try {
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .or(`nombre.ilike.%${query}%,apellidos.ilike.%${query}%`)
            .eq('activo', true)
            .order('apellidos', { ascending: true })
            .limit(10);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al buscar pacientes:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// CONSULTAS MÉDICAS
// ============================================

export const getConsultasByPaciente = async (pacienteId) => {
    try {
        const { data, error } = await supabase
            .from('consultas_medicas')
            .select(`
                *,
                recetas_medicamentos (
                    id,
                    medicamento_id,
                    medicamento_externo,
                    cantidad,
                    dosis,
                    frecuencia,
                    duracion,
                    indicaciones_adicionales,
                    medicamentos (
                        nombre,
                        principio_activo
                    )
                )
            `)
            .eq('paciente_id', pacienteId)
            .order('fecha_consulta', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener consultas:', error);
        return { success: false, error: error.message };
    }
};

export const createConsulta = async (consultaData, recetasData = []) => {
    try {
        // 1. Crear la consulta
        const { data: consulta, error: consultaError } = await supabase
            .from('consultas_medicas')
            .insert([consultaData])
            .select()
            .single();

        if (consultaError) throw consultaError;

        // 2. Si hay recetas, crearlas vinculadas a la consulta
        let recetasInsertadas = [];
        if (recetasData && recetasData.length > 0) {
            const recetasToInsert = recetasData.map(r => ({
                ...r,
                consulta_id: consulta.id
            }));

            const { data: recetas, error: recetasError } = await supabase
                .from('recetas_medicamentos')
                .insert(recetasToInsert)
                .select(`
                    *,
                    medicamentos (nombre, principio_activo)
                `);

            if (recetasError) throw recetasError;
            recetasInsertadas = recetas;
        }

        return { 
            success: true, 
            data: { 
                ...consulta, 
                recetas_medicamentos: recetasInsertadas 
            } 
        };
    } catch (error) {
        console.error('Error al crear consulta:', error);
        return { success: false, error: error.message };
    }
};

export default {
    getPacientes,
    getPacienteById,
    createPaciente,
    updatePaciente,
    deletePaciente,
    searchPacientes,
    getConsultasByPaciente,
    createConsulta,
};
