import React, { useState } from "react";
import axios from "axios";
import InvoiceForm from "./components/InvoiceForm";
import InvoiceTable from "./components/InvoiceTable";
import "./App.css";

function App() {
  const [clientInfo, setClientInfo] = useState({
    protocolTitle: "Приемо-предавателен протокол Акт обр.19",
    protocolNumber: "Протокол №2",
    completionText: "за установяване завършването и за изплащането на натурални видове СМР",
    contractor: "",
    executor: "",
    object: "",
    protocolText: "Днес ....................... Подписаните, представители на Възложителя-.............................................. и Александър Караманов - представител на Изпълнителя,след проверка на място установихме,че към ....................... са извършени и подлежат на заплащане въз основа на този протокол,следните натурални видове строително и монтажни работи",
    clientSignature: "",
    executorSignature: "Александър Караманов"
  });

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", unit: "", quantity: "", price: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClientInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const addProduct = () => {
    if (Object.values(newProduct).some((val) => !val)) return;
    setProducts((prev) => [...prev, { ...newProduct, quantity: Number(newProduct.quantity), price: Number(newProduct.price) }]);
    setNewProduct({ name: "", unit: "", quantity: "", price: "" });
  };

  const handleExportPDF = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/export/pdf",
        { clientInfo, products },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "invoice.pdf");
      document.body.appendChild(link);
      link.click();

      setMessage("PDF файлът беше успешно изтеглен!");
      setMessageType("success");
    } catch (error) {
      console.error("Грешка при експортиране:", error);
      setMessage("Възникна грешка при експортирането!");
      setMessageType("error");
    }
  };

  return (
    <div className="container">
      <h1>Фактуриране</h1>
      <InvoiceForm clientInfo={clientInfo} handleClientChange={handleClientChange} />

      <div className="input-group">
        <input type="text" name="name" placeholder="Наименование" value={newProduct.name} onChange={handleProductChange} />
        <input type="text" name="unit" placeholder="Мярка" value={newProduct.unit} onChange={handleProductChange} />
        <input type="number" name="quantity" placeholder="Количество" value={newProduct.quantity} onChange={handleProductChange} />
        <input type="number" name="price" placeholder="Единична цена без ДДС" value={newProduct.price} onChange={handleProductChange} />
        <button className="btn" onClick={addProduct}>Добави</button>
      </div>

      <InvoiceTable products={products} />

      <button className="btn" onClick={handleExportPDF}>Експорт в PDF</button>
      {message && <p className={`message ${messageType}`}>{message}</p>}
    </div>
  );
}

export default App;
