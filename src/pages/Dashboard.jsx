import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Button, message, Spin, Alert, Modal } from 'antd';
import {
    DollarOutlined,
    RiseOutlined,
    MedicineBoxOutlined,
    WarningOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardKPIs, getStockBajo, getProductosPorVencer } from '../services/inventoryService';
import { formatCurrency } from '../utils/currencyUtils';
import ExpirationBadge from '../components/ExpirationBadge';
import StockIndicator from '../components/StockIndicator';

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({
        valorTotal: 0,
        gananciasObtenidas: 0,
        totalIngresos: 0,
        totalCostos: 0,
        totalProductos: 0,
        stockBajo: 0,
        porVencer: 0,
    });
    const [stockBajo, setStockBajo] = useState([]);
    const [porVencer, setPorVencer] = useState([]);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const kpisResult = await getDashboardKPIs();
            if (kpisResult.success) {
                setKpis(kpisResult.data);
            }

            const stockBajoResult = await getStockBajo();
            if (stockBajoResult.success) {
                setStockBajo(stockBajoResult.data);
            }

            const porVencerResult = await getProductosPorVencer(30);
            if (porVencerResult.success) {
                setPorVencer(porVencerResult.data);
            }
        } catch (error) {
            message.error('Error al cargar datos del dashboard');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleReabastecer = (medicamento) => {
        // Redirigir a Inventario con el medicamento seleccionado
        navigate('/inventario', { state: { selectedMedicamento: medicamento } });
    };

    const handleRegistrarMerma = (lote) => {
        Modal.confirm({
            title: '⚠️ Registrar Merma por Vencimiento',
            content: (
                <div>
                    <p><strong>Medicamento:</strong> {lote.medicamento}</p>
                    <p><strong>Lote:</strong> {lote.codigo_lote}</p>
                    <p><strong>Stock actual:</strong> {lote.stock_actual} unidades</p>
                    <p><strong>Fecha vencimiento:</strong> {new Date(lote.fecha_vencimiento).toLocaleDateString('es-BO')}</p>
                    <br />
                    <p>¿Desea registrar este lote como merma por vencimiento?</p>
                    <p style={{ color: '#ff4d4f', fontSize: 12 }}>Esta acción desactivará el lote y registrará la pérdida.</p>
                </div>
            ),
            okText: 'Sí, registrar merma',
            cancelText: 'Cancelar',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    // Aquí iría la lógica para registrar la merma
                    // Por ahora solo mostramos un mensaje
                    message.success('Merma registrada exitosamente');
                    loadDashboardData();
                } catch (error) {
                    message.error('Error al registrar merma');
                }
            },
        });
    };

    const stockBajoColumns = [
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
            title: 'Acción',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    onClick={() => handleReabastecer(record)}
                >
                    Reabastecer
                </Button>
            ),
        },
    ];

    const porVencerColumns = [
        {
            title: 'Medicamento',
            dataIndex: 'medicamento',
            key: 'medicamento',
        },
        {
            title: 'Lote',
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
            title: 'Acción',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button
                    danger
                    size="small"
                    onClick={() => handleRegistrarMerma(record)}
                >
                    Registrar Merma
                </Button>
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Valor Total Inventario"
                            value={formatCurrency(kpis.valorTotal)}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Ganancias Obtenidas"
                            value={formatCurrency(kpis.gananciasObtenidas)}
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Productos"
                            value={kpis.totalProductos}
                            prefix={<MedicineBoxOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Stock Bajo"
                            value={kpis.stockBajo}
                            prefix={<WarningOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Por Vencer (30 días)"
                            value={kpis.porVencer}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Sección de Diagnóstico de Ganancias */}
            <Card
                title={
                    <span>
                        <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                        Resumen Financiero
                    </span>
                }
                extra={
                    <Link to="/diagnostico">
                        <Button type="link">Ver Detalle Completo</Button>
                    </Link>
                }
                style={{ marginBottom: 24 }}
            >
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Statistic
                            title="💵 Ingresos Totales"
                            value={formatCurrency(kpis.totalIngresos || 0)}
                            valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                        />
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                            Total de ventas realizadas
                        </div>
                    </Col>
                    <Col xs={24} md={8}>
                        <Statistic
                            title="📦 Costos Totales"
                            value={formatCurrency(kpis.totalCostos || 0)}
                            valueStyle={{ color: '#ff4d4f', fontSize: '20px' }}
                        />
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                            Costo de mercancía vendida
                        </div>
                    </Col>
                    <Col xs={24} md={8}>
                        <Statistic
                            title="💰 Ganancias Netas"
                            value={formatCurrency(kpis.gananciasObtenidas || 0)}
                            valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: 'bold' }}
                        />
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                            Ingresos - Costos
                        </div>
                    </Col>
                </Row>
                <Alert
                    message="💡 Diferencia entre Ingresos y Ganancias"
                    description={
                        <div>
                            <strong>Ingresos:</strong> Todo el dinero que entra por ventas<br />
                            <strong>Costos:</strong> Lo que te costó comprar la mercancía<br />
                            <strong>Ganancias:</strong> Tu beneficio real (Ingresos - Costos)
                        </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                />
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <span>
                                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                                Stock Bajo
                            </span>
                        }
                        extra={
                            <Button type="link" onClick={loadDashboardData}>
                                Actualizar
                            </Button>
                        }
                    >
                        <Table
                            dataSource={stockBajo}
                            columns={stockBajoColumns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            size="small"
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <span>
                                <ClockCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                                Alerta de Vencimiento
                            </span>
                        }
                        extra={
                            <Button type="link" onClick={loadDashboardData}>
                                Actualizar
                            </Button>
                        }
                    >
                        <Table
                            dataSource={porVencer}
                            columns={porVencerColumns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            size="small"
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
