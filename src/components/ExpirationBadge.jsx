import React from 'react';
import { Badge, Tag } from 'antd';
import { getExpirationStatus, getExpirationMessage } from '../utils/expirationUtils';

/**
 * Badge que muestra el estado de vencimiento con colores
 * 🔴 Rojo: < 30 días
 * 🟡 Amarillo: < 90 días
 * 🟢 Verde: > 90 días
 */
const ExpirationBadge = ({ fecha, showDays = true, showEmoji = true }) => {
    const { status, color, label, badge, dias } = getExpirationStatus(fecha);
    const message = getExpirationMessage(fecha);

    if (!fecha) {
        return <Tag color="default">Sin fecha</Tag>;
    }

    const emoji = {
        expired: '⚫',
        danger: '🔴',
        warning: '🟡',
        success: '🟢',
        unknown: '⚪',
    }[status];

    return (
        <Tag color={badge} style={{ borderColor: color }}>
            {showEmoji && <span style={{ marginRight: 4 }}>{emoji}</span>}
            {showDays ? message : label}
        </Tag>
    );
};

export default ExpirationBadge;
