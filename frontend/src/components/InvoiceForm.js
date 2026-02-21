import React, { useMemo } from "react";

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

function InvoiceForm({ clientInfo, handleClientChange }) {
  const protocolText = useMemo(() => buildProtocolText(clientInfo), [clientInfo]);

  return (
    <div>
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

      <div className="input-with-label">
        <label>Преглед на текста в протокола</label>
        <div className="preview-box">{protocolText}</div>
      </div>
    </div>
  );
}

export default InvoiceForm;
