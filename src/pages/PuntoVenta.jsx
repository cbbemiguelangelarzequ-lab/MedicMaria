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
    Input,
    Form,
    Select,
    Radio,
    Tag,
    Avatar,
    Typography,
} from 'antd';
import {
    ShoppingCartOutlined,
    CheckOutlined,
    BulbOutlined,
    WarningOutlined,
    DeleteOutlined,
    PlusOutlined,
    MinusOutlined,
    UserOutlined,
    ShopOutlined,
    EditOutlined,
} from '@ant-design/icons';
import BarcodeScanner from '../components/BarcodeScanner';
import ExpirationBadge from '../components/ExpirationBadge';
import { searchMedicamentos, venderCarrito, getLotesByMedicamento } from '../services/inventoryService';
import { getPacientes } from '../services/clinicService';
import { getExpirationStatus } from '../utils/expirationUtils';
import { formatCurrency } from '../utils/currencyUtils';

const { Text } = Typography;

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

    // Lista de pacientes registrados para autocompletar
    const [pacientes, setPacientes] = useState([]);
    // Estado del modal de confirmación de venta
    const [modalVentaVisible, setModalVentaVisible] = useState(false);
    const [tipoCliente, setTipoCliente] = useState('MOSTRADOR'); // 'MOSTRADOR' | 'REGISTRADO' | 'MANUAL'
    const [pacienteIdSeleccionado, setPacienteIdSeleccionado] = useState(null);
    const [pacienteNombreManual, setPacienteNombreManual] = useState('');

    // Cargar pacientes registrados al montar el componente
    useEffect(() => {
        const cargarPacientes = async () => {
            const res = await getPacientes();
            if (res.success) {
                setPacientes(res.data || []);
            }
        };
        cargarPacientes();
    }, []);

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
                        message.warning({
                            content: `Este producto vence en ${dias} días`,
                            icon: <WarningOutlined style={{ color: '#faad14' }} />
                        });
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

    const handleConfirmarVenta = () => {
        if (carrito.length === 0) {
            message.warning('El carrito está vacío');
            return;
        }
        setModalVentaVisible(true);
    };

    const handleEjecutarVenta = async () => {
        let pacienteNombre = null;

        if (tipoCliente === 'REGISTRADO') {
            if (!pacienteIdSeleccionado) {
                message.warning('Por favor seleccione un paciente de la lista o cambie a Venta Mostrador');
                return;
            }
            const p = pacientes.find((item) => item.id === pacienteIdSeleccionado);
            if (p) {
                pacienteNombre = `${p.nombres} ${p.apellidos}`.trim();
            }
        } else if (tipoCliente === 'MANUAL') {
            pacienteNombre = pacienteNombreManual.trim() || null;
        }

        setModalVentaVisible(false);
        await procesarVenta(pacienteNombre);

        // Resetear selección
        setTipoCliente('MOSTRADOR');
        setPacienteIdSeleccionado(null);
        setPacienteNombreManual('');
    };

    const procesarVenta = async (pacienteNombre = null) => {
        try {
            setLoading(true);

            const result = await venderCarrito(carrito, null, pacienteNombre);

            if (result.success) {
                Modal.success({
                    title: '✓ Venta Confirmada',
                    content: (
                        <div>
                            {pacienteNombre && (
                                <p><strong>Paciente:</strong> {pacienteNombre}</p>
                            )}
                            <p>
                                <strong>Total:</strong> {formatCurrency(calcularTotal())}
                            </p>
                            <p>
                                <strong>Productos vendidos:</strong> {carrito.length}
                            </p>
                            <Divider />
                            <p style={{ fontSize: 12, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <BulbOutlined /> Lotes aplicados con lógica FEFO
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
                            message={<span><WarningOutlined /> {productosProximosVencer.length} producto(s) próximo(s) a vencer</span>}
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

            {/* Modal de Confirmación y Selección de Paciente / Mostrador */}
            <Modal
                title={
                    <Space>
                        <CheckOutlined style={{ color: '#52c41a' }} />
                        <span>Confirmar Venta</span>
                    </Space>
                }
                open={modalVentaVisible}
                onCancel={() => setModalVentaVisible(false)}
                onOk={handleEjecutarVenta}
                okText="Completar Venta"
                cancelText="Volver al Carrito"
                okButtonProps={{
                    style: { background: '#52c41a', borderColor: '#52c41a' },
                    loading: loading,
                }}
                width={520}
                destroyOnClose
            >
                <div style={{ marginTop: 8 }}>
                    {carrito.some(item => getExpirationStatus(item.fecha_vencimiento).status === 'danger') && (
                        <Alert
                            message="Atención: Uno o más productos en el carrito están próximos a vencer."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <div style={{
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: 8,
                        padding: '12px 16px',
                        marginBottom: 20,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>Total a cobrar</Text>
                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                                {formatCurrency(calcularTotal())}
                            </div>
                        </div>
                        <Tag color="green" style={{ fontSize: 13, padding: '4px 10px' }}>
                            {carrito.reduce((sum, item) => sum + item.cantidad, 0)} unidad(es)
                        </Tag>
                    </div>

                    <div style={{ marginBottom: 12, fontWeight: 600 }}>¿A quién se realiza la venta?</div>

                    <Radio.Group
                        value={tipoCliente}
                        onChange={(e) => setTipoCliente(e.target.value)}
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}
                    >
                        {/* Opción 1: Venta rápida mostrador */}
                        <div style={{
                            padding: '10px 14px',
                            border: `1px solid ${tipoCliente === 'MOSTRADOR' ? '#52c41a' : '#d9d9d9'}`,
                            borderRadius: 8,
                            background: tipoCliente === 'MOSTRADOR' ? '#f6ffed' : '#fafafa',
                            cursor: 'pointer'
                        }} onClick={() => setTipoCliente('MOSTRADOR')}>
                            <Radio value="MOSTRADOR">
                                <strong style={{ fontSize: 14 }}>🏪 Venta Mostrador (Rápida / Sin registro)</strong>
                            </Radio>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 24, marginTop: 4 }}>
                                Para clientes que solo compran medicamentos al paso. No requiere historia ni paciente.
                            </div>
                        </div>

                        {/* Opción 2: Paciente registrado con autocompletado */}
                        <div style={{
                            padding: '10px 14px',
                            border: `1px solid ${tipoCliente === 'REGISTRADO' ? '#1890ff' : '#d9d9d9'}`,
                            borderRadius: 8,
                            background: tipoCliente === 'REGISTRADO' ? '#e6f7ff' : '#fafafa',
                        }}>
                            <Radio value="REGISTRADO">
                                <strong style={{ fontSize: 14 }}>👤 Paciente Registrado en la Clínica</strong>
                            </Radio>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 24, marginTop: 4, marginBottom: 8 }}>
                                Selecciona un paciente existente. Evita errores ortográficos y lo vincula a su historial.
                            </div>

                            {tipoCliente === 'REGISTRADO' && (
                                <div style={{ marginLeft: 24, marginTop: 8 }}>
                                    <Select
                                        showSearch
                                        placeholder="Escribe el nombre, apellido o CI del paciente..."
                                        style={{ width: '100%' }}
                                        value={pacienteIdSeleccionado}
                                        onChange={(val) => setPacienteIdSeleccionado(val)}
                                        filterOption={(input, option) =>
                                            (option?.searchtext || '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        notFoundContent="No se encontraron pacientes con ese nombre o CI"
                                    >
                                        {pacientes.map((p) => {
                                            const nombreCompleto = `${p.nombres} ${p.apellidos}`.trim();
                                            return (
                                                <Select.Option
                                                    key={p.id}
                                                    value={p.id}
                                                    searchtext={`${nombreCompleto} ${p.documento_identidad || ''}`}
                                                >
                                                    <Space>
                                                        <Avatar
                                                            size="small"
                                                            src={p.foto_url}
                                                            icon={!p.foto_url && <UserOutlined />}
                                                            style={{ background: '#1890ff' }}
                                                        />
                                                        <span>{nombreCompleto}</span>
                                                        {p.documento_identidad && (
                                                            <Tag color="default" style={{ fontSize: 11 }}>
                                                                CI: {p.documento_identidad}
                                                            </Tag>
                                                        )}
                                                    </Space>
                                                </Select.Option>
                                            );
                                        })}
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Opción 3: Nombre manual */}
                        <div style={{
                            padding: '10px 14px',
                            border: `1px solid ${tipoCliente === 'MANUAL' ? '#faad14' : '#d9d9d9'}`,
                            borderRadius: 8,
                            background: tipoCliente === 'MANUAL' ? '#fffbe6' : '#fafafa',
                        }}>
                            <Radio value="MANUAL">
                                <strong style={{ fontSize: 14 }}>✍️ Nombre Manual (Cliente Particular)</strong>
                            </Radio>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 24, marginTop: 4, marginBottom: 8 }}>
                                Para registrar el nombre de un cliente que no tiene ficha clínica.
                            </div>

                            {tipoCliente === 'MANUAL' && (
                                <div style={{ marginLeft: 24, marginTop: 8 }}>
                                    <Input
                                        prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
                                        placeholder="Ej. Juan Pérez"
                                        value={pacienteNombreManual}
                                        onChange={(e) => setPacienteNombreManual(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                    </Radio.Group>
                </div>
            </Modal>
        </Row>
    );
};

export default PuntoVenta;
