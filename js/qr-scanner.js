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
            // Verificar si scanResultDiv existe antes de modificarlo
            if (scanResultDiv) {
                scanResultDiv.innerHTML = `
                    <div class="result-container error">
                        <h3>Error</h3>
                        <p>No se pudo acceder a la cámara. Asegúrese de haber otorgado los permisos necesarios.</p>
                    </div>
                `;
            }
        });
    }

    /**
     * Manejador de escaneo exitoso.
     * @param {string} decodedText - El texto decodificado del código QR.
     * @param {object} decodedResult - El objeto de resultado completo.
     */
    async function onScanSuccess(decodedText, decodedResult) {
        // Detener el escáner
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().then(ignore => {
                console.log("Escáner detenido al escanear QR");
            }).catch(err => {
                console.error(`Error al detener el escáner: ${err}`);
            });
        }
        
        // Verificar si el elemento de resultado existe
        if (!scanResultDiv) {
            console.error("El elemento 'scan-result' no fue encontrado en el DOM.");
            return;
        }

        scanResultDiv.innerHTML = `
            <div class="p-4 bg-white rounded-lg shadow-lg">
                <p class="text-gray-700 text-center">Escaneando...</p>
            </div>
        `;
        
        try {
            // Llamar a la función de la API para registrar asistencia
            const result = await registerAttendance(decodedText);
            
            // Si la respuesta es exitosa
            if (result.success) {
                // Actualizar la interfaz de usuario con los detalles del estudiante
                scanResultDiv.innerHTML = `
                    <div class="p-4 bg-white rounded-lg shadow-lg">
                        <p class="text-success text-center font-bold text-lg">✅ Asistencia Registrada</p>
                        <p class="mt-2"><span class="font-bold">Estudiante:</span> ${result.student.nombre}</p>
                        <p><span class="font-bold">Grado:</span> ${result.student.grado} - ${result.student.seccion}</p>
                        <p><span class="font-bold">Estado:</span> ${result.status}</p>
                        <p><span class="font-bold">Fecha:</span> ${result.date} - ${result.time}</p>
                    </div>
                `;
            } else {
                // Si la respuesta indica un error
                scanResultDiv.innerHTML = `
                    <div class="p-4 bg-white rounded-lg shadow-lg">
                        <p class="text-danger text-center font-bold text-lg">❌ Error</p>
                        <p class="text-gray-700 text-center">${result.error || 'Ocurrió un error al registrar la asistencia.'}</p>
                    </div>
                `;
            }
        } catch (error) {
            // Si hay un error de conexión
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
        const targetPage = e.detail.pageId;
        if (targetPage === 'scan') {
            startScanner();
        } else if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().then(ignore => {
                console.log("Escáner detenido al cambiar de página");
            }).catch(err => {
                console.error(`Error al detener el escáner: ${err}`);
            });
        }
    });

    // Iniciar el escáner si la página inicial es la de escaneo
    if (scanPage && scanPage.classList.contains('active')) {
        startScanner();
    }
});
