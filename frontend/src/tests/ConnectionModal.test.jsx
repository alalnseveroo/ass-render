import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ConnectionModal from '../components/ConnectionModal';

describe('ConnectionModal', () => {
  it('deve renderizar o esqueleto de loading quando não há QR code', () => {
    // Renderiza o componente sem passar a prop qrCodeUrl
    render(<ConnectionModal onCancel={() => {}} />);
    
    // Procura por um elemento que tenha a classe 'skeleton-qrcode'
    const skeletonElement = document.querySelector('.skeleton-qrcode');
    
    // Verifica se o elemento foi encontrado no "documento"
    expect(skeletonElement).toBeInTheDocument();
    
    // Verifica se a imagem do QR code NÃO está na tela
    const qrImage = screen.queryByAltText('QR Code');
    expect(qrImage).not.toBeInTheDocument();
  });

  it('deve renderizar a imagem do QR code quando a URL é fornecida', () => {
    const fakeQrUrl = 'data:image/png;base64,fake_qr_code_string';
    
    // Renderiza o componente passando a prop qrCodeUrl
    render(<ConnectionModal qrCodeUrl={fakeQrUrl} onCancel={() => {}} />);
    
    // Procura pela imagem usando o seu "alt text"
    const qrImage = screen.getByAltText('QR Code');
    
    // Verifica se a imagem está na tela e se tem o src correto
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute('src', fakeQrUrl);
  });
});
