document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM para la navegación
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    // Referencias a elementos del modal
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalIcon = document.getElementById('modal-icon');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    /**
     * Muestra un modal con un mensaje personalizado.
     * @param {string} title - El título del modal.
     * @param {string} message - El mensaje principal.
     * @param {string} type - El tipo de mensaje ('success', 'error', 'info').
     */
    function showModal(title, message, type) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Limpiar iconos anteriores
        modalIcon.innerHTML = '';

        // Definir icono y colores según el tipo de mensaje
        let iconSvg;
        if (type === 'success') {
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-success"><path d="M20 6 9 17l-5-5"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x text-danger"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
        } else {
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
        }
        modalIcon.innerHTML = iconSvg;
        
        // Mostrar el modal
        modal.classList.remove('hidden');
    }

    // Event listener para cerrar el modal
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // Función para cambiar de página
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
            page.classList.add('hidden'); // Ocultar páginas con Tailwind
        });
        
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            targetPage.classList.add('active');
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

        // Disparar evento para que otros scripts sepan que la página ha cambiado
        const pageChangeEvent = new CustomEvent('pageChanged', { detail: { pageId } });
        document.dispatchEvent(pageChangeEvent);
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

    // Inicializar la primera página
    showPage('home');

    /* =========================================================================
       Sección de Registro Manual de Asistencia
       ========================================================================= */
    const manualRegisterForm = document.getElementById('manual-register-form');
    if (manualRegisterForm) {
        manualRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dni = document.getElementById('manual-dni').value;
            if (!dni) {
                showModal('Error', 'Debe ingresar un DNI.', 'error');
                return;
            }

            try {
                // Se asume que registerAttendance es una función global definida en api.js
                const response = await registerAttendance(dni);

                if (response.success) {
                    showModal('Asistencia Registrada', `Asistencia para ${response.student.nombre} (${response.dni}) registrada correctamente. Estado: ${response.status}.`, 'success');
                } else {
                    showModal('Error', response.error || 'Ocurrió un error al registrar la asistencia.', 'error');
                }
            } catch (error) {
                console.error('Error en el registro manual:', error);
                showModal('Error de Conexión', 'No se pudo conectar con el servidor. Asegúrese de que Netlify Dev esté corriendo y vuelva a intentarlo.', 'error');
            }
        });
    }
    
    /* =========================================================================
       Sección de Reportes
       ========================================================================= */
    const reportForm = document.getElementById('report-form');
    const reportResult = document.getElementById('report-result');
    const generateReportBtn = document.getElementById('generate-report');
    
    if (reportForm && reportResult && generateReportBtn) {
        generateReportBtn.addEventListener('click', async () => {
            const grade = document.getElementById('report-grade').value;
            const section = document.getElementById('report-section').value;
            const date = document.getElementById('report-date').value;
            
            try {
                // Se asume que getReport es una función global definida en api.js
                const reportData = await getReport({ grade, section, date });
                
                // Mostrar los resultados del reporte
                if (reportData.length > 0) {
                    reportResult.innerHTML = `
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    ${reportData.map(item => `
                                        <tr>
                                            <td class="px-6 py-4 whitespace-nowrap">${item.Estudiantes.nombre}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">${item.dni}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">${item.fecha}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">${item.hora}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">${item.estado}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                } else {
                    reportResult.innerHTML = `
                        <p class="text-center text-gray-500">No se encontraron registros para los filtros seleccionados.</p>
                    `;
                }
            } catch (error) {
                console.error('Error al generar el reporte:', error);
                showModal('Error', 'No se pudo generar el reporte. Intente de nuevo o verifique la conexión.', 'error');
            }
        });
    }

    // Código para el Dashboard (ejemplo de renderizado con Chart.js)
    const dashboardPage = document.getElementById('dashboard');
    if (dashboardPage) {
        // En un entorno real, aquí iría la lógica para cargar los datos
        // y renderizar los gráficos. Por ahora, es un ejemplo estático.
        const ctx = document.getElementById('attendanceChart').getContext('2d');
        const attendanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
                datasets: [{
                    label: 'Asistencia Diaria',
                    data: [20, 25, 18, 22, 24],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Configuración para el botón de copiar URL de la API
    const copyApiUrlBtn = document.getElementById('copy-api-url-btn');
    const lateAbsentDate = document.getElementById('late-absent-date');
    if (copyApiUrlBtn && lateAbsentDate) {
        copyApiUrlBtn.addEventListener('click', async () => {
            const date = lateAbsentDate.value;
            if (!date) {
                showModal('Error', 'Debe seleccionar una fecha para generar la URL.', 'error');
                return;
            }
            const apiUrl = `${window.location.origin}/.netlify/functions/get-late-absent?date=${date}`;
            
            // Usar una función de copiar al portapapeles que no dependa de navigator.clipboard
            // ya que podría no funcionar en el entorno de Canvas.
            const tempInput = document.createElement('textarea');
            tempInput.value = apiUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            showModal('Copiado', 'URL de la API copiada al portapapeles.', 'success');
        });
    }
    
    // Configuración para copiar mensajes individuales
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-copy-message')) {
            const message = e.target.getAttribute('data-message');
            
            const tempInput = document.createElement('textarea');
            tempInput.value = message;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            showModal('Copiado', 'Mensaje copiado al portapapeles.', 'success');
        }
    });

});
