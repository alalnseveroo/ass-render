const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL e Key precisam ser definidas no arquivo .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
