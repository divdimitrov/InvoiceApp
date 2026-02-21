import React, { useState, useCallback } from "react";
import axios from "axios";
import InvoiceForm from "./components/InvoiceForm";
import InvoiceTable from "./components/InvoiceTable";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [clientInfo, setClientInfo] = useState({
    protocolTitle: "Приемо-предавателен протокол Акт обр.19",
    protocolNumber: "Протокол №2",
    completionText: "за установяване завършването и за изплащането на натурални видове СМР",
    contractor: "",
    executor: "Александър Строй ЕООД",
    object: "",
    protocolDate: "",
    completionDate: "",
    clientSignature: "",
    executorSignature: "Александър Караманов"
  });

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

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClientInfo((prev) => ({ ...prev, [name]: value }));
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

  const handleExportPDF = async () => {
    if (products.length === 0) {
      showMessage("Няма добавени продукти за експорт.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/export/pdf`,
        { clientInfo, products },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "invoice.pdf");
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      showMessage("PDF файлът беше успешно изтеглен!", "success");
    } catch (error) {
      console.error("Грешка при експортиране:", error);
      showMessage("Възникна грешка при експортирането!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Фактуриране</h1>
      <InvoiceForm clientInfo={clientInfo} handleClientChange={handleClientChange} />

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

      <InvoiceTable products={products} onRemove={removeProduct} />

      <div className="btn-group">
        <button className="btn btn-export" onClick={handleExportPDF} disabled={isLoading}>
          {isLoading ? "Генериране..." : "Експорт в PDF"}
        </button>
      </div>

      {message && <p className={`message ${messageType}`}>{message}</p>}
    </div>
  );
}

export default App;
