import React, { useState, useEffect } from 'react';
import {
    Tabs,
    Table,
    Input,
    Select,
    Button,
    Modal,
    Form,
    message,
    Space,
    Tag,
    FloatButton,
    Popconfirm,
    Card,
    InputNumber,
    DatePicker,
    Alert,
    Divider,
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import BarcodeScanner from '../components/BarcodeScanner';
import ExpirationBadge from '../components/ExpirationBadge';
import StockIndicator from '../components/StockIndicator';
import {
    getMedicamentos,
    createMedicamento,
    updateMedicamento,
    deleteMedicamento,
    getCategorias,
    createCategoria,
    searchMedicamentos,
    addLote,
    getLotesByMedicamento,
    updateLote,
    deleteLote,
} from '../services/inventoryService';
import { calculateMargin, formatCurrency } from '../utils/currencyUtils';

const { Option } = Select;
const { TabPane } = Tabs;

const Inventario = () => {
    const location = useLocation();
    // Estado para tabs
    const [activeTab, setActiveTab] = useState('medicamentos');

    // Estados para Medicamentos
    const [loading, setLoading] = useState(false);
    const [medicamentos, setMedicamentos] = useState([]);
    const [filteredMedicamentos, setFilteredMedicamentos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [selectedCategoria, setSelectedCategoria] = useState(null);
    const [selectedEstado, setSelectedEstado] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingMedicamento, setEditingMedicamento] = useState(null);
    const [form] = Form.useForm();

    // Estados para Lotes
    const [selectedMedicamento, setSelectedMedicamento] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [lotes, setLotes] = useState([]);
    const [editingLote, setEditingLote] = useState(null);
    const [loteForm] = Form.useForm();

    // Estados para crear nueva categoría
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterMedicamentos();
    }, [searchText, selectedCategoria, selectedEstado, medicamentos]);

    useEffect(() => {
        if (selectedMedicamento) {
            loadLotes(selectedMedicamento.id);
        } else {
            setLotes([]);
        }
    }, [selectedMedicamento]);

    // Efecto para manejar medicamento seleccionado desde Dashboard
    useEffect(() => {
        if (location.state?.selectedMedicamento) {
            const medicamento = location.state.selectedMedicamento;
            setSelectedMedicamento(medicamento);
            setActiveTab('lotes');
            message.info(`Producto seleccionado: ${medicamento.nombre}`);
            // Limpiar el state para evitar que se vuelva a seleccionar
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const loadData = async () => {
        try {
            setLoading(true);
            const medicamentosResult = await getMedicamentos();
            if (medicamentosResult.success) {
                setMedicamentos(medicamentosResult.data);
            }
            const categoriasResult = await getCategorias();
            if (categoriasResult.success) {
                setCategorias(categoriasResult.data);
            }
        } catch (error) {
            message.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

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

    const filterMedicamentos = () => {
        let filtered = [...medicamentos];
        if (searchText) {
            filtered = filtered.filter(
                (m) =>
                    m.nombre?.toLowerCase().includes(searchText.toLowerCase()) ||
                    m.principio_activo?.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        if (selectedCategoria) {
            filtered = filtered.filter((m) => m.categoria === selectedCategoria);
        }
        if (selectedEstado) {
            filtered = filtered.filter((m) => m.estado_vencimiento === selectedEstado);
        }
        setFilteredMedicamentos(filtered);
    };

    // ============================================
    // FUNCIONES PARA MEDICAMENTOS
    // ============================================

    const handleCreateOrUpdateMedicamento = async (values) => {
        try {
            if (editingMedicamento) {
                const result = await updateMedicamento(editingMedicamento.id, values);
                if (result.success) {
                    message.success('Medicamento actualizado exitosamente');
                    setModalVisible(false);
                    setEditingMedicamento(null);
                    form.resetFields();
                    loadData();
                } else {
                    message.error(result.error);
                }
            } else {
                const result = await createMedicamento(values);
                if (result.success) {
                    message.success('Medicamento creado exitosamente');
                    setModalVisible(false);
                    form.resetFields();
                    loadData();
                } else {
                    message.error(result.error);
                }
            }
        } catch (error) {
            message.error('Error al guardar medicamento');
        }
    };

    const handleEditMedicamento = (record) => {
        setEditingMedicamento(record);
        form.setFieldsValue({
            nombre: record.nombre,
            descripcion: record.descripcion,
            principio_activo: record.principio_activo,
            laboratorio: record.laboratorio,
            categoria_id: record.categoria_id,
            stock_minimo: record.stock_minimo,
        });
        setModalVisible(true);
    };

    const handleDeleteMedicamento = async (id) => {
        try {
            const result = await deleteMedicamento(id);
            if (result.success) {
                message.success('Medicamento eliminado exitosamente');
                loadData();
            } else {
                message.error(result.error);
            }
        } catch (error) {
            message.error('Error al eliminar medicamento');
        }
    };

    const handleViewLotes = (record) => {
        setSelectedMedicamento(record);
        setActiveTab('lotes');
    };

    const handleCreateCategoria = async () => {
        if (!newCategoryName.trim()) {
            message.warning('Por favor ingrese un nombre para la categoría');
            return;
        }

        try {
            const result = await createCategoria(newCategoryName.trim());
            if (result.success) {
                message.success(`Categoría "${newCategoryName}" creada exitosamente`);
                setNewCategoryName('');
                setIsAddingCategory(false);
                // Recargar categorías
                const categoriasResult = await getCategorias();
                if (categoriasResult.success) {
                    setCategorias(categoriasResult.data);
                    // Seleccionar la nueva categoría automáticamente
                    form.setFieldsValue({ categoria_id: result.data.id });
                }
            } else {
                message.error(result.error);
            }
        } catch (error) {
            message.error('Error al crear categoría');
        }
    };

    // ============================================
    // FUNCIONES PARA LOTES
    // ============================================

    const handleSearchMedicamento = async (query) => {
        if (query.length >= 2) {
            const result = await searchMedicamentos(query);
            if (result.success) {
                setSuggestions(result.data);
            }
        }
    };

    const handleSelectMedicamento = (scannedData) => {
        if (scannedData.item) {
            setSelectedMedicamento(scannedData.item);
            message.success(`Producto seleccionado: ${scannedData.item.nombre}`);
        }
    };

    const handleSubmitLote = async (values) => {
        if (!selectedMedicamento) {
            message.error('Por favor seleccione un producto');
            return;
        }

        try {
            setLoading(true);
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
                const result = await updateLote(editingLote.id, loteData);
                if (result.success) {
                    message.success('Lote actualizado exitosamente');
                    loteForm.resetFields();
                    setEditingLote(null);
                    loadLotes(selectedMedicamento.id);
                } else {
                    message.error(result.error);
                }
            } else {
                const result = await addLote(loteData);
                if (result.success) {
                    message.success('Lote registrado exitosamente');
                    loteForm.resetFields();
                    loadLotes(selectedMedicamento.id);
                    loadData(); // Actualizar lista de medicamentos
                } else {
                    message.error(result.error);
                }
            }
        } catch (error) {
            message.error('Error al registrar lote');
        } finally {
            setLoading(false);
        }
    };

    const handleEditLote = (lote) => {
        setEditingLote(lote);
        loteForm.setFieldsValue({
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
                loadData();
            } else {
                message.error(result.error);
            }
        } catch (error) {
            message.error('Error al eliminar lote');
        }
    };

    const calculateMarginPercent = () => {
        const costo = loteForm.getFieldValue('costo_compra');
        const precio = loteForm.getFieldValue('precio_venta');
        if (costo && precio && costo > 0) {
            return calculateMargin(costo, precio);
        }
        return null;
    };

    const margen = calculateMarginPercent();

    // ============================================
    // COLUMNAS DE TABLAS
    // ============================================

    const medicamentosColumns = [
        {
            title: 'Medicamento',
            dataIndex: 'nombre',
            key: 'nombre',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {record.principio_activo}
                    </div>
                </div>
            ),
        },
        {
            title: 'Categoría',
            dataIndex: 'categoria',
            key: 'categoria',
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Stock',
            key: 'stock',
            align: 'center',
            render: (_, record) => (
                <StockIndicator
                    actual={record.total_disponible}
                    minimo={record.stock_minimo}
                />
            ),
        },
        {
            title: 'Próximo Vencimiento',
            dataIndex: 'proximo_vencimiento',
            key: 'proximo_vencimiento',
            render: (fecha) => <ExpirationBadge fecha={fecha} />,
        },
        {
            title: 'Lotes',
            dataIndex: 'cantidad_lotes_activos',
            key: 'cantidad_lotes_activos',
            align: 'center',
        },
        {
            title: 'Acciones',
            key: 'actions',
            align: 'center',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        type="default"
                        size="small"
                        icon={<UnorderedListOutlined />}
                        onClick={() => handleViewLotes(record)}
                        title="Ver Lotes"
                    />
                    <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditMedicamento(record)}
                    />
                    <Popconfirm
                        title="¿Eliminar medicamento?"
                        description="Esta acción no se puede deshacer"
                        onConfirm={() => handleDeleteMedicamento(record.id)}
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
            <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
                {/* PESTAÑA 1: MEDICAMENTOS */}
                <TabPane tab="📦 Medicamentos" key="medicamentos">
                    <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size="middle">
                        <Input
                            size="large"
                            placeholder="Buscar por nombre, principio activo..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                        <Space>
                            <Select
                                placeholder="Categoría"
                                style={{ width: 200 }}
                                value={selectedCategoria}
                                onChange={setSelectedCategoria}
                                allowClear
                            >
                                {categorias.map((cat) => (
                                    <Option key={cat.id} value={cat.nombre}>
                                        {cat.nombre}
                                    </Option>
                                ))}
                            </Select>
                            <Select
                                placeholder="Estado Vencimiento"
                                style={{ width: 200 }}
                                value={selectedEstado}
                                onChange={setSelectedEstado}
                                allowClear
                            >
                                <Option value="CRITICO">🔴 Crítico (&lt; 30 días)</Option>
                                <Option value="ADVERTENCIA">🟡 Advertencia (&lt; 90 días)</Option>
                                <Option value="NORMAL">🟢 Normal (&gt; 90 días)</Option>
                            </Select>
                            <Button onClick={() => {
                                setSearchText('');
                                setSelectedCategoria(null);
                                setSelectedEstado(null);
                            }}>Limpiar Filtros</Button>
                        </Space>
                    </Space>

                    <Table
                        dataSource={filteredMedicamentos}
                        columns={medicamentosColumns}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total: ${total} medicamentos`,
                        }}
                    />

                    <FloatButton
                        icon={<PlusOutlined />}
                        type="primary"
                        style={{ right: 24, bottom: 24 }}
                        onClick={() => {
                            setEditingMedicamento(null);
                            form.resetFields();
                            setModalVisible(true);
                        }}
                        tooltip="Nuevo Medicamento"
                    />
                </TabPane>

                {/* PESTAÑA 2: GESTIÓN DE LOTES */}
                <TabPane tab="📋 Gestión de Lotes" key="lotes">
                    <Card title="Seleccionar Medicamento" style={{ marginBottom: 16 }}>
                        <BarcodeScanner
                            onScan={handleSelectMedicamento}
                            onSearch={handleSearchMedicamento}
                            suggestions={suggestions}
                            placeholder="Buscar medicamento por nombre..."
                        />
                    </Card>

                    {selectedMedicamento && (
                        <>
                            <Card
                                title={editingLote ? "Editar Lote" : "Agregar Nuevo Lote"}
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

                                <Form form={loteForm} layout="vertical" onFinish={handleSubmitLote}>
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
                                        rules={[
                                            { required: true, message: 'Ingrese la cantidad' },
                                            { type: 'number', min: 1, message: 'La cantidad debe ser mayor que 0' }
                                        ]}
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
                                        <Form.Item
                                            label="Costo de Compra (Bs)"
                                            name="costo_compra"
                                            style={{ flex: 1 }}
                                            rules={[
                                                { type: 'number', min: 0, message: 'El costo no puede ser negativo' }
                                            ]}
                                        >
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                size="large"
                                                prefix="Bs"
                                                min={0}
                                                precision={2}
                                                placeholder="5.50"
                                                onChange={() => loteForm.validateFields(['precio_venta'])}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Precio de Venta (Bs)"
                                            name="precio_venta"
                                            style={{ flex: 1 }}
                                            rules={[
                                                { type: 'number', min: 0, message: 'El precio no puede ser negativo' },
                                                {
                                                    validator: async (_, value) => {
                                                        const costo = loteForm.getFieldValue('costo_compra');
                                                        if (value && costo && value < costo) {
                                                            return Promise.reject(
                                                                new Error('⚠️ El precio de venta es menor que el costo. Tendrás pérdidas en este lote.')
                                                            );
                                                        }
                                                        return Promise.resolve();
                                                    }
                                                }
                                            ]}
                                        >
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
                                            message={
                                                margen < 0
                                                    ? `⚠️ PÉRDIDA: ${Math.abs(margen).toFixed(1)}% - Estás vendiendo por debajo del costo`
                                                    : `💡 Margen de ganancia: ${margen.toFixed(1)}%`
                                            }
                                            description={
                                                margen < 0
                                                    ? 'El precio de venta es menor que el costo de compra. Perderás dinero en cada venta.'
                                                    : margen < 10
                                                        ? 'Margen bajo. Considera aumentar el precio de venta.'
                                                        : margen < 30
                                                            ? 'Margen aceptable.'
                                                            : 'Excelente margen de ganancia.'
                                            }
                                            type={margen < 0 ? 'error' : margen > 30 ? 'success' : margen > 10 ? 'warning' : 'error'}
                                            showIcon
                                            style={{ marginBottom: 16 }}
                                        />
                                    )}

                                    <Form.Item>
                                        <Space>
                                            <Button
                                                onClick={() => {
                                                    loteForm.resetFields();
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
                                                style={{
                                                    background: editingLote ? '#faad14' : '#52c41a',
                                                    borderColor: editingLote ? '#faad14' : '#52c41a'
                                                }}
                                            >
                                                {editingLote ? 'Actualizar Lote' : 'Registrar Lote'}
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Form>
                            </Card>

                            {lotes.length > 0 && (
                                <Card title="Lotes Existentes">
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
                                <p>Busque un medicamento para gestionar sus lotes</p>
                            </div>
                        </Card>
                    )}
                </TabPane>
            </Tabs>

            {/* Modal para crear/editar medicamento */}
            <Modal
                title={editingMedicamento ? "Editar Medicamento" : "Agregar Nuevo Medicamento"}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingMedicamento(null);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateOrUpdateMedicamento}
                >
                    <Form.Item
                        label="Nombre"
                        name="nombre"
                        rules={[{ required: true, message: 'Por favor ingrese el nombre' }]}
                    >
                        <Input placeholder="Ej: Paracetamol 500mg" />
                    </Form.Item>

                    <Form.Item label="Descripción" name="descripcion">
                        <Input.TextArea placeholder="Analgésico y antipirético" rows={2} />
                    </Form.Item>

                    <Form.Item label="Principio Activo" name="principio_activo">
                        <Input placeholder="Paracetamol" />
                    </Form.Item>

                    <Space style={{ width: '100%' }} size="middle">
                        <Form.Item label="Laboratorio" name="laboratorio" style={{ flex: 1 }}>
                            <Input placeholder="Bayer" />
                        </Form.Item>

                        <Form.Item
                            label="Categoría"
                            name="categoria_id"
                            rules={[{ required: true, message: 'Seleccione una categoría' }]}
                            style={{ flex: 1 }}
                        >
                            <Select
                                placeholder="Seleccione o agregue nueva"
                                dropdownRender={(menu) => (
                                    <>
                                        {menu}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <Space style={{ padding: '0 8px 4px' }}>
                                            <Input
                                                placeholder="Nueva categoría"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                onPressEnter={handleCreateCategoria}
                                            />
                                            <Button
                                                type="text"
                                                icon={<PlusOutlined />}
                                                onClick={handleCreateCategoria}
                                            >
                                                Agregar
                                            </Button>
                                        </Space>
                                    </>
                                )}
                            >
                                {categorias.map((cat) => (
                                    <Option key={cat.id} value={cat.id}>
                                        {cat.nombre}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Space>

                    <Form.Item
                        label="Stock Mínimo"
                        name="stock_minimo"
                        initialValue={10}
                        rules={[
                            { required: true, message: 'Ingrese el stock mínimo' },
                            { type: 'number', min: 1, message: 'El stock mínimo debe ser mayor que 0' }
                        ]}
                        tooltip="Cantidad mínima antes de mostrar alerta de stock bajo"
                    >
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={() => {
                                setModalVisible(false);
                                setEditingMedicamento(null);
                                form.resetFields();
                            }}>
                                Cancelar
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingMedicamento ? 'Actualizar' : 'Guardar'} Medicamento
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Inventario;
