const { getSupabaseAdmin } = require("../services/supabaseClient");

function computeNextVersionLabel(existingLabels) {
  // Spec: first label "1". Then "1-1", "1-2", ...
  if (!existingLabels || existingLabels.length === 0) return "1";

  let maxSuffix = 0;
  for (const label of existingLabels) {
    const m = /^1-(\d+)$/.exec(String(label));
    if (m) {
      const n = Number(m[1]);
      if (!Number.isNaN(n)) maxSuffix = Math.max(maxSuffix, n);
    }
  }

  return `1-${maxSuffix + 1}`;
}

async function supabaseHealth(_req, res) {
  try {
    getSupabaseAdmin();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

async function listClientDocuments(req, res, next) {
  try {
    const { clientId } = req.params;
    if (!clientId) return res.status(400).json({ error: "clientId is required" });

    const supabase = getSupabaseAdmin();

    const { data: documents, error: docsError } = await supabase
      .from("client_documents")
      .select("id, created_at, updated_at, document_type, document_number")
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (docsError) return res.status(500).json({ error: docsError.message });

    if (!documents || documents.length === 0) {
      return res.json({ documents: [] });
    }

    const docIds = documents.map((d) => d.id);

    const { data: versions, error: versionsError } = await supabase
      .from("client_document_versions")
      .select("id, document_id, label, created_at")
      .in("document_id", docIds)
      .order("created_at", { ascending: false });

    if (versionsError) return res.status(500).json({ error: versionsError.message });

    const versionsByDoc = new Map();
    for (const v of versions || []) {
      const list = versionsByDoc.get(v.document_id) || [];
      list.push(v);
      versionsByDoc.set(v.document_id, list);
    }

    const hydrated = documents.map((d) => ({
      ...d,
      versions: versionsByDoc.get(d.id) || [],
    }));

    return res.json({ documents: hydrated });
  } catch (err) {
    return next(err);
  }
}

async function saveDocument(req, res, next) {
  try {
    const { clientId, documentId, clientInfo, products } = req.body || {};

    if (!clientId) return res.status(400).json({ error: "clientId is required" });
    if (!clientInfo) return res.status(400).json({ error: "clientInfo is required" });
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "products must be a non-empty array" });
    }

    const supabase = getSupabaseAdmin();

    let activeDocumentId = documentId || null;

    if (!activeDocumentId) {
      const { data: insertedDoc, error: insertDocError } = await supabase
        .from("client_documents")
        .insert({
          client_id: clientId,
          updated_at: new Date().toISOString(),
          document_type: clientInfo.documentType || null,
          document_number: clientInfo.documentNumber || null,
        })
        .select("id")
        .single();

      if (insertDocError) return res.status(500).json({ error: insertDocError.message });
      activeDocumentId = insertedDoc.id;
    } else {
      const { data: found, error: foundError } = await supabase
        .from("client_documents")
        .select("id")
        .eq("id", activeDocumentId)
        .eq("client_id", clientId)
        .maybeSingle();

      if (foundError) return res.status(500).json({ error: foundError.message });
      if (!found) return res.status(404).json({ error: "Document not found for this client" });

      const { error: updErr } = await supabase
        .from("client_documents")
        .update({
          updated_at: new Date().toISOString(),
          document_type: clientInfo.documentType || null,
          document_number: clientInfo.documentNumber || null,
        })
        .eq("id", activeDocumentId);

      if (updErr) return res.status(500).json({ error: updErr.message });
    }

    const { data: existingVersions, error: versionsError } = await supabase
      .from("client_document_versions")
      .select("label")
      .eq("document_id", activeDocumentId);

    if (versionsError) return res.status(500).json({ error: versionsError.message });

    const existingLabels = (existingVersions || []).map((v) => v.label);
    const label = computeNextVersionLabel(existingLabels);

    const payload = { clientInfo, products };

    const { data: insertedVersion, error: insertVersionError } = await supabase
      .from("client_document_versions")
      .insert({
        document_id: activeDocumentId,
        label,
        data: payload,
      })
      .select("id, label, created_at")
      .single();

    if (insertVersionError) return res.status(500).json({ error: insertVersionError.message });

    return res.status(201).json({
      documentId: activeDocumentId,
      version: insertedVersion,
    });
  } catch (err) {
    return next(err);
  }
}

async function getVersion(req, res, next) {
  try {
    const { versionId } = req.params;
    if (!versionId) return res.status(400).json({ error: "versionId is required" });

    const supabase = getSupabaseAdmin();

    const { data: version, error } = await supabase
      .from("client_document_versions")
      .select("id, document_id, label, data, created_at")
      .eq("id", versionId)
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const { data: doc, error: docError } = await supabase
      .from("client_documents")
      .select("id, client_id, document_type, document_number")
      .eq("id", version.document_id)
      .single();

    if (docError) return res.status(500).json({ error: docError.message });

    return res.json({ version, document: doc });
  } catch (err) {
    return next(err);
  }
}

async function deleteClientDocument(req, res, next) {
  try {
    const { clientId, documentId } = req.params;
    if (!clientId) return res.status(400).json({ error: "clientId is required" });
    if (!documentId) return res.status(400).json({ error: "documentId is required" });

    const supabase = getSupabaseAdmin();

    // Ensure it belongs to the client
    const { data: found, error: foundError } = await supabase
      .from("client_documents")
      .select("id")
      .eq("id", documentId)
      .eq("client_id", clientId)
      .maybeSingle();

    if (foundError) return res.status(500).json({ error: foundError.message });
    if (!found) return res.status(404).json({ error: "Document not found for this client" });

    const { error: delError } = await supabase
      .from("client_documents")
      .delete()
      .eq("id", documentId);

    if (delError) return res.status(500).json({ error: delError.message });

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

async function deleteVersion(req, res, next) {
  try {
    const { versionId } = req.params;
    if (!versionId) return res.status(400).json({ error: "versionId is required" });

    const supabase = getSupabaseAdmin();

    const { data: version, error: versionError } = await supabase
      .from("client_document_versions")
      .select("id, document_id")
      .eq("id", versionId)
      .maybeSingle();

    if (versionError) return res.status(500).json({ error: versionError.message });
    if (!version) return res.status(404).json({ error: "Version not found" });

    const { count, error: countError } = await supabase
      .from("client_document_versions")
      .select("id", { count: "exact", head: true })
      .eq("document_id", version.document_id);

    if (countError) return res.status(500).json({ error: countError.message });
    if ((count || 0) <= 1) {
      return res.status(400).json({
        error: "Не може да се изтрие последната версия. Изтрий целия документ.",
      });
    }

    const { error: delError } = await supabase
      .from("client_document_versions")
      .delete()
      .eq("id", versionId);

    if (delError) return res.status(500).json({ error: delError.message });

    // Touch the document so ordering reflects the change.
    await supabase
      .from("client_documents")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", version.document_id);

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  supabaseHealth,
  listClientDocuments,
  saveDocument,
  getVersion,
  deleteClientDocument,
  deleteVersion,
};
