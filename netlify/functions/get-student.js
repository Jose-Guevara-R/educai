const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
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
        // Obtener DNI de los parámetros de consulta
        const dni = event.queryStringParameters?.dni;
        
        if (!dni) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El parámetro DNI es requerido' })
            };
        }
        
        // Obtener datos del estudiante
        const { data: student, error } = await supabase
            .from('Estudiantes')
            .select('nombre, grado, seccion') // Solo seleccionar los campos necesarios
            .eq('dni', dni)
            .single();
            
        if (error) {
            // Manejar el caso de que el estudiante no se encuentre
            if (error.code === 'PGRST116') {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Estudiante no encontrado' })
                };
            }
            throw error;
        }
        
        // Respuesta exitosa
        return {
            statusCode: 200,
            body: JSON.stringify(student)
        };
        
    } catch (error) {
        console.error('Error en get-student:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Error al obtener datos del estudiante: ' + error.message
            })
        };
    }
};
