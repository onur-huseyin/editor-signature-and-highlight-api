import React, { useState } from 'react';
import styled from 'styled-components';
import ContractEditor from './components/ContractEditor';
import type { HighlightData } from './components/ContractEditor';
import type { SignatureData } from './components/ContractEditor';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 20px;
`;

const Section = styled.section`
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
`;

const SectionTitle = styled.h2`
  color: #444;
  margin-bottom: 20px;
`;

const App: React.FC = () => {
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [signatures, setSignatures] = useState<SignatureData[]>([]);

  const handleHighlightAdd = (highlight: HighlightData) => {
    setHighlights(prev => [...prev, highlight]);
  };

  const handleHighlightUpdate = (oldComment: string, newComment: string) => {
    setHighlights(prev => 
      prev.map(h => h.comment === oldComment ? { ...h, comment: newComment } : h)
    );
  };

  const handleSignatureAdd = (signature: SignatureData) => {
    setSignatures(prev => [...prev, signature]);
  };

  return (
    <AppContainer>
      <Title>Sözleşme Düzenleyici</Title>
      <ContractEditor
        initialContent="Bu bir örnek sözleşme metnidir. İmzalamak için aşağıdaki alana tıklayınız."
        highlights={highlights}
        onHighlightAdd={handleHighlightAdd}
        onHighlightUpdate={handleHighlightUpdate}
        onSignatureAdd={handleSignatureAdd}
      />
    </AppContainer>
  );
};

export default App; 