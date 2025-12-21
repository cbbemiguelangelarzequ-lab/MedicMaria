import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    MedicineBoxOutlined,
    InboxOutlined,
    ShoppingCartOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

/**
 * Layout principal de la aplicación
 * Incluye sidebar con navegación y header
 */
const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/inventario',
            icon: <MedicineBoxOutlined />,
            label: 'Inventario',
        },
        {
            key: '/entrada',
            icon: <InboxOutlined />,
            label: 'Entrada de Mercancía',
        },
        {
            key: '/pos',
            icon: <ShoppingCartOutlined />,
            label: 'Punto de Venta',
        },
    ];

    const handleMenuClick = ({ key }) => {
        navigate(key);
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                theme="light"
                style={{
                    boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
                }}
            >
                <div
                    style={{
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: collapsed ? '20px' : '16px',
                        fontWeight: 'bold',
                        color: '#1890ff',
                        borderBottom: '1px solid #f0f0f0',
                        padding: '0 8px',
                        textAlign: 'center',
                    }}
                >
                    {collapsed ? '💊' : '💊 Medic Maria Arz'}
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{ borderRight: 0 }}
                />
            </Sider>
            <Layout>
                <Header
                    style={{
                        background: '#fff',
                        padding: '0 24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <h2 style={{ margin: 0, color: '#262626' }}>
                        {menuItems.find((item) => item.key === location.pathname)?.label || 'Medic Maria Arz'}
                    </h2>
                    <div style={{ color: '#8c8c8c' }}>
                        {new Date().toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </div>
                </Header>
                <Content
                    style={{
                        margin: '24px',
                        padding: '24px',
                        background: '#fff',
                        borderRadius: '8px',
                        minHeight: 'calc(100vh - 112px)',
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
