import React from "react";

function InvoiceForm({ clientInfo, handleClientChange, documentType, documentNumber, protocolText, onDocumentTypeChange, onDocumentNumberChange, onProtocolTextChange }) {
  return (
    <div>
      <div className="form-row">
        <div className="input-with-label">
          <label htmlFor="documentType">Тип документ</label>
          <select id="documentType" name="documentType" value={documentType} onChange={onDocumentTypeChange}>
            <option value="protocol">Протокол</option>
            <option value="offer">Оферта</option>
          </select>
        </div>
        <div className="input-with-label">
          <label htmlFor="documentNumber">Номер на документа</label>
          <input type="text" id="documentNumber" name="documentNumber" placeholder="Напр. 1.2.3.4" value={documentNumber} onChange={onDocumentNumberChange} />
        </div>
      </div>
      <div className="form-row">
        <input type="text" name="contractor" placeholder="Възложител" value={clientInfo.contractor} onChange={handleClientChange} />
        <input type="text" name="executor" value={clientInfo.executor} readOnly className="readonly-input" />
      </div>

      <div className="form-row">
        <input type="text" name="object" placeholder="Обект" value={clientInfo.object} onChange={handleClientChange} />
      </div>

      <div className="form-row">
        <div className="input-with-label">
          <label htmlFor="protocolDate">Дата на протокола</label>
          <input type="date" id="protocolDate" name="protocolDate" value={clientInfo.protocolDate} onChange={handleClientChange} />
        </div>
        <div className="input-with-label">
          <label htmlFor="completionDate">Дата на завършване</label>
          <input type="date" id="completionDate" name="completionDate" value={clientInfo.completionDate} onChange={handleClientChange} />
        </div>
      </div>

      <div className="form-row">
        <input type="text" name="clientSignature" placeholder="За Възложителя" value={clientInfo.clientSignature} onChange={handleClientChange} />
        <input type="text" name="executorSignature" placeholder="За Изпълнителя" value={clientInfo.executorSignature} onChange={handleClientChange} />
      </div>

      {documentType === "protocol" && (
        <div className="input-with-label">
          <label htmlFor="protocolText">Текст на протокола</label>
          <textarea id="protocolText" name="protocolText" value={protocolText} onChange={onProtocolTextChange} rows={4} />
        </div>
      )}
    </div>
  );
}

export default InvoiceForm;
