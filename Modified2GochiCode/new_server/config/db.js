const {createClient} = require('@supabase/supabase-js');
const dotenv = require('dotenv')
dotenv.config();

const supabaseURl = process.env.VITE_SUPABASE_URL;
const supabaseAnon = process.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseURl, supabaseAnon);

module.exports = supabase;