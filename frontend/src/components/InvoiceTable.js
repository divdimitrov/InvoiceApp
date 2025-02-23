import React from "react";

function InvoiceTable({ products }) {
  const totalAmount = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
  const vatAmount = totalAmount * 0.2;
  const grandTotal = totalAmount + vatAmount;

  return (
    <div>
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
    </div>
  );
}

export default InvoiceTable;
