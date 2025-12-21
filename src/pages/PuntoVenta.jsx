import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Table,
    Button,
    InputNumber,
    Space,
    message,
    Modal,
    Statistic,
    Alert,
    Divider,
} from 'antd';
import {
    DeleteOutlined,
    PlusOutlined,
    MinusOutlined,
    ShoppingCartOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import BarcodeScanner from '../components/BarcodeScanner';
import ExpirationBadge from '../components/ExpirationBadge';
import { searchMedicamentos, venderCarrito, getLotesByMedicamento } from '../services/inventoryService';
import { getExpirationStatus } from '../utils/expirationUtils';
import { formatCurrency } from '../utils/currencyUtils';

const CARRITO_STORAGE_KEY = 'farmacia_carrito';

const PuntoVenta = () => {
    // Cargar carrito desde localStorage al iniciar
    const [carrito, setCarrito] = useState(() => {
        try {
            const savedCarrito = localStorage.getItem(CARRITO_STORAGE_KEY);
            return savedCarrito ? JSON.parse(savedCarrito) : [];
        } catch (error) {
            console.error('Error al cargar carrito:', error);
            return [];
        }
    });

    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Guardar carrito en localStorage cada vez que cambie
    useEffect(() => {
        try {
            localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(carrito));
        } catch (error) {
            console.error('Error al guardar carrito:', error);
        }
    }, [carrito]);

    const handleScan = async (scannedData) => {
        try {
            setLoading(true);
            let medicamento = null;

            if (scannedData.item) {
                medicamento = scannedData.item;
            }

            if (medicamento) {
                const lotesResult = await getLotesByMedicamento(medicamento.id);
                if (lotesResult.success && lotesResult.data.length > 0) {
                    const primerLote = lotesResult.data[0];
                    const stockDisponible = lotesResult.data.reduce((sum, lote) => sum + lote.stock_actual, 0);

                    const itemExistente = carrito.find((item) => item.medicamento_id === medicamento.id);

                    if (itemExistente) {
                        if (itemExistente.cantidad < stockDisponible) {
                            updateCantidad(medicamento.id, itemExistente.cantidad + 1);
                        } else {
                            message.warning('No hay más stock disponible');
                        }
                    } else {
                        const nuevoItem = {
                            medicamento_id: medicamento.id,
                            nombre: medicamento.nombre,
                            precio_venta: primerLote.precio_venta || 0,
                            cantidad: 1,
                            stock_disponible: stockDisponible,
                            fecha_vencimiento: primerLote.fecha_vencimiento,
                        };
                        setCarrito([...carrito, nuevoItem]);
                        message.success(`${medicamento.nombre} agregado al carrito`);
                    }

                    const { status, dias } = getExpirationStatus(primerLote.fecha_vencimiento);
                    if (status === 'danger') {
                        message.warning(`⚠️ Este producto vence en ${dias} días`);
                    }
                } else {
                    message.error('No hay stock disponible de este producto');
                }
            }
        } catch (error) {
            message.error('Error al agregar producto');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        if (query.length >= 2) {
            const result = await searchMedicamentos(query);
            if (result.success) {
                setSuggestions(result.data);
            }
        }
    };

    const updateCantidad = (medicamentoId, nuevaCantidad) => {
        setCarrito(
            carrito.map((item) => {
                if (item.medicamento_id === medicamentoId) {
                    if (nuevaCantidad <= item.stock_disponible && nuevaCantidad > 0) {
                        return { ...item, cantidad: nuevaCantidad };
                    } else if (nuevaCantidad > item.stock_disponible) {
                        message.warning('No hay suficiente stock');
                        return item;
                    }
                }
                return item;
            })
        );
    };

    const removeItem = (medicamentoId) => {
        setCarrito(carrito.filter((item) => item.medicamento_id !== medicamentoId));
    };

    const calcularTotal = () => {
        return carrito.reduce((sum, item) => sum + item.precio_venta * item.cantidad, 0);
    };

    const handleConfirmarVenta = async () => {
        if (carrito.length === 0) {
            message.warning('El carrito está vacío');
            return;
        }

        const productosProximosVencer = carrito.filter((item) => {
            const { status } = getExpirationStatus(item.fecha_vencimiento);
            return status === 'danger';
        });

        if (productosProximosVencer.length > 0) {
            Modal.confirm({
                title: '⚠️ Productos próximos a vencer',
                content: (
                    <div>
                        <p>Los siguientes productos están próximos a vencer:</p>
                        <ul>
                            {productosProximosVencer.map((item) => (
                                <li key={item.medicamento_id}>
                                    {item.nombre} - <ExpirationBadge fecha={item.fecha_vencimiento} />
                                </li>
                            ))}
                        </ul>
                        <p>¿Desea continuar con la venta?</p>
                    </div>
                ),
                onOk: () => procesarVenta(),
            });
        } else {
            procesarVenta();
        }
    };

    const procesarVenta = async () => {
        try {
            setLoading(true);

            const result = await venderCarrito(carrito);

            if (result.success) {
                Modal.success({
                    title: '✓ Venta Confirmada',
                    content: (
                        <div>
                            <p>
                                <strong>Total:</strong> {formatCurrency(calcularTotal())}
                            </p>
                            <p>
                                <strong>Productos vendidos:</strong> {carrito.length}
                            </p>
                            <Divider />
                            <p style={{ fontSize: 12, color: '#8c8c8c' }}>
                                💡 Lotes aplicados con lógica FEFO
                            </p>
                        </div>
                    ),
                    onOk: () => {
                        setCarrito([]);
                        message.success('Nueva venta lista');
                    },
                });
            } else {
                message.error(result.error);
            }
        } catch (error) {
            message.error('Error al procesar venta');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelar = () => {
        if (carrito.length > 0) {
            Modal.confirm({
                title: '¿Cancelar venta?',
                content: '¿Está seguro que desea cancelar esta venta?',
                onOk: () => {
                    setCarrito([]);
                    message.info('Venta cancelada');
                },
            });
        }
    };

    const carritoColumns = [
        {
            title: 'Producto',
            dataIndex: 'nombre',
            key: 'nombre',
            width: '40%',
        },
        {
            title: 'Cantidad',
            key: 'cantidad',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => updateCantidad(record.medicamento_id, record.cantidad - 1)}
                    />
                    <InputNumber
                        size="small"
                        value={record.cantidad}
                        min={1}
                        max={record.stock_disponible}
                        onChange={(value) => updateCantidad(record.medicamento_id, value)}
                        style={{ width: 60 }}
                    />
                    <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => updateCantidad(record.medicamento_id, record.cantidad + 1)}
                    />
                </Space>
            ),
        },
        {
            title: 'Precio',
            dataIndex: 'precio_venta',
            key: 'precio_venta',
            align: 'right',
            render: (precio) => formatCurrency(precio),
        },
        {
            title: 'Total',
            key: 'total',
            align: 'right',
            render: (_, record) => formatCurrency(record.precio_venta * record.cantidad),
        },
        {
            title: '',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(record.medicamento_id)}
                />
            ),
        },
    ];

    const productosProximosVencer = carrito.filter((item) => {
        const { status } = getExpirationStatus(item.fecha_vencimiento);
        return status === 'danger';
    });

    return (
        <Row gutter={16}>
            <Col xs={24} lg={10}>
                <Card title="BUSCAR PRODUCTO" style={{ height: '100%' }}>
                    <BarcodeScanner
                        onScan={handleScan}
                        onSearch={handleSearch}
                        suggestions={suggestions}
                        placeholder="Buscar por nombre..."
                    />

                    <Divider>Sugerencias</Divider>

                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {suggestions.slice(0, 5).map((item) => (
                            <Card
                                key={item.id}
                                size="small"
                                hoverable
                                onClick={() => handleScan({ item })}
                                style={{ marginBottom: 8, cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{item.nombre}</span>
                                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                                        {formatCurrency(item.precio_venta || 0)} - Stock: {item.total_disponible || 0}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Card>
            </Col>

            <Col xs={24} lg={14}>
                <Card
                    title={
                        <span>
                            <ShoppingCartOutlined style={{ marginRight: 8 }} />
                            CARRITO DE COMPRA
                        </span>
                    }
                    style={{ height: '100%' }}
                >
                    {productosProximosVencer.length > 0 && (
                        <Alert
                            message={`⚠️ ${productosProximosVencer.length} producto(s) próximo(s) a vencer`}
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Table
                        dataSource={carrito}
                        columns={carritoColumns}
                        rowKey="medicamento_id"
                        pagination={false}
                        size="small"
                        locale={{ emptyText: 'Carrito vacío' }}
                    />

                    <Divider />

                    <Card style={{ background: '#fafafa' }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Statistic
                                    title="Subtotal"
                                    value={formatCurrency(calcularTotal())}
                                    valueStyle={{ fontSize: '20px' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Descuento"
                                    value={formatCurrency(0)}
                                    valueStyle={{ fontSize: '20px' }}
                                />
                            </Col>
                        </Row>
                        <Divider style={{ margin: '16px 0' }} />
                        <Statistic
                            title="TOTAL"
                            value={formatCurrency(calcularTotal())}
                            valueStyle={{ color: '#1890ff', fontSize: 48, fontWeight: 'bold' }}
                        />
                    </Card>

                    <Space style={{ width: '100%', marginTop: 16 }} size="middle">
                        <Button size="large" onClick={handleCancelar} style={{ flex: 1 }}>
                            Cancelar Venta
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            icon={<CheckOutlined />}
                            onClick={handleConfirmarVenta}
                            loading={loading}
                            disabled={carrito.length === 0}
                            style={{
                                flex: 1,
                                background: '#52c41a',
                                borderColor: '#52c41a',
                                height: 56,
                            }}
                        >
                            Confirmar Venta
                        </Button>
                    </Space>
                </Card>
            </Col>
        </Row>
    );
};

export default PuntoVenta;
