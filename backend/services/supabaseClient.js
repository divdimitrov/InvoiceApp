const { createClient } = require("@supabase/supabase-js");

let cachedClient = null;

function createExposedError(message, code) {
  const err = new Error(message);
  err.code = code;
  err.expose = true;
  return err;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw createExposedError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the backend environment.",
      "SUPABASE_NOT_CONFIGURED"
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}

module.exports = {
  getSupabaseAdmin,
};
