import React, { useState, useEffect } from 'react';
import { Card, Table, Statistic, Row, Col, Button, message } from 'antd';
import { supabase } from '../config/supabaseClient';
import { formatCurrency } from '../utils/currencyUtils';

/**
 * Componente de Diagnóstico de Ganancias
 * Muestra información detallada sobre ventas y cálculos de ganancias
 * USAR SOLO PARA DEBUGGING - NO DEJAR EN PRODUCCIÓN
 */
const DiagnosticoGanancias = () => {
    const [loading, setLoading] = useState(false);
    const [ventas, setVentas] = useState([]);
    const [resumen, setResumen] = useState({
        totalVentas: 0,
        totalIngresos: 0,
        totalCostos: 0,
        totalGanancias: 0,
        ventasSinCosto: 0
    });

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // Obtener todas las ventas con información de lotes
            const { data, error } = await supabase
                .from('movimientos')
                .select(`
                    id,
                    fecha,
                    cantidad,
                    precio_unitario,
                    total,
                    lotes(costo_compra, precio_venta, codigo_lote),
                    medicamentos(nombre)
                `)
                .eq('tipo_movimiento', 'VENTA')
                .order('fecha', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Procesar datos
            let totalIngresos = 0;
            let totalCostos = 0;
            let totalGanancias = 0;
            let ventasSinCosto = 0;

            const ventasProcesadas = data.map(venta => {
                const cantidadVendida = Math.abs(venta.cantidad);
                const precioVenta = venta.precio_unitario || 0;
                const costoCompra = venta.lotes?.costo_compra || 0;

                const ingresos = precioVenta * cantidadVendida;
                const costos = costoCompra * cantidadVendida;
                const ganancia = (precioVenta - costoCompra) * cantidadVendida;

                totalIngresos += ingresos;
                totalCostos += costos;
                totalGanancias += ganancia;

                if (!costoCompra || costoCompra === 0) {
                    ventasSinCosto++;
                }

                return {
                    ...venta,
                    cantidadVendida,
                    precioVenta,
                    costoCompra,
                    ingresos,
                    costos,
                    ganancia,
                    medicamento: venta.medicamentos?.nombre || 'N/A',
                    lote: venta.lotes?.codigo_lote || 'N/A'
                };
            });

            setVentas(ventasProcesadas);
            setResumen({
                totalVentas: data.length,
                totalIngresos,
                totalCostos,
                totalGanancias,
                ventasSinCosto
            });

        } catch (error) {
            message.error('Error al cargar datos: ' + error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const columns = [
        {
            title: 'Fecha',
            dataIndex: 'fecha',
            key: 'fecha',
            render: (fecha) => new Date(fecha).toLocaleDateString('es-BO'),
            width: 100,
        },
        {
            title: 'Medicamento',
            dataIndex: 'medicamento',
            key: 'medicamento',
        },
        {
            title: 'Lote',
            dataIndex: 'lote',
            key: 'lote',
            width: 100,
        },
        {
            title: 'Cant.',
            dataIndex: 'cantidadVendida',
            key: 'cantidad',
            align: 'center',
            width: 60,
        },
        {
            title: 'Precio Venta',
            dataIndex: 'precioVenta',
            key: 'precioVenta',
            align: 'right',
            render: (val) => formatCurrency(val),
            width: 100,
        },
        {
            title: 'Costo',
            dataIndex: 'costoCompra',
            key: 'costoCompra',
            align: 'right',
            render: (val) => (
                <span style={{ color: val === 0 ? '#ff4d4f' : 'inherit' }}>
                    {formatCurrency(val)}
                </span>
            ),
            width: 100,
        },
        {
            title: 'Ingresos',
            dataIndex: 'ingresos',
            key: 'ingresos',
            align: 'right',
            render: (val) => formatCurrency(val),
            width: 100,
        },
        {
            title: 'Ganancia',
            dataIndex: 'ganancia',
            key: 'ganancia',
            align: 'right',
            render: (val) => (
                <strong style={{ color: '#52c41a' }}>
                    {formatCurrency(val)}
                </strong>
            ),
            width: 100,
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card
                title="🔍 Diagnóstico de Ganancias"
                extra={<Button onClick={cargarDatos} loading={loading}>Actualizar</Button>}
                style={{ marginBottom: 16 }}
            >
                <Row gutter={16}>
                    <Col span={6}>
                        <Statistic
                            title="Total Ventas"
                            value={resumen.totalVentas}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Total Ingresos"
                            value={formatCurrency(resumen.totalIngresos)}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Total Costos"
                            value={formatCurrency(resumen.totalCostos)}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Total Ganancias"
                            value={formatCurrency(resumen.totalGanancias)}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Col>
                </Row>

                {resumen.ventasSinCosto > 0 && (
                    <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 4 }}>
                        ⚠️ <strong>{resumen.ventasSinCosto} ventas</strong> no tienen costo registrado (aparecen en rojo).
                        Esto hace que la ganancia sea igual al precio de venta completo.
                    </div>
                )}
            </Card>

            <Card title="Detalle de Ventas (últimas 50)">
                <Table
                    dataSource={ventas}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    size="small"
                    scroll={{ x: 900 }}
                />
            </Card>

            <Card title="Fórmulas Utilizadas" style={{ marginTop: 16 }}>
                <ul>
                    <li><strong>Ingresos</strong> = Precio de Venta × Cantidad</li>
                    <li><strong>Costos</strong> = Costo de Compra × Cantidad</li>
                    <li><strong>Ganancia</strong> = (Precio de Venta - Costo de Compra) × Cantidad</li>
                    <li><strong>Margen %</strong> = ((Precio Venta - Costo) / Precio Venta) × 100</li>
                </ul>
            </Card>
        </div>
    );
};

export default DiagnosticoGanancias;
