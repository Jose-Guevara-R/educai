// Este archivo contiene funciones refactorizadas para interactuar con las API del backend.
// Se ha creado una función centralizada para el manejo de fetch.

/**
 * Muestra un modal con un mensaje y un título.
 * @param {string} title El título del modal.
 * @param {string} message El mensaje a mostrar.
 * @param {string} type El tipo de mensaje ('success' o 'error').
 */
function showModal(title, message, type) {
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalIcon = document.getElementById('modal-icon');

    // Asignar el título y el mensaje
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Cambiar el icono y el color según el tipo de mensaje
    if (type === 'success') {
        modalIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg>`;
        modalIcon.classList.remove('bg-red-100');
        modalIcon.classList.add('bg-green-100');
    } else {
        modalIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x text-red-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
        modalIcon.classList.remove('bg-green-100');
        modalIcon.classList.add('bg-red-100');
    }

    modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('app-modal');
    const closeButton = document.getElementById('modal-close-btn');

    // Asegúrate de que el modal se cierre al hacer clic en el botón
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // Cerrar el modal haciendo clic fuera de él
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

/**
 * Función centralizada para realizar llamadas a la API y manejar errores.
 * @param {string} url La URL de la API.
 * @param {object} options Opciones para la llamada fetch.
 * @returns {Promise<object>} La respuesta parseada en JSON.
 */
async function fetchWrapper(url, options = {}) {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            // Manejar errores de la API (por ejemplo, 400, 404, 500)
            const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
            throw new Error(errorData.error || errorData.message || `Error HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error en la llamada a la API (${url}):`, error);
        throw error;
    }
}

// Función para registrar asistencia
async function registerAttendance(dni) {
    return await fetchWrapper('/.netlify/functions/register-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni }),
    });
}

// Función para obtener datos de un estudiante
async function getStudent(dni) {
    return await fetchWrapper(`/.netlify/functions/get-student?dni=${dni}`);
}

// Función para obtener reportes
async function getReport(filters = {}) {
    return await fetchWrapper('/.netlify/functions/get-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
    });
}

// Función para generar reporte en PDF/Excel
async function generateReport(params) {
    return await fetchWrapper('/.netlify/functions/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
}

// Función para obtener lista de tardanzas y faltas
async function getLateAbsent(date) {
    return await fetchWrapper(`/.netlify/functions/get-late-absent?date=${date}`);
}

// Función para obtener la ubicación actual del usuario (opcional, para futuras funcionalidades)
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('La geolocalización no es compatible con este navegador.'));
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve({ latitude, longitude });
            },
            (error) => {
                reject(new Error(`Error al obtener la ubicación: ${error.message}`));
            }
        );
    });
}
