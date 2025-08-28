const {createClient} = require('@supabase/supabase-js');
const dotenv = require('dotenv')
dotenv.config();

const supabaseURl = process.env.supabase_url;
const supabaseAnon = process.env.supabase_anon;

const supabase = createClient(supabaseURl, supabaseAnon);

module.exports = supabase;