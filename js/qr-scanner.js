document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM para la página de escaneo
    const qrReaderDiv = document.getElementById('qr-reader');
    const scanResultDiv = document.getElementById('scan-result');
    const scanPage = document.getElementById('scan');

    // Variable para el objeto del escáner
    let html5QrcodeScanner = null;

    /**
     * Inicia el escáner de código QR.
     * La función comprueba si el escáner ya está corriendo para evitar reinicios.
     */
    function startScanner() {
        // Detener cualquier escáner existente para evitar conflictos
        if (html5QrcodeScanner && html5QrcodeScanner.getState() === 2) { // Estado 2 es ESCANER_EN_EJECUCION
            return;
        }

        // Crear una nueva instancia del escáner si no existe
        if (!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5Qrcode("qr-reader");
        }
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            supportedScanFormats: [
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };
        
        // Iniciar el escáner
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        ).catch(err => {
            console.error(`Error al iniciar el escáner: ${err}`);
            showModal('Error', 'No se pudo acceder a la cámara. Asegúrese de haber otorgado los permisos necesarios.', 'error');
        });
    }

    /**
     * Detiene el escáner de código QR si está en ejecución.
     */
    function stopScanner() {
        if (html5QrcodeScanner && html5QrcodeScanner.getState() === 2) {
            html5QrcodeScanner.stop().then(() => {
                console.log("Escáner detenido.");
            }).catch(err => {
                console.error(`Error al detener el escáner: ${err}`);
            });
        }
    }

    /**
     * Manejador de éxito del escaneo.
     * Procesa el DNI escaneado y registra la asistencia.
     * @param {string} decodedText - El texto decodificado del QR.
     * @param {object} decodedResult - El objeto de resultado completo.
     */
    async function onScanSuccess(decodedText, decodedResult) {
        stopScanner();
        scanResultDiv.innerHTML = `<p class="text-center text-gray-500">Escaneado. Procesando...</p>`;

        try {
            const result = await registerAttendance(decodedText);

            if (result.success) {
                showModal(
                    '¡Asistencia Registrada!',
                    `DNI: ${decodedText}<br>Estudiante: ${result.student.nombre}<br>Estado: ${result.status}`,
                    'success'
                );
                scanResultDiv.innerHTML = `
                    <div class="p-4 bg-white rounded-lg shadow-lg">
                        <p class="text-success text-center font-bold text-lg">✅ Asistencia registrada</p>
                        <p class="text-gray-700 text-center">Estudiante: ${result.student.nombre}</p>
                        <p class="text-gray-700 text-center">Estado: ${result.status}</p>
                    </div>
                `;
            } else {
                showModal('Error', result.error, 'error');
                scanResultDiv.innerHTML = `
                    <div class="p-4 bg-white rounded-lg shadow-lg">
                        <p class="text-danger text-center font-bold text-lg">❌ Error al registrar</p>
                        <p class="text-gray-700 text-center">${result.error}</p>
                    </div>
                `;
            }
        } catch (error) {
            showModal('Error', 'Ocurrió un error al conectar con el servidor. Por favor, intente de nuevo.', 'error');
            console.error('Error en onScanSuccess:', error);
            scanResultDiv.innerHTML = `
                <div class="p-4 bg-white rounded-lg shadow-lg">
                    <p class="text-danger text-center font-bold text-lg">❌ Error de conexión</p>
                    <p class="text-gray-700 text-center">No se pudo conectar al servidor. Intente de nuevo.</p>
                </div>
            `;
        }

        // Agregar botón para volver a escanear
        const scanAgainButton = document.createElement('button');
        scanAgainButton.textContent = 'Escanear de Nuevo';
        scanAgainButton.className = 'mt-4 w-full bg-primary text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105';
        scanAgainButton.addEventListener('click', () => {
            scanResultDiv.innerHTML = '';
            startScanner();
        });
        scanResultDiv.appendChild(scanAgainButton);
    }
    
    /**
     * Manejador de error del escaneo.
     * Muestra un mensaje de error si el escaneo falla.
     * @param {string} errorMessage - Mensaje de error.
     */
    function onScanError(errorMessage) {
        // No hacer nada si el error es de tipo "cámara no encontrada",
        // ya que el error se maneja al iniciar el escáner.
    }
    
    // Escuchar el evento de cambio de página
    document.addEventListener('pageChanged', (e) => {
        if (e.detail.pageId === 'scan') {
            startScanner();
        } else {
            stopScanner();
        }
    });
});
