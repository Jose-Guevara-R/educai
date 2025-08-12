/**
 * Este archivo contiene las funciones que se comunican con las funciones serverless de Netlify.
 * Las funciones se han actualizado para usar los endpoints que interactúan con Google Sheets.
 */

const BASE_URL = '/.netlify/functions';

/**
 * Registra la asistencia de un estudiante.
 * @param {string} dni - El DNI del estudiante a registrar.
 * @returns {Promise<object>} - El resultado de la operación.
 */
async function registerAttendance(dni) {
    try {
        const response = await fetch(`${BASE_URL}/register-attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dni }),
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error en registerAttendance:', error);
        return { success: false, error: 'Error de conexión al registrar asistencia.' };
    }
}

/**
 * Obtiene la lista de tardanzas y faltas para una fecha específica.
 * @param {string} date - La fecha en formato YYYY-MM-DD.
 * @returns {Promise<Array<object>>} - La lista de estudiantes.
 */
async function getLateAbsent(date) {
    try {
        const response = await fetch(`${BASE_URL}/get-late-absent?date=${date}`);
        const data = await response.json();
        
        if (response.ok) {
            return data;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error en getLateAbsent:', error);
        throw error;
    }
}

/**
 * Genera un reporte de asistencia en PDF.
 * @param {object} filters - Objeto con los filtros (grade, section, date).
 * @returns {Promise<object>} - El resultado de la operación, incluyendo el PDF en base64.
 */
async function generateReport(filters) {
    try {
        const response = await fetch(`${BASE_URL}/generate-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(filters),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en generateReport:', error);
        return { success: false, error: 'Error de conexión al generar el reporte.' };
    }
}
