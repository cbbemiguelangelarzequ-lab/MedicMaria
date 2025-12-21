import { supabase } from '../config/supabaseClient';

/**
 * Servicio de Inventario - Maneja todas las operaciones de la base de datos
 */

// ============================================
// MEDICAMENTOS
// ============================================

/**
 * Obtener todos los medicamentos con su stock total
 */
export const getMedicamentos = async () => {
    try {
        const { data, error } = await supabase
            .from('vista_stock_total')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener medicamentos:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Buscar medicamento por código de barras
 */
export const getMedicamentoByBarcode = async (codigoBarras) => {
    try {
        const { data, error } = await supabase
            .from('medicamentos')
            .select('*, categorias(nombre)')
            .eq('codigo_barras', codigoBarras)
            .eq('activo', true)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al buscar medicamento:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Buscar medicamentos por nombre o principio activo
 * ACTUALIZADO: Usa vista_stock_total para obtener stock y precio
 */
export const searchMedicamentos = async (query) => {
    try {
        const { data, error } = await supabase
            .from('vista_stock_total')
            .select('*')
            .or(`nombre.ilike.%${query}%,principio_activo.ilike.%${query}%,codigo_barras.ilike.%${query}%`)
            .order('nombre', { ascending: true })
            .limit(10);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al buscar medicamentos:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Crear nuevo medicamento
 */
export const createMedicamento = async (medicamentoData) => {
    try {
        const { data, error } = await supabase
            .from('medicamentos')
            .insert([medicamentoData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al crear medicamento:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Actualizar medicamento
 */
export const updateMedicamento = async (id, medicamentoData) => {
    try {
        const { data, error } = await supabase
            .from('medicamentos')
            .update(medicamentoData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al actualizar medicamento:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Eliminar medicamento (soft delete)
 */
export const deleteMedicamento = async (id) => {
    try {
        const { data, error } = await supabase
            .from('medicamentos')
            .update({ activo: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al eliminar medicamento:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// LOTES
// ============================================

/**
 * Obtener lotes de un medicamento (ordenados por FEFO)
 */
export const getLotesByMedicamento = async (medicamentoId) => {
    try {
        const { data, error } = await supabase
            .from('lotes')
            .select('*')
            .eq('medicamento_id', medicamentoId)
            .eq('activo', true)
            .gt('stock_actual', 0)
            .order('fecha_vencimiento', { ascending: true }); // FEFO

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener lotes:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Agregar nuevo lote (Entrada de mercancía)
 */
export const addLote = async (loteData) => {
    try {
        // Insertar el lote
        const { data: lote, error: loteError } = await supabase
            .from('lotes')
            .insert([loteData])
            .select()
            .single();

        if (loteError) throw loteError;

        // Registrar movimiento de entrada
        const { error: movimientoError } = await supabase
            .from('movimientos')
            .insert([{
                lote_id: lote.id,
                medicamento_id: loteData.medicamento_id,
                tipo_movimiento: 'ENTRADA',
                cantidad: loteData.stock_actual,
                precio_unitario: loteData.costo_compra,
                total: loteData.costo_compra * loteData.stock_actual,
                observaciones: 'Entrada de mercancía',
            }]);

        if (movimientoError) throw movimientoError;

        return { success: true, data: lote };
    } catch (error) {
        console.error('Error al agregar lote:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Actualizar lote
 */
export const updateLote = async (id, loteData) => {
    try {
        const { data, error } = await supabase
            .from('lotes')
            .update(loteData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al actualizar lote:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Eliminar lote (soft delete)
 */
export const deleteLote = async (id) => {
    try {
        const { data, error } = await supabase
            .from('lotes')
            .update({ activo: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al eliminar lote:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// VENTAS (LÓGICA FEFO)
// ============================================

/**
 * Vender producto con lógica FEFO automática
 */
export const venderProducto = async (medicamentoId, cantidad, usuarioId = null) => {
    try {
        // Llamar a la función de base de datos que implementa FEFO
        const { data, error } = await supabase.rpc('fn_vender_producto', {
            p_medicamento_id: medicamentoId,
            p_cantidad: cantidad,
            p_usuario_id: usuarioId,
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al vender producto:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Vender múltiples productos (carrito de compras)
 */
export const venderCarrito = async (items, usuarioId = null) => {
    try {
        const resultados = [];

        for (const item of items) {
            const resultado = await venderProducto(
                item.medicamento_id,
                item.cantidad,
                usuarioId
            );

            if (!resultado.success) {
                throw new Error(`Error al vender ${item.nombre}: ${resultado.error}`);
            }

            resultados.push(resultado.data);
        }

        return { success: true, data: resultados };
    } catch (error) {
        console.error('Error al vender carrito:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// ALERTAS Y REPORTES
// ============================================

/**
 * Obtener productos con stock bajo
 */
export const getStockBajo = async () => {
    try {
        const { data, error } = await supabase
            .from('vista_stock_bajo')
            .select('*')
            .order('total_disponible', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener stock bajo:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Obtener productos próximos a vencer
 */
export const getProductosPorVencer = async (dias = 90) => {
    try {
        const { data, error } = await supabase
            .from('vista_proximos_vencer')
            .select('*')
            .lte('dias_restantes', dias)
            .order('dias_restantes', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener productos por vencer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Obtener KPIs del dashboard
 */
export const getDashboardKPIs = async () => {
    try {
        // Valor total del inventario
        const { data: lotes, error: lotesError } = await supabase
            .from('lotes')
            .select('stock_actual, precio_venta, costo_compra')
            .eq('activo', true);

        if (lotesError) throw lotesError;

        const valorTotal = lotes.reduce(
            (sum, lote) => sum + (lote.stock_actual * (lote.precio_venta || 0)),
            0
        );

        // Calcular ganancias obtenidas (de ventas realizadas)
        const { data: ventas, error: ventasError } = await supabase
            .from('movimientos')
            .select('cantidad, precio_unitario, lotes(costo_compra)')
            .eq('tipo_movimiento', 'SALIDA');

        if (ventasError) throw ventasError;

        const gananciasObtenidas = ventas.reduce((sum, venta) => {
            const precioVenta = venta.precio_unitario || 0;
            const costoCompra = venta.lotes?.costo_compra || 0;
            const ganancia = (precioVenta - costoCompra) * venta.cantidad;
            return sum + ganancia;
        }, 0);

        // Total de productos
        const { count: totalProductos, error: productosError } = await supabase
            .from('medicamentos')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true);

        if (productosError) throw productosError;

        // Stock bajo
        const { data: stockBajo, error: stockBajoError } = await getStockBajo();
        if (stockBajoError) throw stockBajoError;

        // Por vencer (próximos 30 días)
        const { data: porVencer, error: porVencerError } = await getProductosPorVencer(30);
        if (porVencerError) throw porVencerError;

        return {
            success: true,
            data: {
                valorTotal,
                gananciasObtenidas,
                totalProductos,
                stockBajo: stockBajo?.length || 0,
                porVencer: porVencer?.length || 0,
            },
        };
    } catch (error) {
        console.error('Error al obtener KPIs:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// CATEGORÍAS
// ============================================

/**
 * Obtener todas las categorías
 */
export const getCategorias = async () => {
    try {
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// MOVIMIENTOS (HISTORIAL)
// ============================================

/**
 * Obtener historial de movimientos
 */
export const getMovimientos = async (limit = 50) => {
    try {
        const { data, error } = await supabase
            .from('movimientos')
            .select(`
        *,
        medicamentos(nombre),
        lotes(codigo_lote)
      `)
            .order('fecha', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        return { success: false, error: error.message };
    }
};

export default {
    getMedicamentos,
    getMedicamentoByBarcode,
    searchMedicamentos,
    createMedicamento,
    updateMedicamento,
    deleteMedicamento,
    getLotesByMedicamento,
    addLote,
    updateLote,
    deleteLote,
    venderProducto,
    venderCarrito,
    getStockBajo,
    getProductosPorVencer,
    getDashboardKPIs,
    getCategorias,
    getMovimientos,
};
