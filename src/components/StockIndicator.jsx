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
                emoji: '🔴',
            };
        } else if (actual < minimo * 1.5) {
            return {
                color: 'warning',
                icon: <ExclamationCircleOutlined />,
                label: 'Medio',
                emoji: '🟡',
            };
        } else {
            return {
                color: 'success',
                icon: <CheckCircleOutlined />,
                label: 'Alto',
                emoji: '🟢',
            };
        }
    };

    const status = getStatus();

    return (
        <Tag color={status.color} icon={showIcon ? status.icon : null}>
            {status.emoji} {actual} / {minimo}
        </Tag>
    );
};

export default StockIndicator;
