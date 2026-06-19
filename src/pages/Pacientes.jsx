import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Input,
    Modal,
    Form,
    Input as AntInput,
    DatePicker,
    Select,
    message,
    Space,
    Card,
    Typography,
    Tag,
    Popconfirm,
} from 'antd';
import {
    EditOutlined,
    FolderOpenOutlined,
    DeleteOutlined,
    TeamOutlined,
    PlusOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getPacientes, createPaciente, updatePaciente, deletePaciente, searchPacientes } from '../services/clinicService';

const { Title } = Typography;
const { TextArea } = AntInput;

const Pacientes = () => {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPaciente, setEditingPaciente] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const fetchPacientes = async (query = '') => {
        setLoading(true);
        let res;
        if (query) {
            res = await searchPacientes(query);
        } else {
            res = await getPacientes();
        }

        if (res.success) {
            setPacientes(res.data);
        } else {
            message.error('Error al cargar pacientes: ' + res.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPacientes();
    }, []);

    const handleSearch = (value) => {
        setSearchText(value);
        fetchPacientes(value);
    };

    const showModal = (paciente = null) => {
        setEditingPaciente(paciente);
        if (paciente) {
            form.setFieldsValue({
                ...paciente
            });
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingPaciente(null);
    };

    const handleSubmit = async (values) => {
        const pacienteData = {
            ...values,
        };

        let res;
        if (editingPaciente) {
            res = await updatePaciente(editingPaciente.id, pacienteData);
        } else {
            res = await createPaciente(pacienteData);
        }

        if (res.success) {
            message.success(`Paciente ${editingPaciente ? 'actualizado' : 'creado'} correctamente`);
            setIsModalVisible(false);
            fetchPacientes(searchText);
        } else {
            message.error(`Error al ${editingPaciente ? 'actualizar' : 'crear'} paciente: ` + res.error);
        }
    };

    const handleDelete = async (id) => {
        const res = await deletePaciente(id);
        if (res.success) {
            message.success('Paciente eliminado correctamente');
            fetchPacientes(searchText);
        } else {
            message.error('Error al eliminar paciente: ' + res.error);
        }
    };

    const columns = [
        {
            title: 'Apellidos y Nombres',
            key: 'nombre_completo',
            render: (_, record) => `${record.apellidos}, ${record.nombre}`,
            sorter: (a, b) => a.apellidos.localeCompare(b.apellidos),
        },
        {
            title: 'Teléfono',
            dataIndex: 'telefono',
            key: 'telefono',
        },
        {
            title: 'Alergias',
            dataIndex: 'alergias',
            key: 'alergias',
            render: (alergias) => (
                alergias ? <Tag color="red">{alergias}</Tag> : <Tag color="green">Ninguna</Tag>
            )
        },
        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="primary" 
                        icon={<FolderOpenOutlined />} 
                        onClick={() => navigate(`/pacientes/${record.id}`)}
                    >
                        Historia Clínica
                    </Button>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => showModal(record)}
                    >
                        Editar
                    </Button>
                    <Popconfirm
                        title="¿Eliminar paciente?"
                        description="Esto ocultará al paciente de la lista. Sus registros clínicos se mantendrán por seguridad."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Sí, eliminar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <Title level={3} style={{ margin: 0, color: '#007BFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TeamOutlined /> Directorio de Pacientes
                </Title>
                <Space>
                    <Input.Search
                        placeholder="Buscar por nombre..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                        Nuevo Paciente
                    </Button>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={pacientes}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingPaciente ? "Editar Paciente" : "Nuevo Paciente"}
                open={isModalVisible}
                onCancel={handleCancel}
                onOk={() => form.submit()}
                width={700}
                centered
                style={{ top: 20 }}
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="nombre"
                            label="Nombres"
                            rules={[{ required: true, message: 'Por favor ingrese el nombre' }]}
                        >
                            <AntInput />
                        </Form.Item>
                        <Form.Item
                            name="apellidos"
                            label="Apellidos"
                            rules={[{ required: true, message: 'Por favor ingrese los apellidos' }]}
                        >
                            <AntInput />
                        </Form.Item>
                        <Form.Item
                            name="telefono"
                            label="Teléfono"
                        >
                            <AntInput />
                        </Form.Item>
                        <Form.Item
                            name="sexo"
                            label="Sexo"
                        >
                            <Select>
                                <Select.Option value="M">Masculino</Select.Option>
                                <Select.Option value="F">Femenino</Select.Option>
                                <Select.Option value="Otro">Otro</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="tipo_sangre"
                            label="Tipo de Sangre"
                        >
                            <Select allowClear>
                                <Select.Option value="O+">O+</Select.Option>
                                <Select.Option value="O-">O-</Select.Option>
                                <Select.Option value="A+">A+</Select.Option>
                                <Select.Option value="A-">A-</Select.Option>
                                <Select.Option value="B+">B+</Select.Option>
                                <Select.Option value="B-">B-</Select.Option>
                                <Select.Option value="AB+">AB+</Select.Option>
                                <Select.Option value="AB-">AB-</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="alergias"
                        label="Alergias (Importante)"
                    >
                        <TextArea rows={2} placeholder="Dejar en blanco si no tiene alergias conocidas" />
                    </Form.Item>

                    <Form.Item
                        name="antecedentes_medicos"
                        label="Antecedentes Médicos (Enfermedades previas, cirugías, etc.)"
                    >
                        <TextArea rows={3} />
                    </Form.Item>

                    <Form.Item
                        name="direccion"
                        label="Dirección"
                    >
                        <AntInput />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default Pacientes;
