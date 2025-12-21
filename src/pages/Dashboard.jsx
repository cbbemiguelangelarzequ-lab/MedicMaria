import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Button, message, Spin } from 'antd';
import {
    DollarOutlined,
    RiseOutlined,
    MedicineBoxOutlined,
    WarningOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { getDashboardKPIs, getStockBajo, getProductosPorVencer } from '../services/inventoryService';
import { formatCurrency } from '../utils/currencyUtils';
import ExpirationBadge from '../components/ExpirationBadge';
import StockIndicator from '../components/StockIndicator';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({
        valorTotal: 0,
        gananciasObtenidas: 0,
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
            render: () => (
                <Button type="primary" size="small">
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
            render: () => (
                <Button danger size="small">
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
