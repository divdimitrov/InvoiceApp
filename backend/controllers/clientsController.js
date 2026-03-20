const { getSupabaseAdmin } = require("../services/supabaseClient");

function normalizeClientName(name) {
  const raw = String(name ?? "");
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";

  // Lowercase + remove diacritics for stable matching
  try {
    return trimmed
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

async function listClients(_req, res, next) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, normalized_name, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ clients: data });
  } catch (err) {
    return next(err);
  }
}

async function createClient(req, res, next) {
  try {
    const { name } = req.body || {};
    const normalized = normalizeClientName(name);

    if (!normalized) {
      return res.status(400).json({ error: "Client name is required" });
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: findError } = await supabase
      .from("clients")
      .select("id, name, normalized_name, created_at")
      .eq("normalized_name", normalized)
      .maybeSingle();

    if (findError) return res.status(500).json({ error: findError.message });

    if (existing) {
      return res.status(200).json({ client: existing, created: false });
    }

    const prettyName = String(name).replace(/\s+/g, " ").trim();
    const { data: inserted, error: insertError } = await supabase
      .from("clients")
      .insert({ name: prettyName, normalized_name: normalized })
      .select("id, name, normalized_name, created_at")
      .single();

    if (insertError) return res.status(500).json({ error: insertError.message });

    return res.status(201).json({ client: inserted, created: true });
  } catch (err) {
    return next(err);
  }
}

async function deleteClient(req, res, next) {
  try {
    const { clientId } = req.params;
    if (!clientId) return res.status(400).json({ error: "clientId is required" });

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) return res.status(500).json({ error: error.message });

    // Documents + versions are removed via ON DELETE CASCADE.
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listClients,
  createClient,
  deleteClient,
  normalizeClientName,
};
