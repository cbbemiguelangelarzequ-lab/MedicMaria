import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Typography, 
    Row, 
    Col, 
    Descriptions, 
    Tag, 
    Button, 
    Timeline, 
    Modal, 
    Form, 
    Input as AntInput, 
    message,
    Space,
    Divider,
    Select,
    Table,
    InputNumber,
    AutoComplete
} from 'antd';
import { 
    ArrowLeftOutlined, 
    PlusOutlined, 
    MedicineBoxOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getPacienteById, getConsultasByPaciente, createConsulta } from '../services/clinicService';
import { searchMedicamentos, venderCarrito, registrarVentaServicio } from '../services/inventoryService';

const { Title, Text } = Typography;
const { TextArea } = AntInput;

const HistoriaClinica = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [paciente, setPaciente] = useState(null);
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isConsultaModalVisible, setIsConsultaModalVisible] = useState(false);
    const [formConsulta] = Form.useForm();
    const [formReceta] = Form.useForm();
    
    // Receta state
    const [recetaItems, setRecetaItems] = useState([]);
    const [medicamentosBusqueda, setMedicamentosBusqueda] = useState([]);
    const [buscandoMedicamento, setBuscandoMedicamento] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const resPaciente = await getPacienteById(id);
            if (resPaciente.success) {
                setPaciente(resPaciente.data);
            } else {
                message.error('Error al cargar paciente');
                navigate('/pacientes');
            }

            const resConsultas = await getConsultasByPaciente(id);
            if (resConsultas.success) {
                setConsultas(resConsultas.data);
            }
        } catch (error) {
            message.error('Error de red');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleSearchMedicamento = async (value) => {
        if (!value || value.length < 2) return;
        setBuscandoMedicamento(true);
        const res = await searchMedicamentos(value);
        if (res.success) {
            setMedicamentosBusqueda(res.data);
        }
        setBuscandoMedicamento(false);
    };

    const handleAddMedicamento = () => {
        formReceta.validateFields().then(values => {
            const medSeleccionado = medicamentosBusqueda.find(m => m.id === values.medicamento_id);
            const precioUnitario = medSeleccionado?.precio_venta || 0;
            const cantidad = values.cantidad || 1;
            const subtotal = precioUnitario * cantidad;
            
            const newItem = {
                key: Date.now().toString(),
                medicamento_id: values.medicamento_id || null,
                medicamento_externo: values.medicamento_externo || (medSeleccionado ? `${medSeleccionado.nombre} ${medSeleccionado.principio_activo ? `(${medSeleccionado.principio_activo})` : ''}` : 'Medicamento no especificado'),
                cantidad: cantidad,
                dosis: values.dosis,
                frecuencia: values.frecuencia,
                duracion: values.duracion,
                precio_unitario: precioUnitario,
                subtotal: subtotal,
                es_del_inventario: !!medSeleccionado
            };

            setRecetaItems([...recetaItems, newItem]);
            formReceta.resetFields();
            setMedicamentosBusqueda([]);
        });
    };

    const handleRemoveMedicamento = (key) => {
        setRecetaItems(recetaItems.filter(item => item.key !== key));
    };

    const closeConsultaModal = () => {
        setIsConsultaModalVisible(false);
        formConsulta.resetFields();
        setRecetaItems([]);
        loadData();
    };

    const handleSubmitConsulta = async () => {
        try {
            const values = await formConsulta.validateFields();
            
            const consultaData = {
                paciente_id: id,
                motivo_consulta: values.motivo_consulta,
                sintomas: values.sintomas,
                diagnostico: values.diagnostico,
                observaciones: values.observaciones,
                peso: values.peso,
                talla: values.talla,
                presion_arterial: values.presion_arterial,
                temperatura: values.temperatura,
                costo_total: recetaItems.reduce((sum, item) => sum + (item.subtotal || 0), 0) + (values.honorarios || 0)
            };

            // Preparar recetas
            const recetasData = recetaItems.map(item => ({
                medicamento_id: item.medicamento_id,
                medicamento_externo: item.medicamento_externo,
                cantidad: item.cantidad,
                dosis: item.dosis,
                frecuencia: item.frecuencia,
                duracion: item.duracion
            }));

            const res = await createConsulta(consultaData, recetasData);
            
            if (res.success) {
                message.success('Consulta registrada exitosamente');
                
                const itemsInventario = recetaItems.filter(item => item.es_del_inventario);
                
                if (itemsInventario.length > 0) {
                    Modal.confirm({
                        title: '¿Registrar venta de medicamentos y honorarios?',
                        content: (
                            <div>
                                <p>Se recetaron medicamentos del inventario.</p>
                                {values.honorarios > 0 && <p><strong>Honorarios por consulta:</strong> Bs. {values.honorarios.toFixed(2)}</p>}
                                <p>¿Desea registrar la venta, descontar el stock e incluir los honorarios en el Historial de Ventas?</p>
                            </div>
                        ),
                        okText: 'Sí, registrar venta y honorarios',
                        cancelText: 'No, solo guardar consulta',
                        onOk: async () => {
                            try {
                                const carrito = itemsInventario.map(item => ({
                                    medicamento_id: item.medicamento_id,
                                    cantidad: item.cantidad,
                                    nombre: item.medicamento_externo
                                }));
                                
                                const ventaRes = await venderCarrito(carrito);
                                if (!ventaRes.success) {
                                    throw new Error(ventaRes.error);
                                }
                                
                                // Registrar honorarios médicos si existen
                                if (values.honorarios > 0) {
                                    const honRes = await registrarVentaServicio(values.honorarios, 'Honorarios Médicos / Consulta');
                                    if (!honRes.success) throw new Error(honRes.error);
                                }
                                
                                message.success('Venta y honorarios registrados en el Historial exitosamente.');
                            } catch (error) {
                                message.error('Error procesando la venta automática: ' + error.message);
                            } finally {
                                closeConsultaModal();
                            }
                        },
                        onCancel: () => {
                            closeConsultaModal();
                        }
                    });
                } else if (values.honorarios > 0) {
                    // Si no hay medicamentos físicos pero SÍ hay honorarios
                    Modal.confirm({
                        title: '¿Registrar cobro de honorarios?',
                        content: `Desea registrar el cobro de honorarios por Bs. ${values.honorarios.toFixed(2)} en el Historial de Ventas?`,
                        okText: 'Sí, registrar cobro',
                        cancelText: 'No, solo guardar consulta',
                        onOk: async () => {
                            try {
                                const honRes = await registrarVentaServicio(values.honorarios, 'Honorarios Médicos / Consulta');
                                if (honRes.success) {
                                    message.success('Honorarios registrados en el Historial exitosamente.');
                                } else {
                                    throw new Error(honRes.error);
                                }
                            } catch (error) {
                                message.error('Error procesando el cobro: ' + error.message);
                            } finally {
                                closeConsultaModal();
                            }
                        },
                        onCancel: () => closeConsultaModal()
                    });
                } else {
                    closeConsultaModal();
                }
            } else {
                message.error('Error al guardar consulta: ' + res.error);
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const recetaColumns = [
        {
            title: 'Medicamento',
            dataIndex: 'medicamento_externo',
            key: 'medicamento',
            render: (text, record) => (
                <Space>
                    {text}
                    {record.es_del_inventario && <Tag color="blue">En Inventario</Tag>}
                </Space>
            )
        },
        { title: 'Dosis', dataIndex: 'dosis', key: 'dosis' },
        { title: 'Frecuencia', dataIndex: 'frecuencia', key: 'frecuencia' },
        { title: 'Duración', dataIndex: 'duracion', key: 'duracion' },
        { title: 'Cant.', dataIndex: 'cantidad', key: 'cantidad' },
        { 
            title: 'P. Unitario', 
            dataIndex: 'precio_unitario', 
            key: 'precio_unitario',
            render: (val) => val > 0 ? `Bs. ${val.toFixed(2)}` : '-'
        },
        { 
            title: 'Subtotal', 
            dataIndex: 'subtotal', 
            key: 'subtotal',
            render: (val) => val > 0 ? <Text strong>Bs. {val.toFixed(2)}</Text> : '-'
        },
        {
            title: 'Acción',
            key: 'action',
            render: (_, record) => (
                <Button danger type="text" onClick={() => handleRemoveMedicamento(record.key)}>Eliminar</Button>
            ),
        },
    ];

    if (loading) return <Card loading={true} />;
    if (!paciente) return <Card>Paciente no encontrado</Card>;


    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/pacientes')}>
                    Volver a Pacientes
                </Button>
            </Space>

            <Row gutter={[16, 16]}>
                {/* Columna Izquierda: Datos del Paciente */}
                <Col xs={24} md={8}>
                    <Card 
                        title={<><UserOutlined /> Perfil del Paciente</>}
                        style={{ height: '100%' }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <Title level={4}>{paciente.nombres} {paciente.apellidos}</Title>
                        </div>
                        
                        <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="Sexo">{paciente.sexo || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Sangre">
                                {paciente.tipo_sangre ? <Tag color="red">{paciente.tipo_sangre}</Tag> : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Teléfono">{paciente.telefono || 'N/A'}</Descriptions.Item>
                        </Descriptions>

                        <Divider orientation="left">Alergias</Divider>
                        {paciente.alergias ? (
                            <Tag color="volcano" style={{ whiteSpace: 'normal', height: 'auto', padding: '4px 8px' }}>
                                {paciente.alergias}
                            </Tag>
                        ) : (
                            <Text type="secondary">Sin alergias registradas</Text>
                        )}

                        <Divider orientation="left">Antecedentes</Divider>
                        <Text>{paciente.antecedentes_medicos || <Text type="secondary">Sin antecedentes</Text>}</Text>
                    </Card>
                </Col>

                {/* Columna Derecha: Historial Clínico */}
                <Col xs={24} md={16}>
                    <Card 
                        title="Historial Clínico" 
                        extra={
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsConsultaModalVisible(true)}>
                                Nueva Consulta
                            </Button>
                        }
                    >
                        {consultas.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <Text type="secondary">No hay consultas registradas para este paciente.</Text>
                            </div>
                        ) : (
                            <Timeline
                                mode="left"
                                items={consultas.map(consulta => ({
                                    label: dayjs(consulta.fecha_consulta).format('DD MMM YYYY HH:mm'),
                                    children: (
                                        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                                            <Title level={5} style={{ margin: 0, color: '#1890ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <MedicineBoxOutlined /> {consulta.motivo_consulta}
                                            </Title>
                                            
                                            {consulta.costo_total && consulta.costo_total > 0 && (
                                                <Tag color="green" style={{ position: 'absolute', right: 10, top: 10, fontSize: '14px', padding: '4px 8px' }}>
                                                    Bs. {parseFloat(consulta.costo_total).toFixed(2)}
                                                </Tag>
                                            )}

                                            <Divider style={{ margin: '8px 0' }} />
                                            
                                            {/* Signos Vitales */}
                                            {(consulta.peso || consulta.talla || consulta.presion_arterial || consulta.temperatura) && (
                                                <div style={{ marginBottom: 12 }}>
                                                    <Text type="secondary" strong style={{ display: 'block', marginBottom: 4 }}>Signos Vitales:</Text>
                                                    <Space size={[8, 8]} wrap>
                                                        {consulta.peso && <Tag color="cyan">Peso: {consulta.peso} kg</Tag>}
                                                        {consulta.talla && <Tag color="cyan">Talla: {consulta.talla} cm</Tag>}
                                                        {consulta.presion_arterial && <Tag color="volcano">P.A.: {consulta.presion_arterial}</Tag>}
                                                        {consulta.temperatura && <Tag color="orange">Temp: {consulta.temperatura} °C</Tag>}
                                                    </Space>
                                                </div>
                                            )}

                                            <Row gutter={[16, 8]}>
                                                {consulta.sintomas && (
                                                    <Col span={24}>
                                                        <Text type="secondary" strong>Síntomas:</Text>
                                                        <div style={{ padding: '8px', background: '#fff', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
                                                            {consulta.sintomas}
                                                        </div>
                                                    </Col>
                                                )}
                                                <Col span={24}>
                                                    <Text type="secondary" strong>Diagnóstico:</Text>
                                                    <div style={{ padding: '8px', background: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                                                        <Text strong>{consulta.diagnostico}</Text>
                                                    </div>
                                                </Col>
                                                {consulta.observaciones && (
                                                    <Col span={24}>
                                                        <Text type="secondary" strong>Observaciones:</Text>
                                                        <div style={{ padding: '8px', background: '#fff', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
                                                            {consulta.observaciones}
                                                        </div>
                                                    </Col>
                                                )}
                                            </Row>

                                            {/* Mostrar Recetas si hay */}
                                            {consulta.recetas_medicamentos && consulta.recetas_medicamentos.length > 0 && (
                                                <div style={{ marginTop: 16 }}>
                                                    <Divider style={{ margin: '12px 0' }}><MedicineBoxOutlined /> Receta Médica</Divider>
                                                    <Table 
                                                        dataSource={consulta.recetas_medicamentos} 
                                                        pagination={false}
                                                        size="small"
                                                        rowKey="id"
                                                        style={{ border: '1px solid #f0f0f0', borderRadius: '8px' }}
                                                        columns={[
                                                            { 
                                                                title: 'Medicamento', 
                                                                render: (_, r) => <Text strong>{r.medicamento_externo || (r.medicamentos ? r.medicamentos.nombre : '')}</Text>
                                                            },
                                                            { title: 'Dosis', dataIndex: 'dosis' },
                                                            { title: 'Frecuencia', dataIndex: 'frecuencia' },
                                                            { title: 'Duración', dataIndex: 'duracion' },
                                                            { title: 'Cant.', dataIndex: 'cantidad', render: (text) => <Tag color="blue">{text}</Tag> }
                                                        ]}
                                                    />
                                                </div>
                                            )}
                                        </Card>
                                    )
                                }))}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Modal de Nueva Consulta */}
            <Modal
                title="Registrar Nueva Consulta"
                open={isConsultaModalVisible}
                onCancel={closeConsultaModal}
                onOk={handleSubmitConsulta}
                width={800}
                okText="Guardar Consulta"
                cancelText="Cancelar"
                centered
                style={{ top: 20 }}
                styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingRight: '8px' } }}
            >
                <Form form={formConsulta} layout="vertical">
                    <Divider orientation="left" plain>Signos Vitales</Divider>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item name="peso" label="Peso (kg)">
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="talla" label="Talla (cm)">
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="presion_arterial" label="P.A. (ej. 120/80)">
                                <AntInput />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="temperatura" label="Temp. (°C)">
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left" plain>Datos de la Consulta</Divider>
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item 
                                name="motivo_consulta" 
                                label="Motivo de la consulta"
                                rules={[{ required: true, message: 'Ingrese el motivo' }]}
                            >
                                <AntInput />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item 
                                name="honorarios" 
                                label="Honorarios / Servicio (Bs.)"
                                tooltip="Costo por la consulta médica o aplicación de medicamentos (inyectables, curaciones, etc.)"
                            >
                                <InputNumber min={0} style={{ width: '100%' }} prefix="Bs." />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="sintomas" label="Síntomas">
                                <TextArea rows={3} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                name="diagnostico" 
                                label="Diagnóstico"
                                rules={[{ required: true, message: 'Ingrese el diagnóstico' }]}
                            >
                                <TextArea rows={3} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="observaciones" label="Observaciones adicionales">
                        <TextArea rows={2} />
                    </Form.Item>
                </Form>

                <Divider orientation="left" plain><MedicineBoxOutlined /> Generar Receta</Divider>
                <Card size="small" type="inner" style={{ marginBottom: 16, background: '#f0f5ff', borderColor: '#d6e4ff' }}>
                    <Form form={formReceta} layout="vertical">
                        <Row gutter={8}>
                            <Col span={10}>
                                <Form.Item name="medicamento_id" label="Buscar Medicamento">
                                    <Select
                                        showSearch
                                        placeholder="Escribe para buscar..."
                                        filterOption={false}
                                        onSearch={handleSearchMedicamento}
                                        notFoundContent={buscandoMedicamento ? 'Buscando...' : 'No encontrado'}
                                        onChange={(value) => {
                                            const med = medicamentosBusqueda.find(m => m.id === value);
                                            if (med) {
                                                const nombreCompleto = `${med.nombre} ${med.principio_activo ? `(${med.principio_activo})` : ''}`;
                                                formReceta.setFieldsValue({ medicamento_externo: nombreCompleto });
                                            }
                                        }}
                                        allowClear
                                    >
                                        {medicamentosBusqueda.map(d => (
                                            <Select.Option key={d.id} value={d.id}>
                                                {d.nombre} {d.principio_activo ? `(${d.principio_activo})` : ''} - Stock: {d.total_disponible || '?'}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={14}>
                                <Form.Item name="medicamento_externo" label="O Ingresar Manualmente">
                                    <AntInput placeholder="Ej. Paracetamol 500mg" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={8}>
                            <Col span={6}>
                                <Form.Item name="dosis" label="Dosis" rules={[{ required: true }]}>
                                    <AntInput placeholder="Ej. 1 tableta" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="frecuencia" label="Frecuencia" rules={[{ required: true }]}>
                                    <AutoComplete
                                        options={[
                                            { value: 'Cada 4 horas' },
                                            { value: 'Cada 6 horas' },
                                            { value: 'Cada 8 horas' },
                                            { value: 'Cada 12 horas' },
                                            { value: 'Cada 24 horas' },
                                            { value: 'Una vez al día' },
                                            { value: 'En la mañana y noche' },
                                            { value: 'Antes de dormir' }
                                        ]}
                                        placeholder="Ej. Cada 8 horas"
                                        filterOption={(inputValue, option) =>
                                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="duracion" label="Duración" rules={[{ required: true }]}>
                                    <AutoComplete
                                        options={[
                                            { value: 'Por 1 día' },
                                            { value: 'Por 3 días' },
                                            { value: 'Por 5 días' },
                                            { value: 'Por 7 días' },
                                            { value: 'Por 10 días' },
                                            { value: 'Por 14 días' },
                                            { value: 'Por 1 mes' },
                                            { value: 'Uso continuo' }
                                        ]}
                                        placeholder="Ej. Por 5 días"
                                        filterOption={(inputValue, option) =>
                                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item 
                                    name="cantidad" 
                                    label="Cant. total" 
                                    rules={[{ required: true }]}
                                    tooltip="Número total de unidades/cajas que el paciente debe llevar de la farmacia para completar el tratamiento."
                                >
                                    <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Button type="dashed" block onClick={handleAddMedicamento} icon={<PlusOutlined />}>
                            Agregar a la Receta
                        </Button>
                    </Form>
                </Card>

                {recetaItems.length > 0 && (
                    <Table 
                        dataSource={recetaItems} 
                        columns={recetaColumns} 
                        pagination={false} 
                        size="small"
                        bordered
                        summary={(pageData) => {
                            let totalCosto = 0;
                            pageData.forEach(({ subtotal }) => {
                                totalCosto += subtotal || 0;
                            });
                            
                            // Obtener honorarios actuales del formulario usando Watch o getFieldValue
                            // Puesto que summary no se re-renderiza con form.getFieldValue si no es reactivo, 
                            // requerimos usar Form.useWatch en un refactor mayor, pero podemos hacerlo simple aquí:
                            const honorariosActuales = formConsulta.getFieldValue('honorarios') || 0;
                            const totalGeneral = totalCosto + honorariosActuales;
                            
                            return (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={6} align="right">
                                        <Text strong>Costo Total (Meds + Honorarios):</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} colSpan={2}>
                                        <Text strong style={{ color: '#52c41a' }}>Bs. {totalGeneral.toFixed(2)}</Text>
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            );
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default HistoriaClinica;
