import React, { useState } from "react";
import axios from "axios";
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

    setProducts((prev) => [
      ...prev,
      { ...newProduct, quantity: Number(newProduct.quantity), price: Number(newProduct.price) },
    ]);
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

  const totalAmount = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
  const vatAmount = totalAmount * 0.2;
  const grandTotal = totalAmount + vatAmount;

  return (
    <div className="container">
      <h1>Фактуриране</h1>

      <div className="input-group">
        <input type="text" name="contractor" placeholder="Възложител" value={clientInfo.contractor} onChange={handleClientChange} />
        <input type="text" name="executor" placeholder="Изпълнител" value={clientInfo.executor} onChange={handleClientChange} />
        <input type="text" name="object" placeholder="Обект" value={clientInfo.object} onChange={handleClientChange} />
      </div>

      <div className="input-group">
        <input 
          type="text" 
          name="clientSignature" 
          placeholder="За Възложителя" 
          value={clientInfo.clientSignature} 
          onChange={handleClientChange} 
        />
        <input 
          type="text" 
          name="executorSignature" 
          placeholder="За Изпълнителя" 
          value={clientInfo.executorSignature} 
          onChange={handleClientChange} 
        />
      </div>

      <textarea name="protocolText" placeholder="Текст на протокола" value={clientInfo.protocolText} onChange={handleClientChange} rows={4}></textarea>

      <div className="input-group">
        <input type="text" name="name" placeholder="Наименование" value={newProduct.name} onChange={handleProductChange} />
        <input type="text" name="unit" placeholder="Мярка" value={newProduct.unit} onChange={handleProductChange} />
        <input type="number" name="quantity" placeholder="Количество" value={newProduct.quantity} onChange={handleProductChange} />
        <input type="number" name="price" placeholder="Единична цена без ДДС" value={newProduct.price} onChange={handleProductChange} />
        <button className="btn" onClick={addProduct}>Добави</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Наименование</th>
            <th>Мярка</th>
            <th>Количество</th>
            <th>Ед. цена без ДДС</th>
            <th>Обща цена без ДДС</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{product.name}</td>
              <td>{product.unit}</td>
              <td>{product.quantity}</td>
              <td>{product.price.toFixed(2)}</td>
              <td>{(product.quantity * product.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="summary">
        <p><strong>Обща стойност СМР без ДДС:</strong> {totalAmount.toFixed(2)} лв.</p>
        <p><strong>ДДС 20%:</strong> {vatAmount.toFixed(2)} лв.</p>
        <p className="total"><strong>Общо за фактуриране с ДДС:</strong> {grandTotal.toFixed(2)} лв.</p>
      </div>

      <div className="btn-group">
        <button className="btn" onClick={handleExportPDF}>Експорт в PDF</button>
      </div>

      {message && <p className={`message ${messageType}`}>{message}</p>}
    </div>
  );
}

export default App;
