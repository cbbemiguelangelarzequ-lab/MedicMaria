import React from 'react';
import { Tag } from 'antd';
import { 
    ClockCircleOutlined, 
    WarningOutlined, 
    ExclamationCircleOutlined, 
    CloseCircleOutlined 
} from '@ant-design/icons';
import { getExpirationStatus, getExpirationMessage } from '../utils/expirationUtils';

/**
 * Badge que muestra el estado de vencimiento con colores
 * 🔴 Rojo: < 30 días
 * 🟡 Amarillo: < 90 días
 * 🟢 Verde: > 90 días
 */
const ExpirationBadge = ({ fecha, showDays = true, showIcon = true }) => {
    const { status, color, label, badge } = getExpirationStatus(fecha);
    const message = getExpirationMessage(fecha);

    if (!fecha) {
        return (
            <Tag 
                color="default" 
                style={{ 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    fontWeight: 500,
                    fontSize: '13px' 
                }}
            >
                Sin fecha
            </Tag>
        );
    }

    const icon = {
        expired: <CloseCircleOutlined />,
        danger: <WarningOutlined />,
        warning: <ExclamationCircleOutlined />,
        success: <ClockCircleOutlined />,
        unknown: <ClockCircleOutlined />,
    }[status];

    return (
        <Tag 
            color={badge} 
            icon={showIcon ? icon : null}
            style={{ 
                borderColor: color,
                padding: '4px 10px', 
                borderRadius: '6px', 
                fontWeight: 500,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
            }}
        >
            {showDays ? message : label}
        </Tag>
    );
};

export default ExpirationBadge;
