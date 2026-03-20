const express = require("express");
const { listClients, createClient, deleteClient } = require("../controllers/clientsController");
const {
  supabaseHealth,
  listClientDocuments,
  saveDocument,
  getVersion,
  deleteClientDocument,
  deleteVersion,
} = require("../controllers/documentsController");

const router = express.Router();

router.get("/supabase/health", supabaseHealth);

router.get("/clients", listClients);
router.post("/clients", createClient);
router.delete("/clients/:clientId", deleteClient);

router.get("/clients/:clientId/documents", listClientDocuments);
router.delete("/clients/:clientId/documents/:documentId", deleteClientDocument);
router.post("/documents/save", saveDocument);

router.get("/versions/:versionId", getVersion);
router.delete("/versions/:versionId", deleteVersion);

module.exports = router;
