import React from 'react';
import { Tag } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

/**
 * Indicador visual de stock con semáforo de colores
 * 🔴 Rojo: stock < stock_minimo
 * 🟡 Amarillo: stock < stock_minimo * 1.5
 * 🟢 Verde: stock >= stock_minimo * 1.5
 */
const StockIndicator = ({ actual, minimo, showIcon = true }) => {
    const getStatus = () => {
        if (actual < minimo) {
            return {
                color: 'error',
                icon: <WarningOutlined />,
                label: 'Bajo',
            };
        } else if (actual < minimo * 1.5) {
            return {
                color: 'warning',
                icon: <ExclamationCircleOutlined />,
                label: 'Medio',
            };
        } else {
            return {
                color: 'success',
                icon: <CheckCircleOutlined />,
                label: 'Alto',
            };
        }
    };

    const status = getStatus();

    return (
        <Tag 
            color={status.color} 
            icon={showIcon ? status.icon : null}
            style={{ 
                padding: '4px 10px', 
                borderRadius: '6px', 
                fontWeight: 500,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
            }}
        >
            {actual} / {minimo}
        </Tag>
    );
};

export default StockIndicator;
