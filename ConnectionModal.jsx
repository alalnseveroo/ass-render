import React from 'react';
import LoadingDots from './LoadingDots';

const ConnectionModal = ({ qrCodeUrl, onCancel }) => {
    const isConnecting = !qrCodeUrl;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Conectar nova sessão</h2>
                {isConnecting && <LoadingDots />}
                <div className="qrcode-container">
                    {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="QR Code" />
                    ) : (
                        <div className="skeleton skeleton-qrcode"></div>
                    )}
                </div>
                <button className="cancel-btn" onClick={onCancel}>
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default ConnectionModal;
