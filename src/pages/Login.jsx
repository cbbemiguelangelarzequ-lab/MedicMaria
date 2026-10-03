import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../services/authService';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (values) => {
        setLoading(true);
        try {
            const result = login(values.username, values.password);
            if (result.success) {
                message.success('¡Bienvenida, Maria Arz!');
                navigate('/');
            } else {
                message.error(result.error);
            }
        } catch (error) {
            message.error('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <Card
                style={{
                    width: 400,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    borderRadius: 16,
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>💊</div>
                    <h1 style={{ margin: 0, fontSize: 24, color: '#262626' }}>
                        Medic Maria Arz
                    </h1>
                    <p style={{ margin: 0, color: '#8c8c8c' }}>
                        Sistema de Farmacia
                    </p>
                </div>

                <Form
                    name="login"
                    onFinish={handleLogin}
                    autoComplete="off"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: 'Por favor ingrese su usuario' },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
                            placeholder="Usuario"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Por favor ingrese su contraseña' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
                            placeholder="Contraseña"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{
                                height: 45,
                                fontSize: 16,
                                fontWeight: 500,
                            }}
                        >
                            Iniciar Sesión
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>
                    <p style={{ margin: 0 }}>© 2025 Medic Maria Arz</p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
