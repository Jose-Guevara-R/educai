const { createClient } = require('@supabase/supabase-js');
const { jsPDF } = require('jspdf');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    // Asegurarse de que la solicitud sea POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        // Obtener parámetros del body
        const { grade, section, date } = JSON.parse(event.body);

        // Construir consulta base
        let query = supabase
            .from('Asistencias')
            .select(`
                *,
                Estudiantes (nombre, grado, seccion)
            `);
        
        // Aplicar filtros si existen
        if (date) {
            query = query.eq('fecha', date);
        }
        
        if (grade) {
            query = query.eq('Estudiantes.grado', grade);
        }
        
        if (section) {
            query = query.eq('Estudiantes.seccion', section);
        }

        // Ejecutar consulta
        const { data: reportData, error } = await query;
        
        if (error) {
            throw error;
        }

        if (!reportData || reportData.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: false,
                    message: 'No hay datos para generar el reporte con los filtros seleccionados.',
                    pdf: null
                })
            };
        }

        // Configurar y generar el PDF con jspdf
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Reporte de Asistencia", 20, 20);
        doc.setFontSize(12);
        doc.text(`Fecha del Reporte: ${date || 'Todos'}`, 20, 30);
        doc.text(`Grado: ${grade || 'Todos'}`, 20, 37);
        doc.text(`Sección: ${section || 'Todos'}`, 20, 44);

        let yPosition = 60;
        doc.setFontSize(10);
        
        // Encabezados de la tabla
        doc.text('Estudiante', 20, yPosition);
        doc.text('Grado', 80, yPosition);
        doc.text('Sección', 100, yPosition);
        doc.text('Fecha', 130, yPosition);
        doc.text('Hora', 160, yPosition);
        doc.text('Estado', 180, yPosition);
        yPosition += 5;
        doc.line(20, yPosition, 190, yPosition); // Línea de separación
        yPosition += 5;

        // Cargar los datos en la tabla
        reportData.forEach(item => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
                doc.setFontSize(10);
            }
            doc.text(item.Estudiantes?.nombre || '', 20, yPosition);
            doc.text(item.Estudiantes?.grado || '', 80, yPosition);
            doc.text(item.Estudiantes?.seccion || '', 100, yPosition);
            doc.text(item.fecha || '', 130, yPosition);
            doc.text(item.hora || '', 160, yPosition);
            doc.text(item.estado || '', 180, yPosition);
            
            yPosition += 10;
        });
        
        // Fecha de generación
        doc.setFontSize(10);
        doc.text(
            `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
            20,
            280
        );
        
        // Convertir PDF a base64
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        
        // Devolver el PDF en base64
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                pdf: pdfBase64,
                filename: `reporte-asistencia-${date || 'completo'}-${Date.now()}.pdf`
            })
        };
        
    } catch (error) {
        console.error('Error en generate-report:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Error al generar el reporte: ' + error.message
            })
        };
    }
};
