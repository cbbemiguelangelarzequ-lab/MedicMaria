import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Space, Typography, message, Tag } from 'antd';
import { FileTextOutlined, PrinterOutlined, FileDoneOutlined } from '@ant-design/icons';
import { supabase } from '../config/supabaseClient';
import { formatCurrency } from '../utils/currencyUtils';

const { Title, Text } = Typography;

const HistorialVentas = () => {
    const [loading, setLoading] = useState(false);
    const [ventasAgrupadas, setVentasAgrupadas] = useState([]);
    const [isReciboVisible, setIsReciboVisible] = useState(false);
    const [reciboSeleccionado, setReciboSeleccionado] = useState(null);

    useEffect(() => {
        cargarVentas();
    }, []);

    const cargarVentas = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('movimientos')
                .select(`
                    id,
                    fecha,
                    cantidad,
                    precio_unitario,
                    total,
                    observaciones,
                    lotes(costo_compra, codigo_lote),
                    medicamentos(nombre)
                `)
                .eq('tipo_movimiento', 'VENTA')
                .order('fecha', { ascending: false });

            if (error) throw error;

            // Agrupar ventas por minuto para generar "Recibos" lógicos
            // Ya que en el sistema actual se insertan múltiples filas casi al mismo tiempo cuando es un carrito
            const grupos = {};
            
            data.forEach(mov => {
                // Truncar la fecha al minuto para agrupar (ej: "2023-10-25 14:35")
                const fechaMinuto = new Date(mov.fecha).toISOString().slice(0, 16);
                
                if (!grupos[fechaMinuto]) {
                    grupos[fechaMinuto] = {
                        id_grupo: fechaMinuto,
                        fecha_exacta: mov.fecha,
                        fecha_formateada: new Date(mov.fecha).toLocaleString('es-BO'),
                        items: [],
                        total_venta: 0,
                        ganancia_total: 0
                    };
                }

                const precioVenta = mov.precio_unitario || 0;
                const costoCompra = mov.lotes?.costo_compra || 0;
                const cantidadAbs = Math.abs(mov.cantidad);
                
                grupos[fechaMinuto].items.push({
                    id: mov.id,
                    medicamento: mov.medicamentos?.nombre || mov.observaciones || 'Servicio Médico',
                    lote: mov.lotes?.codigo_lote || '-',
                    cantidad: cantidadAbs,
                    precio: precioVenta,
                    subtotal: precioVenta * cantidadAbs
                });

                grupos[fechaMinuto].total_venta += (precioVenta * cantidadAbs);
                grupos[fechaMinuto].ganancia_total += ((precioVenta - costoCompra) * cantidadAbs);
            });

            // Convertir objeto de grupos a array
            const ventasArray = Object.values(grupos).sort((a, b) => new Date(b.fecha_exacta) - new Date(a.fecha_exacta));
            setVentasAgrupadas(ventasArray);

        } catch (error) {
            console.error('Error al cargar ventas:', error);
            message.error('No se pudo cargar el historial de ventas');
        } finally {
            setLoading(false);
        }
    };

    const verRecibo = (venta) => {
        setReciboSeleccionado(venta);
        setIsReciboVisible(true);
    };

    const imprimirRecibo = () => {
        window.print();
    };

    const columns = [
        {
            title: 'Fecha de Venta',
            dataIndex: 'fecha_formateada',
            key: 'fecha_formateada',
            width: 200,
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Cant. Items',
            key: 'cantidad_items',
            render: (_, record) => <Tag color="blue">{record.items.length} productos</Tag>
        },
        {
            title: 'Total Cobrado',
            dataIndex: 'total_venta',
            key: 'total_venta',
            render: (total) => <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>{formatCurrency(total)}</Text>
        },
        {
            title: 'Ganancia',
            dataIndex: 'ganancia_total',
            key: 'ganancia_total',
            render: (ganancia) => <Text type="success">{formatCurrency(ganancia)}</Text>
        },
        {
            title: 'Acciones',
            key: 'acciones',
            align: 'center',
            render: (_, record) => (
                <Button 
                    type="primary" 
                    icon={<FileTextOutlined />} 
                    size="small"
                    onClick={() => verRecibo(record)}
                >
                    Ver Recibo
                </Button>
            )
        }
    ];

    return (
        <div>
            <Card style={{ marginBottom: 24, borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#1890ff', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex' }}>
                            <FileDoneOutlined style={{ fontSize: '24px' }} />
                        </div>
                        <h2 style={{ margin: 0, color: '#2A3038', fontWeight: 600 }}>Historial de Ventas</h2>
                    </div>
                    <Button onClick={cargarVentas}>Actualizar Historial</Button>
                </div>
            </Card>

            <Card style={{ borderRadius: '12px', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                <Table 
                    columns={columns} 
                    dataSource={ventasAgrupadas} 
                    rowKey="id_grupo"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                />
            </Card>

            {/* MODAL DEL RECIBO */}
            <Modal
                title="Detalle de Venta"
                open={isReciboVisible}
                onCancel={() => setIsReciboVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsReciboVisible(false)}>
                        Cerrar
                    </Button>,
                    <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={imprimirRecibo}>
                        Imprimir Recibo
                    </Button>
                ]}
                width={400}
                centered
            >
                {reciboSeleccionado && (
                    <div id="printable-receipt" style={{ padding: '20px', border: '1px dashed #d9d9d9', borderRadius: '8px', background: '#fafafa' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>CLÍNICA MARIA</Title>
                            <Text type="secondary" style={{ fontSize: '12px' }}>Recibo de Venta / Dispensación</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>Fecha: {reciboSeleccionado.fecha_formateada}</Text>
                        </div>

                        <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: '10px', paddingBottom: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                <span>Cant x Prod</span>
                                <span>Subtotal</span>
                            </div>
                        </div>

                        {reciboSeleccionado.items.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <div>
                                    <span>{item.cantidad} x {item.medicamento}</span>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '11px' }}>Lote: {item.lote}</Text>
                                </div>
                                <span>{formatCurrency(item.subtotal)}</span>
                            </div>
                        ))}

                        <div style={{ borderTop: '2px dashed #d9d9d9', marginTop: '15px', paddingTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                                <span>TOTAL:</span>
                                <span>{formatCurrency(reciboSeleccionado.total_venta)}</span>
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>¡Gracias por su preferencia!</Text>
                        </div>
                    </div>
                )}
            </Modal>
            
            {/* ESTILOS PARA IMPRESIÓN */}
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        border: none !important;
                        background: white !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default HistorialVentas;
