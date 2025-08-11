const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Definir la hora de entrada y el tiempo de tolerancia
const START_TIME = '08:00'; // Hora de inicio de clases
const TOLERANCE_TIME = '08:15'; // Hora límite para considerar 'tardanza'

/**
 * Función handler para la función serverless de Netlify.
 * Procesa una solicitud para registrar la asistencia de un estudiante.
 */
exports.handler = async (event) => {
    // Asegurarse de que la solicitud sea POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        // Obtener datos del request
        const { dni } = JSON.parse(event.body);
        
        if (!dni) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El DNI es requerido.' })
            };
        }

        // Obtener fecha y hora actual
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].substring(0, 5); // Formato HH:mm
        
        // Verificar si ya existe un registro para hoy
        const { data: existingAttendance, error: existingError } = await supabase
            .from('Asistencias')
            .select('id')
            .eq('dni', dni)
            .eq('fecha', date);
            
        if (existingError) {
            throw existingError;
        }
        
        if (existingAttendance && existingAttendance.length > 0) {
            return {
                statusCode: 409, // Conflicto: el registro ya existe
                body: JSON.stringify({ 
                    success: false,
                    error: 'Ya existe un registro de asistencia para este estudiante hoy.'
                })
            };
        }
        
        // Obtener datos del estudiante
        const { data: student, error: studentError } = await supabase
            .from('Estudiantes')
            .select('nombre, grado, seccion')
            .eq('dni', dni)
            .single();
            
        if (studentError) {
            // Manejar el caso de que el estudiante no se encuentre
            if (studentError.code === 'PGRST116') {
                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        success: false,
                        error: 'Estudiante no encontrado con ese DNI.'
                    })
                };
            }
            throw studentError;
        }
        
        // Lógica para determinar el estado de asistencia
        let status = 'a tiempo';
        const [startHour, startMinute] = START_TIME.split(':').map(Number);
        const [toleranceHour, toleranceMinute] = TOLERANCE_TIME.split(':').map(Number);
        const [currentHour, currentMinute] = time.split(':').map(Number);
        
        // Convertir todo a minutos para comparar
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const startTimeInMinutes = startHour * 60 + startMinute;
        const toleranceTimeInMinutes = toleranceHour * 60 + toleranceMinute;
        
        if (currentTimeInMinutes > startTimeInMinutes) {
            if (currentTimeInMinutes <= toleranceTimeInMinutes) {
                status = 'tarde';
            } else {
                status = 'falta';
            }
        }
        
        // Registrar asistencia en la base de datos
        const { data: attendance, error: attendanceError } = await supabase
            .from('Asistencias')
            .insert([
                {
                    dni,
                    fecha: date,
                    hora: time,
                    estado: status,
                    observaciones: ''
                }
            ]);
            
        if (attendanceError) {
            throw attendanceError;
        }
        
        // Respuesta exitosa
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                student,
                status,
                date,
                time
            })
        };
        
    } catch (error) {
        console.error('Error en register-attendance:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: 'Error al registrar asistencia: ' + error.message 
            })
        };
    }
};
