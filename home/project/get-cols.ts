import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('units').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("COLUMNS:", Object.keys(data[0]));
  } else {
    console.log("No data or error:", error);
  }
}
run();
