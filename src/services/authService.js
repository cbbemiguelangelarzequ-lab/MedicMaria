/**
 * Servicio de Autenticación
 * Maneja login, logout y persistencia de sesión
 */

const CREDENTIALS = {
    username: 'MariaArz',
    password: 'Med9368769'
};

const SESSION_KEY = 'pharmacy_session';

/**
 * Iniciar sesión
 */
export const login = (username, password) => {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        const session = {
            username: CREDENTIALS.username,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { success: true, user: { username: CREDENTIALS.username } };
    }
    return { success: false, error: 'Usuario o contraseña incorrectos' };
};

/**
 * Cerrar sesión
 */
export const logout = () => {
    localStorage.removeItem(SESSION_KEY);
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = () => {
    const session = localStorage.getItem(SESSION_KEY);
    return session !== null;
};

/**
 * Obtener información del usuario actual
 */
export const getUser = () => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
        try {
            return JSON.parse(session);
        } catch (error) {
            return null;
        }
    }
    return null;
};
