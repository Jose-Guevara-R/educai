// Este archivo maneja la lógica principal de la aplicación, incluyendo la navegación y la interacción del usuario.

document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de Navegación ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalIcon = document.getElementById('modal-icon');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Función para mostrar el modal de mensajes
    function showModal(title, message, type = 'info') {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        let iconHtml;
        if (type === 'success') {
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-success"><path d="M20 6 9 17l-5-5"/></svg>`;
            modalIcon.classList.remove('bg-danger-100', 'bg-warning-100');
            modalIcon.classList.add('bg-success-100');
        } else if (type === 'error') {
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x text-danger"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
            modalIcon.classList.remove('bg-success-100', 'bg-warning-100');
            modalIcon.classList.add('bg-danger-100');
        } else if (type === 'warning') {
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle text-warning"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
            modalIcon.classList.remove('bg-success-100', 'bg-danger-100');
            modalIcon.classList.add('bg-warning-100');
        } else {
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
            modalIcon.classList.remove('bg-success-100', 'bg-danger-100', 'bg-warning-100');
            modalIcon.classList.add('bg-primary-100');
        }

        modalIcon.innerHTML = iconHtml;
        modal.classList.remove('hidden');
    }

    // Event listener para cerrar el modal
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // Event listener para cerrar el modal haciendo clic fuera de él
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    // Función para cambiar de página
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Disparar un evento para que otras partes del código sepan que la página ha cambiado
            document.dispatchEvent(new CustomEvent('pageChanged', { detail: { pageId } }));
            
            // Si la página es 'dashboard', cargar los datos y el gráfico
            if (pageId === 'dashboard') {
                loadDashboardData();
            }
        }
        
        // Actualizar enlace activo
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${pageId}`) {
                link.classList.add('active');
            }
        });
        
        // Cerrar menú móvil
        navMenu.classList.remove('active');
    }

    // Event listeners para enlaces de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            showPage(pageId);
        });
    });

    // Toggle para menú móvil
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // --- Lógica del Dashboard ---
    let attendanceChart;

    async function loadDashboardData() {
        const today = new Date().toISOString().split('T')[0];
        const loadingDiv = document.createElement('div');
        loadingDiv.textContent = 'Cargando datos del dashboard...';
        document.getElementById('dashboard').appendChild(loadingDiv);

        try {
            // Se asume que getReport devuelve todos los registros si no se pasan filtros
            const allAttendance = await getReport({ date: today });
            
            const presentCount = allAttendance.filter(item => item.estado === 'a tiempo').length;
            const lateCount = allAttendance.filter(item => item.estado === 'tarde').length;
            const absentCount = allAttendance.filter(item => item.estado === 'falta').length;

            document.getElementById('present-count').textContent = presentCount;
            document.getElementById('late-count').textContent = lateCount;
            document.getElementById('absent-count').textContent = absentCount;
            
            // Verificar si el elemento canvas existe antes de intentar crear el gráfico
            const chartCanvas = document.getElementById('attendance-chart');
            if (chartCanvas) {
                const ctx = chartCanvas.getContext('2d');
                if (attendanceChart) {
                    attendanceChart.destroy();
                }
                
                attendanceChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Presentes', 'Tardanzas', 'Faltas'],
                        datasets: [{
                            data: [presentCount, lateCount, absentCount],
                            backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Asistencia de Hoy'
                            }
                        }
                    }
                });
            }

        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
            showModal('Error', 'No se pudieron cargar los datos del dashboard. Intente de nuevo más tarde.', 'error');
        } finally {
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }
    }
    
    // --- Lógica de Reportes ---
    const loadLateAbsentBtn = document.getElementById('load-late-absent');
    const lateAbsentDate = document.getElementById('late-absent-date');
    const lateAbsentList = document.getElementById('late-absent-list');
    const exportExcelBtn = document.getElementById('export-excel');
    const copyApiUrlBtn = document.getElementById('copy-api-url');
    let latestLateAbsentData = [];
    
    if (loadLateAbsentBtn) {
        loadLateAbsentBtn.addEventListener('click', async () => {
            const date = lateAbsentDate.value;
            if (!date) {
                showModal('Error', 'Por favor, seleccione una fecha.', 'error');
                return;
            }
            
            lateAbsentList.innerHTML = 'Cargando...';
            try {
                const data = await getLateAbsent(date);
                latestLateAbsentData = data;
                renderLateAbsentList(data);
            } catch (error) {
                console.error('Error al cargar tardanzas y faltas:', error);
                showModal('Error', 'No se pudo cargar la lista. Intente nuevamente.', 'error');
                lateAbsentList.innerHTML = '';
            }
        });
    }
    
    function renderLateAbsentList(data) {
        if (data.length === 0) {
            lateAbsentList.innerHTML = '<p class="text-gray-500">No hay tardanzas o faltas registradas para esta fecha.</p>';
            return;
        }
        
        let html = '<ul class="divide-y divide-gray-200">';
        data.forEach(item => {
            html += `
                <li class="p-4 hover:bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <p class="text-lg font-medium">${item.estudiante} (${item.estado})</p>
                        <p class="text-sm text-gray-500">Grado: ${item.grado}-${item.seccion}, Hora: ${item.hora}</p>
                    </div>
                    <button class="btn btn-copy-message mt-2 sm:mt-0" data-message="${encodeURIComponent(item.mensaje)}">
                        Copiar Mensaje
                    </button>
                </li>
            `;
        });
        html += '</ul>';
        lateAbsentList.innerHTML = html;
    }
    
    // Exportar a Excel
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            if (latestLateAbsentData.length > 0) {
                const csv = [
                    ['Estudiante', 'DNI', 'Grado', 'Sección', 'Fecha', 'Hora', 'Estado', 'Apoderado', 'Teléfono'],
                    ...latestLateAbsentData.map(item => [
                        item.estudiante,
                        item.dni,
                        item.grado,
                        item.seccion,
                        item.fecha,
                        item.hora,
                        item.estado,
                        item.apoderado,
                        item.telefono
                    ])
                ].map(e => e.join(',')).join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                if (link.download !== undefined) {
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `reporte-tardanzas-faltas-${lateAbsentDate.value}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                showModal('Éxito', 'Reporte exportado a Excel.', 'success');
            } else {
                showModal('Atención', 'Primero debe cargar la lista de tardanzas y faltas.', 'warning');
            }
        });
    }

    // Copiar URL de la API
    if (copyApiUrlBtn) {
        copyApiUrlBtn.addEventListener('click', () => {
            const date = lateAbsentDate.value;
            if (!date) {
                showModal('Error', 'Por favor, seleccione una fecha.', 'error');
                return;
            }
            const apiUrl = `${window.location.origin}/.netlify/functions/get-late-absent?date=${date}`;
            
            // Usar document.execCommand para compatibilidad con iframes
            const tempInput = document.createElement('input');
            document.body.appendChild(tempInput);
            tempInput.value = apiUrl;
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            showModal('Éxito', 'URL de la API copiada al portapapeles.', 'success');
        });
    }
    
    // Copiar mensaje individual
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-copy-message')) {
            const message = decodeURIComponent(e.target.getAttribute('data-message'));
            
            // Usar document.execCommand para compatibilidad con iframes
            const tempInput = document.createElement('input');
            document.body.appendChild(tempInput);
            tempInput.value = message;
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            showModal('Éxito', 'Mensaje copiado al portapapeles.', 'success');
        }
    });

    // --- Lógica del formulario de registro manual ---
    const manualForm = document.getElementById('manual-form');
    const manualDniInput = document.getElementById('manual-dni');
    const manualResult = document.getElementById('manual-result');

    if (manualForm) {
        manualForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dni = manualDniInput.value;
            manualResult.innerHTML = 'Registrando...';
            try {
                const result = await registerAttendance(dni);
                if (result.success) {
                    manualResult.innerHTML = `
                        <div class="result-container success">
                            <h3>✅ Asistencia Registrada</h3>
                            <p><strong>Estudiante:</strong> ${result.student.nombre}</p>
                            <p><strong>Estado:</strong> ${result.status}</p>
                            <p><strong>Hora:</strong> ${result.time}</p>
                        </div>
                    `;
                } else if (result.error) {
                    manualResult.innerHTML = `
                        <div class="result-container error">
                            <h3>❌ Error</h3>
                            <p>${result.error}</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error en registro manual:', error);
                manualResult.innerHTML = `
                    <div class="result-container error">
                        <h3>❌ Error de Conexión</h3>
                        <p>No se pudo registrar la asistencia. Intente de nuevo.</p>
                    </div>
                `;
            }
        });
    }

    // --- Lógica de Reportes ---
    const generateReportBtn = document.getElementById('generate-report');
    const reportGradeSelect = document.getElementById('report-grade');
    const reportSectionSelect = document.getElementById('report-section');
    const reportDateInput = document.getElementById('report-date');
    const reportResultDiv = document.getElementById('report-result');
    
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', async () => {
            const filters = {
                grade: reportGradeSelect.value || null,
                section: reportSectionSelect.value || null,
                date: reportDateInput.value || null
            };
            
            if (!filters.grade && !filters.section && !filters.date) {
                showModal('Atención', 'Seleccione al menos un filtro para generar el reporte.', 'warning');
                return;
            }
            
            reportResultDiv.innerHTML = 'Generando reporte...';
            try {
                const result = await generateReport({ type: 'daily', ...filters });
                if (result.success && result.pdf) {
                    const link = document.createElement('a');
                    link.href = `data:application/pdf;base64,${result.pdf}`;
                    link.download = result.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showModal('Éxito', 'Reporte PDF generado y descargado.', 'success');
                } else {
                    reportResultDiv.innerHTML = '<div class="result-container error"><p>Error al generar el reporte.</p></div>';
                    showModal('Error', 'No se pudo generar el reporte.', 'error');
                }
            } catch (error) {
                console.error('Error al generar reporte:', error);
                reportResultDiv.innerHTML = '<div class="result-container error"><p>Error de conexión o datos.</p></div>';
                showModal('Error', 'Ocurrió un error al generar el reporte.', 'error');
            }
        });
    }

    // Mostrar la página de inicio por defecto
    showPage('home');
});
