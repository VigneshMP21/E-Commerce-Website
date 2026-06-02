const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const missingVariables = [];

if (!SUPABASE_URL) {
  missingVariables.push('SUPABASE_URL');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  missingVariables.push('SUPABASE_SERVICE_ROLE_KEY');
}

if (missingVariables.length) {
  throw new Error(`Missing required Supabase environment variable(s): ${missingVariables.join(', ')}`);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = supabase;
