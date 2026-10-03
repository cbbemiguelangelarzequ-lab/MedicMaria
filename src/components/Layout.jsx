import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    MedicineBoxOutlined,
    ShoppingCartOutlined,
    FileDoneOutlined,
    LogoutOutlined,
    UserOutlined,
    TeamOutlined,
    HeartOutlined,
} from '@ant-design/icons';
import { logout, getUser } from '../services/authService';

const { Header, Sider, Content } = Layout;

/**
 * Layout principal de la aplicación
 * Incluye sidebar con navegación y header
 */
const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const user = getUser();

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
            key: '/pacientes',
            icon: <TeamOutlined />,
            label: 'Clínica / Pacientes',
        },
        {
            key: '/pos',
            icon: <ShoppingCartOutlined />,
            label: 'Punto de Venta',
        },
        {
            key: '/historial-ventas',
            icon: <FileDoneOutlined />,
            label: 'Historial de Ventas',
        },
    ];

    const handleMenuClick = ({ key }) => {
        navigate(key);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userMenuItems = [
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Cerrar Sesión',
            onClick: handleLogout,
        },
    ];

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
                    <HeartOutlined style={{ fontSize: collapsed ? '24px' : '20px', marginRight: collapsed ? 0 : '10px' }} />
                    {!collapsed && <span style={{ letterSpacing: '1px' }}>CLÍNICA MARIA</span>}
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
                    <h2 style={{ margin: 0, color: '#1890ff', fontWeight: 600, fontSize: '20px' }}>
                        {location.pathname.startsWith('/pacientes/') 
                            ? 'HISTORIA CLÍNICA' 
                            : (menuItems.find((item) => item.key === location.pathname)?.label?.toUpperCase() || 'SISTEMA CLÍNICO')}
                    </h2>
                    <Space size="large">
                        <div style={{ color: '#8c8c8c' }}>
                            {new Date().toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </div>
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <Button type="text" icon={<UserOutlined />}>
                                {user?.username || 'Usuario'}
                            </Button>
                        </Dropdown>
                    </Space>
                </Header>
                <Content
                    style={{
                        margin: '24px',
                        padding: '24px',
                        background: '#f5f7fa',
                        borderRadius: '12px',
                        minHeight: 'calc(100vh - 112px)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
