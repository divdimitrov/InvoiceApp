import React from "react";

function InvoiceForm({ clientInfo, handleClientChange }) {
  return (
    <div>
      <div className="input-group">
        <input type="text" name="contractor" placeholder="Възложител" value={clientInfo.contractor} onChange={handleClientChange} />
        <input type="text" name="executor" placeholder="Изпълнител" value={clientInfo.executor} onChange={handleClientChange} />
        <input type="text" name="object" placeholder="Обект" value={clientInfo.object} onChange={handleClientChange} />
      </div>

      <div className="input-group">
        <input type="text" name="clientSignature" placeholder="За Възложителя" value={clientInfo.clientSignature} onChange={handleClientChange} />
        <input type="text" name="executorSignature" placeholder="За Изпълнителя" value={clientInfo.executorSignature} onChange={handleClientChange} />
      </div>

      <textarea name="protocolText" placeholder="Текст на протокола" value={clientInfo.protocolText} onChange={handleClientChange} rows={4}></textarea>
    </div>
  );
}

export default InvoiceForm;
