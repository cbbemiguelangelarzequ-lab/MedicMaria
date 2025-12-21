import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Configurar dayjs en español
dayjs.locale('es');

/**
 * Calcula el estado de vencimiento de un producto
 * @param {string|Date} fecha - Fecha de vencimiento
 * @returns {object} - { status: 'danger'|'warning'|'success', dias: number, color: string }
 */
export const getExpirationStatus = (fecha) => {
    if (!fecha) return { status: 'unknown', dias: null, color: '#8c8c8c' };

    const fechaVencimiento = dayjs(fecha);
    const hoy = dayjs();
    const diasRestantes = fechaVencimiento.diff(hoy, 'day');

    if (diasRestantes < 0) {
        return {
            status: 'expired',
            dias: diasRestantes,
            color: '#000000',
            label: 'Vencido',
            badge: 'error',
        };
    } else if (diasRestantes < 30) {
        return {
            status: 'danger',
            dias: diasRestantes,
            color: '#ff4d4f',
            label: 'Crítico',
            badge: 'error',
        };
    } else if (diasRestantes < 90) {
        return {
            status: 'warning',
            dias: diasRestantes,
            color: '#faad14',
            label: 'Advertencia',
            badge: 'warning',
        };
    } else {
        return {
            status: 'success',
            dias: diasRestantes,
            color: '#52c41a',
            label: 'Normal',
            badge: 'success',
        };
    }
};

/**
 * Calcula los días hasta el vencimiento
 * @param {string|Date} fecha - Fecha de vencimiento
 * @returns {number} - Días restantes
 */
export const getDaysUntilExpiration = (fecha) => {
    if (!fecha) return null;
    const fechaVencimiento = dayjs(fecha);
    const hoy = dayjs();
    return fechaVencimiento.diff(hoy, 'day');
};

/**
 * Formatea la fecha de vencimiento en formato legible
 * @param {string|Date} fecha - Fecha de vencimiento
 * @param {string} formato - Formato de salida (default: 'DD/MM/YYYY')
 * @returns {string} - Fecha formateada
 */
export const formatExpirationDate = (fecha, formato = 'DD/MM/YYYY') => {
    if (!fecha) return 'Sin fecha';
    return dayjs(fecha).format(formato);
};

/**
 * Verifica si un producto está próximo a vencer
 * @param {string|Date} fecha - Fecha de vencimiento
 * @param {number} dias - Días de umbral (default: 90)
 * @returns {boolean}
 */
export const isNearExpiration = (fecha, dias = 90) => {
    const diasRestantes = getDaysUntilExpiration(fecha);
    return diasRestantes !== null && diasRestantes < dias && diasRestantes >= 0;
};

/**
 * Verifica si un producto está vencido
 * @param {string|Date} fecha - Fecha de vencimiento
 * @returns {boolean}
 */
export const isExpired = (fecha) => {
    const diasRestantes = getDaysUntilExpiration(fecha);
    return diasRestantes !== null && diasRestantes < 0;
};

/**
 * Obtiene el emoji correspondiente al estado de vencimiento
 * @param {string|Date} fecha - Fecha de vencimiento
 * @returns {string} - Emoji
 */
export const getExpirationEmoji = (fecha) => {
    const { status } = getExpirationStatus(fecha);
    const emojis = {
        expired: '⚫',
        danger: '🔴',
        warning: '🟡',
        success: '🟢',
        unknown: '⚪',
    };
    return emojis[status] || '⚪';
};

/**
 * Formatea un mensaje de vencimiento legible
 * @param {string|Date} fecha - Fecha de vencimiento
 * @returns {string} - Mensaje formateado
 */
export const getExpirationMessage = (fecha) => {
    const { status, dias } = getExpirationStatus(fecha);

    if (status === 'expired') {
        return `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
    } else if (status === 'danger') {
        return `Vence en ${dias} día${dias !== 1 ? 's' : ''}`;
    } else if (status === 'warning') {
        return `Vence en ${dias} días`;
    } else if (status === 'success') {
        return `Vence en ${dias} días`;
    } else {
        return 'Sin información de vencimiento';
    }
};

export default {
    getExpirationStatus,
    getDaysUntilExpiration,
    formatExpirationDate,
    isNearExpiration,
    isExpired,
    getExpirationEmoji,
    getExpirationMessage,
};
