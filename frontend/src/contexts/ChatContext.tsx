import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AIAPI } from '@/lib/api';

export type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  attachment?: { name: string };
  sources?: { document_name: string; preview: string; relevance_score: number }[];
  chips?: string[];
  time: string;
};

interface ChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (text: string, documentId?: number, attachment?: File) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const initialMessages: ChatMessage[] = [{
  id: 1, role: 'assistant', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  text: "Hi! I'm your Finexa AI financial assistant. I can analyze your invoices, track spending patterns, and give personalized money insights.\n\nUpload a document or ask me anything!",
  chips: ['Analyze my spending', 'Budget tips', 'Upload invoice'],
}];

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    AIAPI.getHistory().then((history) => {
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages(initialMessages);
      }
    }).catch(console.error);
  }, []);

  const sendMessage = useCallback(async (text: string, documentId?: number, attachment?: File) => {
    let finalText = text;
    let finalDocId = documentId;

    if (attachment) {
      try {
        setIsTyping(true);
        const uploadRes = await AIAPI.processDocument(attachment);
        finalDocId = uploadRes.document_id;
        if (!finalText) finalText = 'I just uploaded a document. What can you tell me about it?';
      } catch (err: any) {
        setMessages(prev => [...prev, {
          id: Date.now(), role: 'assistant', text: `Failed to upload: ${err.message || 'Unknown error'}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
        return;
      }
    }

    if (!finalText) return;

    const userMsg: ChatMessage = {
      id: Date.now(), role: 'user', text: finalText,
      attachment: attachment ? { name: attachment.name } : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    if (wsRef.current) {
      wsRef.current.close();
    }
    
    const wsUrl = AIAPI.getChatWebSocketUrl(finalDocId);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const assistantMsgId = Date.now() + 1;
    
    setMessages(prev => [...prev, {
      id: assistantMsgId, role: 'assistant', text: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'typing') {
          if (data.status === 'start') setIsTyping(true);
          if (data.status === 'stop') setIsTyping(false);
        } else if (data.type === 'token') {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMsgId ? { ...msg, text: msg.text + data.text } : msg
          ));
        } else if (data.type === 'done') {
          setIsTyping(false);
          if (data.complete) {
             setMessages(prev => prev.map(msg => 
               msg.id === assistantMsgId ? { ...msg, text: data.complete } : msg
             ));
          }
          ws.close();
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ question: finalText, document_id: finalDocId }));
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId ? { ...msg, text: msg.text + '\n[Connection error]' } : msg
      ));
      setIsTyping(false);
    };

    ws.onclose = () => {
      setIsTyping(false);
    };
  }, []);

  const clearChat = useCallback(() => {
    setMessages(initialMessages);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, isTyping, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
