import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import styled from 'styled-components';
import SignatureCanvas from './SignatureCanvas';

export interface HighlightData {
  start: number;
  end: number;
  text: string;
  comment: string;
}

export interface SignatureData {
  id: string;
  image: string;
  position: { x: number; y: number };
  date: string;
  signer: {
    name: string;
    title?: string;
    tcNo?: string;
    company?: string;
  };
  size: { width: number; height: number };
}

interface ContractEditorProps {
  initialContent?: string;
  highlights?: HighlightData[];
  onHighlightAdd?: (highlight: HighlightData) => void;
  onHighlightUpdate?: (oldComment: string, newComment: string) => void;
  onSignatureAdd?: (signature: SignatureData) => void;
}

const EditorContainer = styled.div`
  margin: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  position: relative;
  overflow: scroll;
`;

const Tooltip = styled.div<{ visible: boolean; x: number; y: number; isEditing: boolean }>`
  position: fixed;
  display: ${props => props.visible ? 'block' : 'none'};
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  background: white;
  border: 1px solid #ccc;
  padding: 28px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  min-width: 200px;
  transform: translate(-50%, -100%);
  margin-top: -10px;
  pointer-events: auto;

  &:before {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 8px 8px 0 8px;
    border-style: solid;
    border-color: #ccc transparent transparent transparent;
  }

  &:after {
    content: '';
    position: absolute;
    bottom: -7px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 7px 7px 0 7px;
    border-style: solid;
    border-color: white transparent transparent transparent;
  }

  textarea {
    width: 100%;
    min-height: 60px;
    margin-bottom: 8px;
    padding: 4px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .tooltip-buttons {
    display: ${props => props.isEditing ? 'flex' : 'none'};
    gap: 8px;
    justify-content: flex-end;
  }

  .edit-button {
    display: ${props => !props.isEditing ? 'block' : 'none'};
    margin-top: 8px;
    padding: 4px 8px;
    background: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }

  .close-button {
    position: absolute;
    top: 4px;
    right: 4px;
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: #666;
    padding: 4px;
    line-height: 1;
    
    &:hover {
      color: #333;
    }
  }
`;

const HighlightButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 8px 16px;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
  
  &:hover {
    background-color: #ffeeba;
  }
`;

const CommentInput = styled.div<{ visible: boolean }>`
  position: fixed;
  display: ${props => props.visible ? 'flex' : 'none'};
  gap: 8px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border: 1px solid #ccc;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  flex-direction: column;
`;

const SignatureArea = styled.div<{ x: number; y: number; width: number; height: number; isDragging?: boolean }>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  border: 2px dashed #ccc;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;

  ${props => props.isDragging && `
    opacity: 0.7;
    transform: scale(1.02);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  `}

  &:hover {
    border-color: #0066cc;
    background: rgba(0, 102, 204, 0.1);
  }
`;

const AddSignatureButton = styled.button`
  position: absolute;
  top: 10px;
  right: 120px;
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;

  &:hover {
    background-color: #218838;
  }
`;

const SignatureImage = styled.img`
  max-width: 100%;
  max-height: 100%;
`;

const SignatureInfo = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  text-align: center;
`;

const ResizeHandle = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 1px solid #0066cc;
  border-radius: 50%;
  cursor: nw-resize;
  z-index: 1;
`;

const ContractEditor: React.FC<ContractEditorProps> = ({ 
  initialContent = '', 
  highlights = [],
  onHighlightAdd,
  onHighlightUpdate,
  onSignatureAdd
}) => {
  const [content, setContent] = useState(initialContent);
  const [tooltip, setTooltip] = useState<{ 
    visible: boolean; 
    x: number; 
    y: number; 
    text: string;
    isEditing: boolean;
    currentElement: HTMLElement | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
    isEditing: false,
    currentElement: null
  });
  const [commentInput, setCommentInput] = useState<{ visible: boolean }>({
    visible: false
  });
  const [selectedText, setSelectedText] = useState('');
  const [comment, setComment] = useState('');
  const editorRef = useRef<any>(null);
  const [selectionRange, setSelectionRange] = useState<any>(null);
  const [editingComment, setEditingComment] = useState('');
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [draggingSignature, setDraggingSignature] = useState<string | null>(null);
  const [resizingSignature, setResizingSignature] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleEditorReady = (editor: any) => {
    editorRef.current = editor;

    // Schema tanımla
    editor.model.schema.extend('$text', {
      allowAttributes: ['highlight', 'comment']
    });

    // Dönüştürücüleri tanımla
    editor.conversion.for('downcast').attributeToElement({
      model: 'highlight',
      view: (value: any, { writer }: any) => {
        const comment = editor.model.document.selection.getAttribute('comment');
        return writer.createAttributeElement('span', {
          class: 'highlight',
          'data-comment': comment
        });
      }
    });

    // Özel stil tanımlaması ekle
    const view = editor.editing.view;
    const viewDocument = view.document;
    const root = viewDocument.getRoot();
    const styles = view.change((writer: any) => {
      const styles = writer.createUIElement('style', {}, function(domDocument: Document) {
        const element = domDocument.createElement('style');
        element.textContent = `
          .highlight {
            background-color: #fff3cd;
            padding: 2px 0;
            cursor: pointer;
          }
          .highlight:hover {
            background-color: #ffeeba;
          }
        `;
        return element;
      });
      return styles;
    });
    view.change((writer: any) => {
      writer.insert(writer.createPositionAt(root, 0), styles);
    });
  };

  const handleEditorChange = (event: any, editor: any) => {
    const data = editor.getData();
    setContent(data);
  };

  const handleHighlightClick = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.model.document.selection;
    if (selection.isCollapsed) {
      alert('Lütfen vurgulamak istediğiniz metni seçin.');
      return;
    }

    const range = selection.getFirstRange();
    const text = Array.from(range.getItems())
      .map((item: any) => item.data || '')
      .join('');

    if (!text) {
      alert('Lütfen vurgulamak istediğiniz metni seçin.');
      return;
    }

    setSelectedText(text);
    setSelectionRange(range);
    setCommentInput({ visible: true });
  };

  const handleCommentSubmit = () => {
    if (!selectedText || !comment || !selectionRange) return;

    const editor = editorRef.current;
    if (!editor) return;

    const newHighlight: HighlightData = {
      start: content.indexOf(selectedText),
      end: content.indexOf(selectedText) + selectedText.length,
      text: selectedText,
      comment: comment
    };

    if (onHighlightAdd) {
      onHighlightAdd(newHighlight);
    }

    editor.model.change((writer: any) => {
      writer.setAttributes(
        {
          highlight: true,
          comment: comment
        },
        selectionRange
      );
    });

    setComment('');
    setCommentInput({ visible: false });
    setSelectionRange(null);
  };

  const handleMouseEnter = (e: Event) => {
    const element = e.target as HTMLElement;
    const rect = element.getBoundingClientRect();
    const comment = element.getAttribute('data-comment');
    
    if (comment) {
      setTooltip({
        visible: true,
        x: rect.left + (rect.width / 2),
        y: rect.top,
        text: comment,
        isEditing: false,
        currentElement: element
      });
    }
  };

  const handleCloseTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false, isEditing: false }));
  };

  const handleEditClick = () => {
    setEditingComment(tooltip.text);
    setTooltip(prev => ({ ...prev, isEditing: true }));
  };

  const handleSaveComment = () => {
    if (!tooltip.currentElement || editingComment === tooltip.text) return;

    const editor = editorRef.current;
    if (!editor) return;

    // CKEditor modelinde yorumu güncelle
    editor.model.change((writer: any) => {
      const root = editor.model.document.getRoot();
      
      // Tüm içeriği tara ve eşleşen yorumları güncelle
      const range = writer.createRangeIn(root);
      
      for (const item of range.getItems()) {
        if (item.is('$text') && 
            item.hasAttribute('highlight') && 
            item.getAttribute('comment') === tooltip.text) {
          writer.setAttribute('comment', editingComment, item);
        }
      }
    });

    // DOM elementinde data-comment özniteliğini güncelle
    if (tooltip.currentElement) {
      tooltip.currentElement.setAttribute('data-comment', editingComment);
    }

    // Tooltip'i güncelle
    setTooltip(prev => ({ 
      ...prev, 
      text: editingComment, 
      isEditing: false,
      visible: false 
    }));

    if (onHighlightUpdate) {
      onHighlightUpdate(tooltip.text, editingComment);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(tooltip.text);
    setTooltip(prev => ({ ...prev, isEditing: false, visible: false }));
  };

  const handleAddSignature = () => {
    const newSignature: SignatureData = {
      id: Date.now().toString(),
      image: '',
      position: { x: 200, y: 200 },
      date: new Date().toLocaleString(),
      signer: {
        name: '',
        title: '',
        tcNo: '',
        company: ''
      },
      size: { width: 200, height: 100 }
    };
    setSignatures(prev => [...prev, newSignature]);
    setShowSignatureCanvas(true);
  };

  const handleSignatureSave = (signatureData: string, signerInfo: SignatureData['signer']) => {
    setSignatures(prev => prev.map(sig => 
      sig.image === '' ? {
        ...sig,
        image: signatureData,
        signer: signerInfo,
        date: new Date().toLocaleString()
      } : sig
    ));
    setShowSignatureCanvas(false);

    if (onSignatureAdd) {
      const newSignature = signatures.find(sig => sig.image === '');
      if (newSignature) {
        onSignatureAdd({
          ...newSignature,
          image: signatureData,
          signer: signerInfo,
          date: new Date().toLocaleString()
        });
      }
    }
  };

  const handleDragStart = (e: React.MouseEvent, signatureId: string) => {
    const signature = signatures.find(sig => sig.id === signatureId);
    if (!signature) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggingSignature(signatureId);
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!draggingSignature || !editorContainerRef.current) return;

    const containerRect = editorContainerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;

    setSignatures(prev => prev.map(sig => 
      sig.id === draggingSignature ? {
        ...sig,
        position: { x: newX, y: newY }
      } : sig
    ));
  };

  const handleDragEnd = () => {
    setDraggingSignature(null);
  };

  const handleResize = (e: React.MouseEvent, signatureId: string) => {
    if (!resizingSignature || !editorContainerRef.current) return;

    const containerRect = editorContainerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left - signatures.find(sig => sig.id === signatureId)!.position.x;
    const newHeight = e.clientY - containerRect.top - signatures.find(sig => sig.id === signatureId)!.position.y;

    setSignatures(prev => prev.map(sig => 
      sig.id === signatureId ? {
        ...sig,
        size: { 
          width: Math.max(100, newWidth), 
          height: Math.max(50, newHeight) 
        }
      } : sig
    ));
  };

  useEffect(() => {
    const editorContent = document.querySelector('.ck-content');
    if (!editorContent) return;

    // Highlight özniteliğine sahip span elementlerini seç
    const highlightElements = editorContent.querySelectorAll('span[class*="highlight"]');
    
    highlightElements.forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnter as EventListener);
    });

    return () => {
      highlightElements.forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter as EventListener);
      });
    };
  }, [content]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingSignature) {
        handleDrag(e as unknown as React.MouseEvent);
      }
      if (resizingSignature) {
        handleResize(e as unknown as React.MouseEvent, resizingSignature);
      }
    };

    const handleMouseUp = () => {
      setDraggingSignature(null);
      setResizingSignature(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingSignature, resizingSignature]);

  return (
    <EditorContainer ref={editorContainerRef}>
      <HighlightButton onClick={handleHighlightClick}>
        Vurgula
      </HighlightButton>
      <AddSignatureButton onClick={handleAddSignature}>
        İmza Ekle
      </AddSignatureButton>
      <CKEditor
        editor={ClassicEditor as any}
        data={content}
        onReady={handleEditorReady}
        onChange={handleEditorChange}
        config={{
          toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'outdent', 'indent']
        }}
      />
      {signatures.map(signature => (
        <SignatureArea
          key={signature.id}
          x={signature.position.x}
          y={signature.position.y}
          width={signature.size.width}
          height={signature.size.height}
          isDragging={draggingSignature === signature.id}
          onMouseDown={e => handleDragStart(e, signature.id)}
        >
          {signature.image ? (
            <>
              <SignatureImage src={signature.image} alt="İmza" />
              <SignatureInfo>
                <div>{signature.signer.name}</div>
                {signature.signer.title && <div>{signature.signer.title}</div>}
                {signature.signer.company && <div>{signature.signer.company}</div>}
                <div>{signature.date}</div>
              </SignatureInfo>
            </>
          ) : (
            'İmzalamak için tıklayın'
          )}
          <ResizeHandle
            style={{ bottom: -5, right: -5 }}
            onMouseDown={() => setResizingSignature(signature.id)}
          />
        </SignatureArea>
      ))}
      {showSignatureCanvas && (
        <SignatureCanvas
          onSave={handleSignatureSave}
          onClose={() => setShowSignatureCanvas(false)}
        />
      )}
      <Tooltip 
        className="tooltip"
        visible={tooltip.visible} 
        x={tooltip.x} 
        y={tooltip.y}
        isEditing={tooltip.isEditing}
      >
        <button className="close-button" onClick={handleCloseTooltip}>×</button>
        {tooltip.isEditing ? (
          <>
            <textarea
              value={editingComment}
              onChange={(e) => setEditingComment(e.target.value)}
              autoFocus
            />
            <div className="tooltip-buttons">
              <button onClick={handleCancelEdit}>İptal</button>
              <button onClick={handleSaveComment}>Kaydet</button>
            </div>
          </>
        ) : (
          <>
            {tooltip.text}
            <button className="edit-button" onClick={handleEditClick}>
              Düzenle
            </button>
          </>
        )}
      </Tooltip>
      <CommentInput visible={commentInput.visible}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Açıklama ekle..."
          rows={4}
          style={{ width: '300px', marginBottom: '8px', padding: '8px' }}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => setCommentInput({ visible: false })}>İptal</button>
          <button 
            onClick={handleCommentSubmit}
            style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeeba',
              padding: '4px 12px',
              borderRadius: '4px'
            }}
          >
            Kaydet
          </button>
        </div>
      </CommentInput>
    </EditorContainer>
  );
};

export default ContractEditor; 