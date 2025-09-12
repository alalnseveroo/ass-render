import React, { useState } from 'react';

const NewChatModal = ({ onStartChat, onClose, error }) => {
  const [number, setNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (number.trim()) {
      onStartChat(number.trim());
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Iniciar nova conversa</h2>
        <p>Digite o número de telefone completo com código do país (ex: 5551999999999).</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ex: 5551999999999"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          {error && <p style={{color: 'red', fontSize: '0.9rem'}}>{error}</p>}
          <button type="submit" className="load-more-btn" style={{width: '100%', marginTop: '0.5rem'}}>Iniciar</button>
          <button type="button" className="cancel-btn" style={{width: '100%', marginTop: '0.5rem'}} onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </div>
  );
};

export default NewChatModal;
