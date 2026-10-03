/**
 * Utilidades de formato para Bolivia
 * Moneda: Bolivianos (Bs)
 * Formato de fecha: DD/MM/YYYY
 */

/**
 * Formatea un número como moneda boliviana
 * @param {number} amount - Cantidad a formatear
 * @param {boolean} showDecimals - Mostrar decimales (default: true)
 * @returns {string} - Cantidad formateada en Bs
 */
export const formatCurrency = (amount, showDecimals = true) => {
    if (amount === null || amount === undefined) return 'Bs 0.00';

    const decimals = showDecimals ? 2 : 0;
    const formatted = Number(amount).toFixed(decimals);

    // Separador de miles con punto y decimales con coma (formato boliviano)
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (showDecimals && parts[1]) {
        return `Bs ${parts[0]},${parts[1]}`;
    }

    return `Bs ${parts[0]}`;
};

/**
 * Parsea un string de moneda a número
 * @param {string} currencyString - String con formato "Bs 100,50"
 * @returns {number} - Número parseado
 */
export const parseCurrency = (currencyString) => {
    if (!currencyString) return 0;

    // Remover "Bs", espacios, puntos (separador de miles)
    const cleaned = currencyString
        .replace(/Bs/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.'); // Convertir coma decimal a punto

    return parseFloat(cleaned) || 0;
};

/**
 * Formatea un número como porcentaje
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Decimales a mostrar (default: 1)
 * @returns {string} - Porcentaje formateado
 */
export const formatPercentage = (value, decimals = 1) => {
    if (value === null || value === undefined) return '0%';
    return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Formatea un número con separadores de miles
 * @param {number} value - Número a formatear
 * @returns {string} - Número formateado
 */
export const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    return Number(value).toLocaleString('es-BO');
};

/**
 * Calcula el margen de ganancia
 * @param {number} costo - Costo de compra
 * @param {number} precio - Precio de venta
 * @returns {number} - Margen en porcentaje
 */
export const calculateMargin = (costo, precio) => {
    if (!costo || costo === 0) return 0;
    return ((precio - costo) / costo) * 100;
};

/**
 * Calcula el precio de venta con un margen deseado
 * @param {number} costo - Costo de compra
 * @param {number} margen - Margen deseado en porcentaje
 * @returns {number} - Precio de venta calculado
 */
export const calculatePriceWithMargin = (costo, margen) => {
    if (!costo) return 0;
    return costo * (1 + margen / 100);
};

export default {
    formatCurrency,
    parseCurrency,
    formatPercentage,
    formatNumber,
    calculateMargin,
    calculatePriceWithMargin,
};
