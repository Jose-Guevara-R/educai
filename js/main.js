document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const registerManualBtn = document.getElementById('register-manual');
    const manualDniInput = document.getElementById('manual-dni');
    const manualResultDiv = document.getElementById('manual-result');
    const dailyChartCanvas = document.getElementById('daily-chart');
    const lateAbsentListDiv = document.getElementById('late-absent-list');
    const exportLateAbsentBtn = document.getElementById('export-late-absent');
    const copyApiUrlBtn = document.getElementById('copy-api-url');
    const generateReportBtn = document.getElementById('generate-report');
    const reportGradeSelect = document.getElementById('report-grade');
    const reportSectionSelect = document.getElementById('report-section');
    const reportDateInput = document.getElementById('report-date');
    const reportResultDiv = document.getElementById('report-result');

    let dailyChart;
    let currentLateAbsentData = [];

    // Función para cambiar de página y disparar eventos
    function showPage(pageId) {
        pages.forEach(page => {
            if (page.id === pageId) {
                page.classList.remove('hidden');
                page.classList.add('active');
            } else {
                page.classList.add('hidden');
                page.classList.remove('active');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('text-accent', 'font-semibold');
            if (link.getAttribute('href') === `#${pageId}`) {
                link.classList.add('text-accent', 'font-semibold');
            }
        });

        // Cerrar menú móvil
        navMenu.classList.add('hidden');
        navMenu.classList.remove('flex');
        
        // Disparar un evento personalizado para que otras partes del código sepan que la página ha cambiado
        const event = new CustomEvent('pageChanged', { detail: { pageId } });
        document.dispatchEvent(event);
    }
    
    // Configurar el gráfico diario
    function setupDailyChart(data) {
        if (dailyChart) {
            dailyChart.destroy();
        }
        
        dailyChart = new Chart(dailyChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['A tiempo', 'Tardanzas', 'Faltas'],
                datasets: [{
                    data: [data.aTiempo, data.tardanzas, data.faltas],
                    backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                return `${tooltipItem.label}: ${tooltipItem.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Cargar datos para el dashboard
    async function loadDashboardData() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const attendanceData = await getReport({ date: today });

            const counts = attendanceData.reduce((acc, item) => {
                if (item.estado === 'a tiempo') acc.aTiempo++;
                if (item.estado === 'tarde') acc.tardanzas++;
                if (item.estado === 'falta') acc.faltas++;
                return acc;
            }, { aTiempo: 0, tardanzas: 0, faltas: 0 });

            setupDailyChart(counts);

            const lateAbsentData = await getLateAbsent(today);
            currentLateAbsentData = lateAbsentData;
            renderLateAbsentList(lateAbsentData);

        } catch (error) {
            showModal('Error', 'No se pudo cargar el dashboard: ' + error.message, 'error');
            console.error('Error al cargar datos del dashboard:', error);
        }
    }

    // Renderizar la lista de tardanzas y faltas
    function renderLateAbsentList(data) {
        lateAbsentListDiv.innerHTML = '';
        if (data && data.length > 0) {
            data.forEach(item => {
                const statusColor = item.estado === 'tarde' ? 'text-warning' : 'text-danger';
                const html = `
                    <div class="list-item bg-gray-50 p-3 rounded-md shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                        <div>
                            <span class="font-semibold">${item.estudiante} (${item.grado}-${item.seccion})</span>
                            <p class="text-sm ${statusColor}">${item.estado.charAt(0).toUpperCase() + item.estado.slice(1)} a las ${item.hora}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button class="btn bg-accent text-white px-3 py-1 rounded text-sm btn-copy-message" data-message="${encodeURIComponent(item.mensaje)}">
                                Copiar Mensaje
                            </button>
                            <a href="https://wa.me/${item.telefono}?text=${encodeURIComponent(item.mensaje)}" target="_blank" class="btn bg-green-500 text-white px-3 py-1 rounded text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </a>
                        </div>
                    </div>
                `;
                lateAbsentListDiv.innerHTML += html;
            });
        } else {
            lateAbsentListDiv.innerHTML = '<p class="text-center text-gray-500">No hay tardanzas ni faltas registradas hoy.</p>';
        }
        // Asegurarse de que los iconos se rendericen después de inyectar el HTML
        lucide.createIcons();
    }

    // Manejar el envío del formulario de registro manual
    registerManualBtn.addEventListener('click', async () => {
        const dni = manualDniInput.value;
        if (!dni) {
            showModal('Error', 'El campo DNI no puede estar vacío.', 'error');
            return;
        }

        try {
            const result = await registerAttendance(dni);
            if (result.success) {
                showModal('Éxito', `Asistencia registrada para ${result.student.nombre}. Estado: ${result.status}`, 'success');
                manualResultDiv.innerHTML = `<p class="mt-4 text-success text-center">Registro exitoso para ${result.student.nombre}</p>`;
            } else {
                showModal('Error', result.error, 'error');
                manualResultDiv.innerHTML = `<p class="mt-4 text-danger text-center">Error: ${result.error}</p>`;
            }
        } catch (error) {
            showModal('Error', 'Ocurrió un error al registrar la asistencia. ' + error.message, 'error');
            manualResultDiv.innerHTML = `<p class="mt-4 text-danger text-center">Error: ${error.message}</p>`;
        }
    });

    // Manejar la generación de reportes
    generateReportBtn.addEventListener('click', async () => {
        const filters = {
            grade: reportGradeSelect.value || null,
            section: reportSectionSelect.value || null,
            date: reportDateInput.value || null,
        };

        try {
            reportResultDiv.innerHTML = `<p class="text-center text-gray-500">Generando reporte...</p>`;
            const reportData = await getReport(filters);
            
            if (reportData.length > 0) {
                const tableHtml = `
                    <div class="overflow-x-auto bg-white rounded-lg shadow-lg p-4">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grado</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sección</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${reportData.map(item => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.Estudiantes?.nombre || 'N/A'}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.dni}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.Estudiantes?.grado || 'N/A'}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.Estudiantes?.seccion || 'N/A'}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.fecha}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.hora}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.estado}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                reportResultDiv.innerHTML = tableHtml;
            } else {
                reportResultDiv.innerHTML = `<p class="mt-4 text-center text-gray-500">No se encontraron resultados para los filtros seleccionados.</p>`;
            }

        } catch (error) {
            showModal('Error', 'Ocurrió un error al generar el reporte. ' + error.message, 'error');
            reportResultDiv.innerHTML = `<p class="mt-4 text-danger text-center">Error: ${error.message}</p>`;
        }
    });

    // Manejar la exportación de la lista de tardanzas y faltas a CSV
    exportLateAbsentBtn.addEventListener('click', () => {
        if (currentLateAbsentData.length > 0) {
            const header = ['Estudiante', 'Grado', 'Sección', 'DNI', 'Fecha', 'Hora', 'Estado', 'Teléfono'];
            const rows = currentLateAbsentData.map(item => [
                item.estudiante,
                item.grado,
                item.seccion,
                item.dni,
                item.fecha,
                item.hora,
                item.estado,
                item.telefono
            ].join(','));
            const csvContent = [header.join(','), ...rows].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'tardanzas_faltas.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showModal('Éxito', 'El archivo CSV se ha generado y descargado correctamente.', 'success');
        } else {
            showModal('Advertencia', 'No hay datos para exportar. Intente cargar la lista primero.', 'warning');
        }
    });

    // Manejar la copia de la URL de la API
    copyApiUrlBtn.addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        const apiUrl = `${window.location.origin}/.netlify/functions/get-late-absent?date=${today}`;
        
        // Uso de execCommand porque navigator.clipboard puede no estar disponible en algunos contextos de iframe
        const tempInput = document.createElement('textarea');
        tempInput.value = apiUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);

        showModal('Éxito', 'URL de la API copiada al portapapeles.', 'success');
    });

    // Manejar la copia del mensaje individual
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-copy-message')) {
            const message = decodeURIComponent(e.target.getAttribute('data-message'));
            
            const tempInput = document.createElement('textarea');
            tempInput.value = message;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            showModal('Éxito', 'Mensaje copiado al portapapeles.', 'success');
        }
    });
    
    // Event listeners para enlaces de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            showPage(pageId);
        });
    });

    // Toggle para menú móvil
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('hidden');
        navMenu.classList.toggle('flex');
    });
    
    // Inicializar la aplicación en la página de inicio
    showPage('home');

    // Escuchar el evento de cambio de página
    document.addEventListener('pageChanged', (e) => {
        if (e.detail.pageId === 'dashboard') {
            loadDashboardData();
        }
    });
});
