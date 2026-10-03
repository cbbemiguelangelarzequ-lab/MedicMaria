import { createClient } from '@supabase/supabase-js';

// Obtener las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Faltan las variables de entorno de Supabase');
  console.error('Por favor, crea un archivo .env con:');
  console.error('VITE_SUPABASE_URL=tu_url');
  console.error('VITE_SUPABASE_ANON_KEY=tu_key');
}

// Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper para manejar errores de Supabase
export const handleSupabaseError = (error) => {
  if (error) {
    console.error('Error de Supabase:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
  return { success: true };
};

export default supabase;
