import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Button,
    Space,
    message,
    Divider,
    Alert,
    Table,
    Modal,
    Popconfirm,
} from 'antd';
import { CheckOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import BarcodeScanner from '../components/BarcodeScanner';
import ExpirationBadge from '../components/ExpirationBadge';
import { getMedicamentoByBarcode, searchMedicamentos, addLote, getLotesByMedicamento, updateLote, deleteLote } from '../services/inventoryService';
import { calculateMargin, formatCurrency } from '../utils/currencyUtils';

const EntradaMercancia = () => {
    const [form] = Form.useForm();

    // Cargar producto seleccionado desde localStorage
    const [selectedMedicamento, setSelectedMedicamento] = useState(() => {
        try {
            const saved = localStorage.getItem('entrada_selectedMedicamento');
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            return null;
        }
    });

    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lotes, setLotes] = useState([]);
    const [editingLote, setEditingLote] = useState(null);

    // Guardar producto seleccionado en localStorage
    useEffect(() => {
        if (selectedMedicamento) {
            localStorage.setItem('entrada_selectedMedicamento', JSON.stringify(selectedMedicamento));
            loadLotes(selectedMedicamento.id);
        } else {
            localStorage.removeItem('entrada_selectedMedicamento');
            setLotes([]);
        }
    }, [selectedMedicamento]);

    const loadLotes = async (medicamentoId) => {
        try {
            const result = await getLotesByMedicamento(medicamentoId);
            if (result.success) {
                setLotes(result.data);
            }
        } catch (error) {
            console.error('Error al cargar lotes:', error);
        }
    };

    const handleScan = async (scannedData) => {
        try {
            setLoading(true);
            let medicamento = null;

            if (scannedData.item) {
                medicamento = scannedData.item;
            } else if (scannedData.codigo_barras) {
                const result = await getMedicamentoByBarcode(scannedData.codigo_barras);
                if (result.success) {
                    medicamento = result.data;
                } else {
                    message.error('Producto no encontrado');
                    return;
                }
            }

            if (medicamento) {
                setSelectedMedicamento(medicamento);
                message.success(`Producto seleccionado: ${medicamento.nombre}`);
            }
        } catch (error) {
            message.error('Error al buscar producto');
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

    const handleSubmit = async (values) => {
        if (!selectedMedicamento) {
            message.error('Por favor seleccione un producto');
            return;
        }

        try {
            setLoading(true);

            // Convertir fecha de mes/año al último día del mes
            const fechaVencimiento = values.fecha_vencimiento.endOf('month').format('YYYY-MM-DD');

            const loteData = {
                medicamento_id: selectedMedicamento.id,
                codigo_lote: values.codigo_lote,
                fecha_vencimiento: fechaVencimiento,
                stock_actual: values.cantidad,
                costo_compra: values.costo_compra || null,
                precio_venta: values.precio_venta || null,
            };

            if (editingLote) {
                // Actualizar lote existente
                const result = await updateLote(editingLote.id, loteData);
                if (result.success) {
                    message.success('Lote actualizado exitosamente');
                    form.resetFields();
                    setEditingLote(null);
                    loadLotes(selectedMedicamento.id);
                } else {
                    message.error(result.error);
                }
            } else {
                // Crear nuevo lote
                const result = await addLote(loteData);
                if (result.success) {
                    message.success('Entrada registrada exitosamente');
                    form.resetFields();
                    loadLotes(selectedMedicamento.id);
                } else {
                    message.error(result.error);
                }
            }
        } catch (error) {
            message.error('Error al registrar entrada');
        } finally {
            setLoading(false);
        }
    };

    const handleEditLote = (lote) => {
        setEditingLote(lote);
        form.setFieldsValue({
            codigo_lote: lote.codigo_lote,
            fecha_vencimiento: dayjs(lote.fecha_vencimiento),
            cantidad: lote.stock_actual,
            costo_compra: lote.costo_compra,
            precio_venta: lote.precio_venta,
        });
    };

    const handleDeleteLote = async (id) => {
        try {
            const result = await deleteLote(id);
            if (result.success) {
                message.success('Lote eliminado exitosamente');
                loadLotes(selectedMedicamento.id);
            } else {
                message.error(result.error);
            }
        } catch (error) {
            message.error('Error al eliminar lote');
        }
    };

    const calculateMarginPercent = () => {
        const costo = form.getFieldValue('costo_compra');
        const precio = form.getFieldValue('precio_venta');

        if (costo && precio && costo > 0) {
            return calculateMargin(costo, precio);
        }
        return null;
    };

    const margen = calculateMarginPercent();

    const lotesColumns = [
        {
            title: 'Código Lote',
            dataIndex: 'codigo_lote',
            key: 'codigo_lote',
        },
        {
            title: 'Vencimiento',
            dataIndex: 'fecha_vencimiento',
            key: 'fecha_vencimiento',
            render: (fecha) => <ExpirationBadge fecha={fecha} />,
        },
        {
            title: 'Stock',
            dataIndex: 'stock_actual',
            key: 'stock_actual',
            align: 'center',
        },
        {
            title: 'Costo',
            dataIndex: 'costo_compra',
            key: 'costo_compra',
            render: (costo) => formatCurrency(costo || 0),
        },
        {
            title: 'Precio Venta',
            dataIndex: 'precio_venta',
            key: 'precio_venta',
            render: (precio) => formatCurrency(precio || 0),
        },
        {
            title: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditLote(record)}
                    />
                    <Popconfirm
                        title="¿Eliminar lote?"
                        description="Esta acción no se puede deshacer"
                        onConfirm={() => handleDeleteLote(record.id)}
                        okText="Sí, eliminar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card title="PASO 1: Buscar Producto por Nombre" style={{ marginBottom: 16 }}>
                <BarcodeScanner
                    onScan={handleScan}
                    onSearch={handleSearch}
                    suggestions={suggestions}
                    placeholder="Buscar por nombre del medicamento..."
                />
            </Card>

            <Divider />

            {selectedMedicamento && (
                <>
                    <Card
                        title={editingLote ? "PASO 2: Editar Lote" : "PASO 2: Información del Lote"}
                        style={{
                            background: editingLote ? '#fff7e6' : '#e6f7ff',
                            borderColor: editingLote ? '#faad14' : '#1890ff',
                            marginBottom: 16,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: 24,
                                padding: 16,
                                background: '#fff',
                                borderRadius: 8,
                            }}
                        >
                            <div
                                style={{
                                    width: 80,
                                    height: 80,
                                    background: '#f0f0f0',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 40,
                                    marginRight: 16,
                                }}
                            >
                                💊
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>{selectedMedicamento.nombre}</h3>
                                <p style={{ margin: 0, color: '#8c8c8c' }}>
                                    {selectedMedicamento.descripcion}
                                </p>
                                <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                                    Laboratorio: {selectedMedicamento.laboratorio}
                                </p>
                            </div>
                        </div>

                        <Form form={form} layout="vertical" onFinish={handleSubmit}>
                            <Form.Item
                                label="Código de Lote"
                                name="codigo_lote"
                                rules={[{ required: true, message: 'Ingrese el código de lote' }]}
                            >
                                <Input placeholder="L2025-001" size="large" />
                            </Form.Item>

                            <Form.Item
                                label="Fecha de Vencimiento (Mes/Año)"
                                name="fecha_vencimiento"
                                rules={[{ required: true, message: 'Seleccione mes y año de vencimiento' }]}
                                tooltip="Se establecerá automáticamente el último día del mes"
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    size="large"
                                    picker="month"
                                    format="MM/YYYY"
                                    placeholder="Seleccione mes y año"
                                    disabledDate={(current) => current && current < dayjs().startOf('month')}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Cantidad"
                                name="cantidad"
                                rules={[{ required: true, message: 'Ingrese la cantidad' }]}
                                initialValue={1}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    size="large"
                                    min={1}
                                    max={9999}
                                />
                            </Form.Item>

                            <Space style={{ width: '100%' }} size="middle">
                                <Form.Item label="Costo de Compra (Bs)" name="costo_compra" style={{ flex: 1 }}>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        size="large"
                                        prefix="Bs"
                                        min={0}
                                        precision={2}
                                        placeholder="5.50"
                                    />
                                </Form.Item>

                                <Form.Item label="Precio de Venta (Bs)" name="precio_venta" style={{ flex: 1 }}>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        size="large"
                                        prefix="Bs"
                                        min={0}
                                        precision={2}
                                        placeholder="8.00"
                                    />
                                </Form.Item>
                            </Space>

                            {margen !== null && (
                                <Alert
                                    message={`💡 Margen de ganancia: ${margen.toFixed(1)}%`}
                                    type={margen > 30 ? 'success' : margen > 10 ? 'warning' : 'error'}
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                            )}

                            <Form.Item>
                                <Space>
                                    <Button
                                        onClick={() => {
                                            form.resetFields();
                                            setEditingLote(null);
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<CheckOutlined />}
                                        size="large"
                                        loading={loading}
                                        style={{ background: editingLote ? '#faad14' : '#52c41a', borderColor: editingLote ? '#faad14' : '#52c41a' }}
                                    >
                                        {editingLote ? 'Actualizar Lote' : 'Registrar Entrada'}
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>

                    {lotes.length > 0 && (
                        <Card title="LOTES EXISTENTES" style={{ marginTop: 16 }}>
                            <Table
                                dataSource={lotes}
                                columns={lotesColumns}
                                rowKey="id"
                                pagination={false}
                                size="small"
                            />
                        </Card>
                    )}
                </>
            )}

            {!selectedMedicamento && (
                <Card>
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                        <p>Busque un producto por nombre para comenzar</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default EntradaMercancia;
