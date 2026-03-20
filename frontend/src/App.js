import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import InvoiceForm from "./components/InvoiceForm";
import InvoiceTable from "./components/InvoiceTable";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "";

function buildProtocolText(clientInfo) {
  const date = clientInfo.protocolDate
    ? new Date(clientInfo.protocolDate).toLocaleDateString("bg-BG")
    : ".......................";
  const contractor = clientInfo.clientSignature || "...............................................";
  const executor = clientInfo.executorSignature || "Александър Караманов";
  const completionDate = clientInfo.completionDate
    ? new Date(clientInfo.completionDate).toLocaleDateString("bg-BG")
    : ".......................";

  return `Днес ${date} Подписаните, представители на Възложителя - ${contractor} и ${executor} - представител на Изпълнителя, след проверка на място установихме, че към ${completionDate} са извършени и подлежат на заплащане въз основа на този протокол, следните натурални видове строително и монтажни работи`;
}

function App() {
  const [documentType, setDocumentType] = useState("protocol");
  const [documentNumber, setDocumentNumber] = useState("");
  const [protocolText, setProtocolText] = useState("");
  const [isProtocolTextAuto, setIsProtocolTextAuto] = useState(true);

  const [clientInfo, setClientInfo] = useState({
    completionText: "за установяване завършването и за изплащането на натурални видове СМР",
    executor: "Александър Строй ЕООД",
    object: "",
    protocolDate: "",
    completionDate: "",
    clientSignature: "",
    executorSignature: "Александър Караманов"
  });

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");

  const [savedDocuments, setSavedDocuments] = useState([]);
  const [activeDocumentId, setActiveDocumentId] = useState(null);

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", unit: "", quantity: "", price: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const showMessage = useCallback((text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  }, []);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;
  const selectedClientName = selectedClient?.name || "";
  const isEditingExistingDocument = Boolean(activeDocumentId);

  // Load clients on app start
  useEffect(() => {
    let isMounted = true;
    axios
      .get(`${API_URL}/api/clients`)
      .then((res) => {
        if (isMounted) setClients(res.data.clients || []);
      })
      .catch((err) => {
        console.warn("Could not load clients:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Rebuild protocol text when relevant fields change (only in auto mode)
  const { protocolDate, completionDate, clientSignature, executorSignature } = clientInfo;
  useEffect(() => {
    if (documentType === "protocol" && isProtocolTextAuto) {
      setProtocolText(buildProtocolText({ protocolDate, completionDate, clientSignature, executorSignature }));
    }
  }, [documentType, isProtocolTextAuto, protocolDate, completionDate, clientSignature, executorSignature]);

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClientInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentTypeChange = (e) => {
    const newType = e.target.value;
    setDocumentType(newType);
    if (newType === "offer") {
      setProtocolText("");
      setIsProtocolTextAuto(true);
    }
  };

  const handleDocumentNumberChange = (e) => {
    setDocumentNumber(e.target.value);
  };

  const handleProtocolTextChange = (e) => {
    setProtocolText(e.target.value);
    setIsProtocolTextAuto(false);
  };

  const handleSelectClient = async (clientId) => {
    setSelectedClientId(clientId);
    setActiveDocumentId(null);
    setSavedDocuments([]);

    if (!clientId) return;

    try {
      const res = await axios.get(`${API_URL}/api/clients/${clientId}/documents`);
      setSavedDocuments(res.data.documents || []);
    } catch (err) {
      console.warn("Could not load client documents:", err);
      showMessage("Неуспешно зареждане на записаните документи.", "error");
    }
  };

  const handleCreateClient = async () => {
    const name = newClientName.trim();
    if (!name) {
      showMessage("Моля, въведете име на клиент.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/clients`, { name });
      const createdClient = res.data.client;

      setClients((prev) => {
        const exists = prev.some((c) => c.id === createdClient.id);
        if (exists) return prev;
        return [createdClient, ...prev];
      });

      setNewClientName("");
      await handleSelectClient(createdClient.id);
      showMessage(res.data.created ? "Клиентът е създаден." : "Клиентът вече съществува — използван е съществуващият.", "success");
    } catch (err) {
      console.error("Create client failed:", err);
      showMessage("Неуспешно създаване на клиент.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClientId) {
      showMessage("Няма избран клиент.", "error");
      return;
    }

    const ok = window.confirm("Изтриване на клиента и всички негови документи? Това действие е необратимо.");
    if (!ok) return;

    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/api/clients/${selectedClientId}`);
      setClients((prev) => prev.filter((c) => c.id !== selectedClientId));
      setSelectedClientId("");
      setSavedDocuments([]);
      setActiveDocumentId(null);
      showMessage("Клиентът е изтрит.", "success");
    } catch (err) {
      console.error("Delete client failed:", err);
      showMessage("Неуспешно изтриване на клиент.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!selectedClientId) {
      showMessage("Няма избран клиент.", "error");
      return;
    }

    const ok = window.confirm("Изтриване на документа и всички негови версии? Това действие е необратимо.");
    if (!ok) return;

    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/api/clients/${selectedClientId}/documents/${documentId}`);

      if (activeDocumentId === documentId) {
        setActiveDocumentId(null);
      }

      const docsRes = await axios.get(`${API_URL}/api/clients/${selectedClientId}/documents`);
      setSavedDocuments(docsRes.data.documents || []);
      showMessage("Документът е изтрит.", "success");
    } catch (err) {
      console.error("Delete document failed:", err);
      showMessage("Неуспешно изтриване на документ.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVersion = async ({ versionId, documentId, versionLabel }) => {
    if (!selectedClientId) {
      showMessage("Няма избран клиент.", "error");
      return;
    }

    const ok = window.confirm(`Изтриване на версия ${versionLabel}? Това действие е необратимо.`);
    if (!ok) return;

    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/api/versions/${versionId}`);

      const docsRes = await axios.get(`${API_URL}/api/clients/${selectedClientId}/documents`);
      setSavedDocuments(docsRes.data.documents || []);
      showMessage("Версията е изтрита.", "success");
    } catch (err) {
      const apiError = err?.response?.data?.error;
      console.error("Delete version failed:", err);
      showMessage(apiError || "Неуспешно изтриване на версия.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewDocument = () => {
    setActiveDocumentId(null);
    setNewProduct({ name: "", unit: "", quantity: "", price: "" });
    setProducts([]);
    setClientInfo((prev) => ({
      ...prev,
      protocolDate: "",
      completionDate: "",
    }));
    showMessage("Нов документ.", "success");
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const addProduct = () => {
    if (Object.values(newProduct).some((val) => !val.toString().trim())) {
      showMessage("Моля, попълнете всички полета за продукта.", "error");
      return;
    }
    const quantity = Number(newProduct.quantity);
    const price = Number(newProduct.price);
    if (isNaN(quantity) || quantity <= 0 || isNaN(price) || price < 0) {
      showMessage("Количество трябва да е положително число, а цената – неотрицателно число.", "error");
      return;
    }
    setProducts((prev) => [...prev, { name: newProduct.name.trim(), unit: newProduct.unit.trim(), quantity, price }]);
    setNewProduct({ name: "", unit: "", quantity: "", price: "" });
  };

  const removeProduct = (index) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  function buildExportClientInfo(rawClientInfo) {
    const docType = rawClientInfo.documentType || documentType;
    const docNumber = rawClientInfo.documentNumber || documentNumber;
    const protocolTextValue = docType === "protocol" ? (rawClientInfo.protocolText ?? protocolText) : "";
    return {
      ...rawClientInfo,
      contractor: rawClientInfo.contractor || selectedClientName,
      documentType: docType,
      documentNumber: docNumber,
      protocolText: protocolTextValue,
      protocolTitle: docType === "protocol" ? "Приемо-предавателен протокол Акт обр.19" : "Оферта",
      protocolNumber: docNumber ? (docType === "protocol" ? `Протокол № ${docNumber}` : `Оферта № ${docNumber}`) : "",
      completionText: docType === "protocol" ? rawClientInfo.completionText : "",
    };
  }

  async function downloadPdf({ clientInfo: pdfClientInfo, products: pdfProducts }) {
    const response = await axios.post(
      `${API_URL}/export/pdf`,
      { clientInfo: pdfClientInfo, products: pdfProducts },
      { responseType: "blob" }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const pdfFile = new File([blob], "invoice.pdf", { type: "application/pdf" });

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: "Invoice PDF",
        });
      } catch {
        window.open(url, "_blank");
      }
    } else if (isMobile) {
      window.open(url, "_blank");
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "invoice.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  }

  const handleSave = async () => {
    if (!selectedClientId) {
      showMessage("Моля, изберете или създайте клиент.", "error");
      return;
    }

    if (products.length === 0) {
      showMessage("Няма добавени продукти за запазване.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const saveClientInfo = {
        ...clientInfo,
        contractor: selectedClientName,
        documentType,
        documentNumber,
        protocolText: documentType === "protocol" ? protocolText : "",
        completionText: documentType === "protocol" ? clientInfo.completionText : "",
      };

      const res = await axios.post(`${API_URL}/api/documents/save`, {
        clientId: selectedClientId,
        documentId: isEditingExistingDocument ? activeDocumentId : null,
        clientInfo: saveClientInfo,
        products,
      });

      if (isEditingExistingDocument) {
        setActiveDocumentId(res.data.documentId);
        showMessage(`Запазено като нова версия (${res.data.version.label}).`, "success");
      } else {
        // Stay in "new document" mode. The saved document can be edited from the list.
        setActiveDocumentId(null);
        showMessage(`Създаден е нов документ (версия ${res.data.version.label}).`, "success");
      }

      // Reset rules after save:
      // - clear product input fields
      // - clear date fields
      setNewProduct({ name: "", unit: "", quantity: "", price: "" });
      // Clear products list so user must explicitly add products before saving again.
      setProducts([]);
      // Keep protocol text auto-generated from the date/signature fields.
      if (documentType === "protocol") {
        setIsProtocolTextAuto(true);
      }
      setClientInfo((prev) => ({
        ...prev,
        protocolDate: "",
        completionDate: "",
      }));

      const docsRes = await axios.get(`${API_URL}/api/clients/${selectedClientId}/documents`);
      setSavedDocuments(docsRes.data.documents || []);
    } catch (err) {
      console.error("Save failed:", err);
      showMessage("Неуспешно запазване.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditVersion = async (versionId) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/versions/${versionId}`);
      const version = res.data.version;
      const doc = res.data.document;

      // Ensure we are on the right client
      if (doc.client_id && doc.client_id !== selectedClientId) {
        await handleSelectClient(doc.client_id);
      }
      setActiveDocumentId(doc.id);

      const saved = version.data || {};
      const savedClientInfo = saved.clientInfo || {};
      const savedProducts = saved.products || [];

      const savedDocType = savedClientInfo.documentType || "protocol";
      setDocumentType(savedDocType);
      setDocumentNumber(savedClientInfo.documentNumber || "");
      if (savedDocType === "protocol") {
        // Default to auto protocol text so it stays synced with date fields.
        setIsProtocolTextAuto(true);
        setProtocolText(buildProtocolText({
          protocolDate: savedClientInfo.protocolDate,
          completionDate: savedClientInfo.completionDate,
          clientSignature: savedClientInfo.clientSignature,
          executorSignature: savedClientInfo.executorSignature,
        }));
      } else {
        setProtocolText("");
        setIsProtocolTextAuto(true);
      }
      setClientInfo((prev) => ({
        ...prev,
        ...savedClientInfo,
        executor: prev.executor,
      }));
      setProducts(savedProducts);

      showMessage(`Заредена версия ${version.label}.`, "success");
    } catch (err) {
      console.error("Load version failed:", err);
      showMessage("Неуспешно зареждане на версия.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportVersion = async (versionId) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/versions/${versionId}`);
      const version = res.data.version;
      const saved = version.data || {};

      const savedClientInfo = saved.clientInfo || {};
      const savedProducts = saved.products || [];

      if (!savedProducts.length) {
        showMessage("Запазената версия няма продукти.", "error");
        return;
      }

      const exportClientInfo = buildExportClientInfo(savedClientInfo);
      await downloadPdf({ clientInfo: exportClientInfo, products: savedProducts });
      showMessage(`Експортирана версия ${version.label}.`, "success");
    } catch (err) {
      console.error("Export version failed:", err);
      showMessage("Неуспешен експорт на версия.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1>Фактуриране</h1>
        <p>Запази документи по клиенти с версии и експортирай PDF от записана версия.</p>
      </header>

      <section className="panel">
        <h2 className="section-title">Клиент</h2>
        <div className="form-row">
          <div className="input-with-label">
            <label htmlFor="clientSelect">Избери съществуващ клиент</label>
            <select
              id="clientSelect"
              value={selectedClientId}
              onChange={(e) => handleSelectClient(e.target.value)}
            >
              <option value="">— Избери —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-remove" onClick={handleDeleteClient} disabled={isLoading || !selectedClientId}>
            Изтрий клиента
          </button>
        </div>

        <div className="form-row">
          <div className="input-with-label">
            <label htmlFor="newClientName">Създай нов клиент</label>
            <input
              id="newClientName"
              type="text"
              placeholder="Име на клиента"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
          </div>
        </div>
        <div className="btn-group">
          <button
            className="btn btn-success"
            onClick={handleCreateClient}
            disabled={isLoading || !newClientName.trim()}
          >
            {isLoading ? "..." : "Създай клиента"}
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Данни за документа</h2>
        <div className="btn-group" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <p className="empty-table" style={{ margin: 0 }}>
            Режим: {isEditingExistingDocument ? "Редакция на записан документ" : "Нов документ"}
          </p>
          {isEditingExistingDocument && (
            <button className="btn" onClick={handleStartNewDocument} disabled={isLoading}>
              Нов документ
            </button>
          )}
        </div>
        <InvoiceForm
          clientInfo={clientInfo}
          clientName={selectedClientName}
          handleClientChange={handleClientChange}
          documentType={documentType}
          documentNumber={documentNumber}
          protocolText={protocolText}
          onDocumentTypeChange={handleDocumentTypeChange}
          onDocumentNumberChange={handleDocumentNumberChange}
          onProtocolTextChange={handleProtocolTextChange}
        />
      </section>

      <section className="panel">
        <h2 className="section-title">Добавяне на продукт</h2>
        <div className="form-row">
          <input type="text" name="name" placeholder="Наименование" value={newProduct.name} onChange={handleProductChange} />
          <input type="text" name="unit" placeholder="Мярка" value={newProduct.unit} onChange={handleProductChange} />
        </div>
        <div className="form-row">
          <input type="number" name="quantity" placeholder="Количество" value={newProduct.quantity} onChange={handleProductChange} min="0" step="any" inputMode="decimal" />
          <input type="number" name="price" placeholder="Единична цена без ДДС" value={newProduct.price} onChange={handleProductChange} min="0" step="0.01" inputMode="decimal" />
        </div>
        <button className="btn btn-add" onClick={addProduct}>Добави продукт</button>
      </section>

      <section className="panel">
        <h2 className="section-title">Продукти</h2>
        <InvoiceTable products={products} onRemove={removeProduct} />
      </section>

      <div className="btn-group">
        <button
          className="btn btn-export"
          onClick={handleSave}
          disabled={isLoading || !selectedClientId || products.length === 0}
          title={products.length === 0 ? "Добави поне един продукт, за да запазиш." : ""}
        >
          {isLoading ? "Запазване..." : isEditingExistingDocument ? "Запази нова версия" : "Запази (нов документ)"}
        </button>
      </div>

      <section className="panel">
        <h2 className="section-title">Запазени документи</h2>
        {!selectedClientId && <p className="empty-table">Избери клиент, за да видиш записаните документи.</p>}
        {selectedClientId && savedDocuments.length === 0 && <p className="empty-table">Няма записани документи за този клиент.</p>}
        {selectedClientId && savedDocuments.length > 0 && (
          <div className="saved-documents">
            {savedDocuments.map((doc) => (
              <div key={doc.id} className="saved-document">
                <div className="saved-document-header">
                  <div>
                    <div className="saved-document-title">
                      {doc.document_type === "offer" ? "Оферта" : "Протокол"}
                      {doc.document_number ? ` № ${doc.document_number}` : ""}
                      {activeDocumentId === doc.id ? " — (в редакция)" : ""}
                    </div>
                    <div className="saved-document-meta">
                      Последна промяна: {doc.updated_at ? new Date(doc.updated_at).toLocaleString("bg-BG") : ""}
                    </div>
                  </div>
                  <button className="btn btn-remove" onClick={() => handleDeleteDocument(doc.id)} disabled={isLoading}>
                    Изтрий
                  </button>
                </div>
                <div className="saved-versions">
                  {(doc.versions || []).map((v) => (
                    <div key={v.id} className="saved-version">
                      <div className="saved-version-info">
                        <div className="saved-version-label">Версия {v.label}</div>
                        <div className="saved-version-meta">
                          Последна промяна: {v.created_at ? new Date(v.created_at).toLocaleString("bg-BG") : ""}
                        </div>
                      </div>
                      <div className="saved-version-actions">
                        <button className="btn" onClick={() => handleEditVersion(v.id)} disabled={isLoading}>Редактирай</button>
                        <button className="btn" onClick={() => handleExportVersion(v.id)} disabled={isLoading}>Експорт</button>
                        {(doc.versions || []).length > 1 && (
                          <button
                            className="btn btn-remove"
                            onClick={() => handleDeleteVersion({ versionId: v.id, documentId: doc.id, versionLabel: v.label })}
                            disabled={isLoading}
                          >
                            Изтрий версия
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {message && <p className={`message ${messageType}`}>{message}</p>}
    </div>
  );
}

export default App;
