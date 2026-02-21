import React from "react";

function InvoiceTable({ products, onRemove }) {
  const totalAmount = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
  const vatAmount = totalAmount * 0.2;
  const grandTotal = totalAmount + vatAmount;

  if (products.length === 0) {
    return <p className="empty-table">Няма добавени продукти.</p>;
  }

  return (
    <div>
      {/* Desktop/tablet table view */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Видове работа</th>
              <th>Ед.мярка</th>
              <th>К-во</th>
              <th>Ед.цена</th>
              <th>Цена</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{product.name}</td>
                <td>{product.unit}</td>
                <td>{product.quantity}</td>
                <td>{product.price.toFixed(2)} €</td>
                <td>{(product.quantity * product.price).toFixed(2)} €</td>
                <td>
                  <button className="btn-remove" onClick={() => onRemove(index)} title="Изтрий">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="product-cards">
        {products.map((product, index) => (
          <div className="product-card" key={index}>
            <div className="product-card-header">
              <div>
                <span className="product-number">#{index + 1}</span>{" "}
                <span className="product-name">{product.name}</span>
              </div>
              <button className="btn-remove" onClick={() => onRemove(index)} title="Изтрий">
                ✕
              </button>
            </div>
            <div className="product-card-row">
              <span className="label">Ед.мярка</span>
              <span className="value">{product.unit}</span>
            </div>
            <div className="product-card-row">
              <span className="label">К-во</span>
              <span className="value">{product.quantity}</span>
            </div>
            <div className="product-card-row">
              <span className="label">Ед.цена</span>
              <span className="value">{product.price.toFixed(2)} €</span>
            </div>
            <div className="product-card-row">
              <span className="label">Цена</span>
              <span className="value">{(product.quantity * product.price).toFixed(2)} €</span>
            </div>
          </div>
        ))}
      </div>

      <div className="summary">
        <p><strong>Общо СМР:</strong> {totalAmount.toFixed(2)} €</p>
        <p><strong>ДДС:</strong> {vatAmount.toFixed(2)} €</p>
        <p className="total"><strong>Всичко:</strong> {grandTotal.toFixed(2)} €</p>
      </div>
    </div>
  );
}

export default InvoiceTable;
