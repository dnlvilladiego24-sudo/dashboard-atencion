import { createClient } from '@supabase/supabase-js';

// Estas variables se configuran en Vercel como Environment Variables
// Para desarrollo local, crea un archivo .env en la raíz del proyecto con:
// VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
// VITE_SUPABASE_ANON_KEY=tu-anon-key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://PLACEHOLDER.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PLACEHOLDER';

export const supabase = createClient(supabaseUrl, supabaseKey);
