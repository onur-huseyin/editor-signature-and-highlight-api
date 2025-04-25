import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import styled from 'styled-components';

interface SignatureCanvasProps {
  onSave: (signature: string, signerInfo: { name: string; title?: string; tcNo?: string; company?: string }) => void;
  onClose: () => void;
}

interface SignerInfo {
  name: string;
  title?: string;
  tcNo?: string;
  company?: string;
}

// SignaturePad için özel tip tanımı
interface SignaturePadInstance extends SignaturePad {
  penColor: string;
  maxWidth: number;
  minWidth: number;
}

const CanvasContainer = styled.div`
  position: fixed;
  overflow-x: scroll;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  width: 600px;
  max-width: 90vw;
`;

const Canvas = styled.div`
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 16px;
  
  canvas {
    width: 100% !important;
    height: 200px !important;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: #0066cc;
          border-color: #0066cc;
          color: white;
          &:hover {
            background-color: #0052a3;
          }
        `;
      case 'danger':
        return `
          background-color: #dc3545;
          border-color: #dc3545;
          color: white;
          &:hover {
            background-color: #c82333;
          }
        `;
      default:
        return `
          background-color: #f8f9fa;
          border-color: #ddd;
          color: #333;
          &:hover {
            background-color: #e2e6ea;
          }
        `;
    }
  }}
`;

const Overlay = styled.div`
  position: fixed;
  overflow: scroll;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 8px;
`;

const ToolbarContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
`;

const ColorPicker = styled.input`
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const RangeInput = styled.input`
  width: 100%;
  margin: 8px 0;
`;

const PreviewContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  text-align: center;
`;

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onClose }) => {
  const signaturePadRef = useRef<SignaturePadInstance>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(2);
  const [signerInfo, setSignerInfo] = useState<SignerInfo>({ name: '', title: '', tcNo: '', company: '' });
  const [showPreview, setShowPreview] = useState(false);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
      setShowPreview(false);
    }
  };

  const handleSave = () => {
    if (signaturePadRef.current && !isEmpty && signerInfo.name) {
      const signatureData = signaturePadRef.current.toDataURL();
      onSave(signatureData, signerInfo);
    } else {
      alert('Lütfen imzanızı atın ve adınızı girin.');
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setPenColor(newColor);
    if (signaturePadRef.current) {
      signaturePadRef.current.penColor = newColor;
    }
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    setPenSize(newSize);
    if (signaturePadRef.current) {
      signaturePadRef.current.maxWidth = newSize;
      signaturePadRef.current.minWidth = newSize;
    }
  };

  const handlePreview = () => {
    if (!isEmpty && signerInfo.name) {
      setShowPreview(true);
    }
  };

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignerInfo(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <CanvasContainer>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>İmzanızı Çizin</h3>
        
        <FormGroup>
          <Label>İmzalayan Bilgileri</Label>
          <Input
            type="text"
            name="name"
            value={signerInfo.name}
            onChange={handleInfoChange}
            placeholder="Ad Soyad *"
            required
          />
          <Input
            type="text"
            name="title"
            value={signerInfo.title}
            onChange={handleInfoChange}
            placeholder="Unvan"
          />
          <Input
            type="text"
            name="tcNo"
            value={signerInfo.tcNo}
            onChange={handleInfoChange}
            placeholder="TC Kimlik No"
          />
          <Input
            type="text"
            name="company"
            value={signerInfo.company}
            onChange={handleInfoChange}
            placeholder="Şirket"
          />
        </FormGroup>

        <ToolbarContainer>
          <div>
            <Label>Renk</Label>
            <ColorPicker
              type="color"
              value={penColor}
              onChange={handleColorChange}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Kalınlık: {penSize}px</Label>
            <RangeInput
              type="range"
              min="1"
              max="10"
              value={penSize}
              onChange={handleSizeChange}
            />
          </div>
        </ToolbarContainer>

        <Canvas>
          <SignaturePad
            ref={signaturePadRef}
            canvasProps={{
              className: 'signature-canvas'
            }}
            onBegin={handleBegin}
            penColor={penColor}
            maxWidth={penSize}
            minWidth={penSize}
          />
        </Canvas>

        {showPreview && !isEmpty && (
          <PreviewContainer>
            <img 
              src={signaturePadRef.current?.toDataURL()} 
              alt="İmza Önizleme" 
              style={{ maxWidth: '100%', maxHeight: '100px' }}
            />
            <div style={{ marginTop: 8, fontSize: '14px', color: '#666' }}>
              <div>{signerInfo.name}</div>
              {signerInfo.title && <div>{signerInfo.title}</div>}
              {signerInfo.company && <div>{signerInfo.company}</div>}
            </div>
          </PreviewContainer>
        )}

        <ButtonContainer>
          <Button onClick={onClose}>İptal</Button>
          <Button onClick={handleClear} variant="danger" disabled={isEmpty}>
            Temizle
          </Button>
          <Button onClick={handlePreview} disabled={isEmpty || !signerInfo.name}>
            Önizle
          </Button>
          <Button onClick={handleSave} variant="primary" disabled={isEmpty || !signerInfo.name}>
            İmzayı Kaydet
          </Button>
        </ButtonContainer>
      </CanvasContainer>
    </>
  );
};

export default SignatureCanvas; 