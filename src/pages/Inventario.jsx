import React, { useState, useEffect } from 'react';
import {
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
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMedicamentos, createMedicamento, updateMedicamento, deleteMedicamento, getCategorias } from '../services/inventoryService';
import ExpirationBadge from '../components/ExpirationBadge';
import StockIndicator from '../components/StockIndicator';

const { Option } = Select;

const Inventario = () => {
    const [loading, setLoading] = useState(false);
    const [medicamentos, setMedicamentos] = useState([]);
    const [filteredMedicamentos, setFilteredMedicamentos] = useState([]);
    const [categorias, setCategorias] = useState([]);

    // Cargar filtros desde localStorage
    const [searchText, setSearchText] = useState(() => {
        return localStorage.getItem('inventario_searchText') || '';
    });
    const [selectedCategoria, setSelectedCategoria] = useState(() => {
        return localStorage.getItem('inventario_categoria') || null;
    });
    const [selectedEstado, setSelectedEstado] = useState(() => {
        return localStorage.getItem('inventario_estado') || null;
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [editingMedicamento, setEditingMedicamento] = useState(null);
    const [form] = Form.useForm();

    // Guardar filtros en localStorage cuando cambien
    useEffect(() => {
        localStorage.setItem('inventario_searchText', searchText);
    }, [searchText]);

    useEffect(() => {
        if (selectedCategoria) {
            localStorage.setItem('inventario_categoria', selectedCategoria);
        } else {
            localStorage.removeItem('inventario_categoria');
        }
    }, [selectedCategoria]);

    useEffect(() => {
        if (selectedEstado) {
            localStorage.setItem('inventario_estado', selectedEstado);
        } else {
            localStorage.removeItem('inventario_estado');
        }
    }, [selectedEstado]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterMedicamentos();
    }, [searchText, selectedCategoria, selectedEstado, medicamentos]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Cargar medicamentos
            const medicamentosResult = await getMedicamentos();
            if (medicamentosResult.success) {
                setMedicamentos(medicamentosResult.data);
            }

            // Cargar categorías
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

    const filterMedicamentos = () => {
        let filtered = [...medicamentos];

        // Filtro de búsqueda
        if (searchText) {
            filtered = filtered.filter(
                (m) =>
                    m.nombre?.toLowerCase().includes(searchText.toLowerCase()) ||
                    m.principio_activo?.toLowerCase().includes(searchText.toLowerCase()) ||
                    m.codigo_barras?.includes(searchText)
            );
        }

        // Filtro de categoría
        if (selectedCategoria) {
            filtered = filtered.filter((m) => m.categoria === selectedCategoria);
        }

        // Filtro de estado de vencimiento
        if (selectedEstado) {
            filtered = filtered.filter((m) => m.estado_vencimiento === selectedEstado);
        }

        setFilteredMedicamentos(filtered);
    };

    const handleCreateOrUpdate = async (values) => {
        try {
            if (editingMedicamento) {
                // Actualizar
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
                // Crear
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

    const handleEdit = (record) => {
        setEditingMedicamento(record);
        form.setFieldsValue({
            nombre: record.nombre,
            descripcion: record.descripcion,
            codigo_barras: record.codigo_barras,
            principio_activo: record.principio_activo,
            laboratorio: record.laboratorio,
            categoria_id: record.categoria_id,
            stock_minimo: record.stock_minimo,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
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

    const clearFilters = () => {
        setSearchText('');
        setSelectedCategoria(null);
        setSelectedEstado(null);
    };

    const columns = [
        {
            title: 'Código',
            dataIndex: 'codigo_barras',
            key: 'codigo_barras',
            width: 120,
        },
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
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="¿Eliminar medicamento?"
                        description="Esta acción no se puede deshacer"
                        onConfirm={() => handleDelete(record.id)}
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
            {/* Barra de búsqueda y filtros */}
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size="middle">
                <Input
                    size="large"
                    placeholder="Buscar por nombre, principio activo, código de barras..."
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
                    <Button onClick={clearFilters}>Limpiar Filtros</Button>
                </Space>
            </Space>

            {/* Tabla de medicamentos */}
            <Table
                dataSource={filteredMedicamentos}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total: ${total} medicamentos`,
                }}
            />

            {/* Botón flotante para agregar */}
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
                    onFinish={handleCreateOrUpdate}
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

                    <Form.Item
                        label="Código de Barras"
                        name="codigo_barras"
                        rules={[{ required: true, message: 'Por favor ingrese el código de barras' }]}
                    >
                        <Input placeholder="7501234567890" />
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
                            <Select placeholder="Seleccione">
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
                        rules={[{ required: true, message: 'Ingrese el stock mínimo' }]}
                    >
                        <Input type="number" min={1} />
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
