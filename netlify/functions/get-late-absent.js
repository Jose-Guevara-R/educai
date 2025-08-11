const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    // Asegurarse de que la solicitud sea GET
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        // Obtener fecha de los parámetros de consulta
        const date = event.queryStringParameters?.date;
        
        if (!date) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El parámetro "date" es requerido' })
            };
        }
        
        // Consultar estudiantes con tardanzas o faltas
        const { data, error } = await supabase
            .from('Asistencias')
            .select(`
                *,
                Estudiantes (nombre, grado, seccion, apoderado, telefono)
            `)
            .eq('fecha', date)
            .in('estado', ['tarde', 'falta']);
            
        if (error) {
            throw error;
        }
        
        // Formatear los datos para facilitar su uso
        const formattedData = data.map(item => ({
            id: item.id,
            dni: item.dni,
            fecha: item.fecha,
            hora: item.hora,
            estado: item.estado,
            estudiante: item.Estudiantes?.nombre,
            grado: item.Estudiantes?.grado,
            seccion: item.Estudiantes?.seccion,
            apoderado: item.Estudiantes?.apoderado,
            telefono: item.Estudiantes?.telefono,
            mensaje: `Hola ${item.Estudiantes?.apoderado}, le informamos que ${item.Estudiantes?.nombre} de ${item.Estudiantes?.grado}-${item.Estudiantes?.seccion} el día ${item.fecha} registró: ${item.estado}.`
        }));
        
        return {
            statusCode: 200,
            body: JSON.stringify(formattedData)
        };
        
    } catch (error) {
        console.error('Error en get-late-absent:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Error al obtener la lista de tardanzas y faltas: ' + error.message
            })
        };
    }
};