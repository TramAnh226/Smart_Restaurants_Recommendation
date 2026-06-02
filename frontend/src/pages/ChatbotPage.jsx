import { useState, useRef, useEffect } from 'react';
import { getMockChatResponse } from '../data/mockData';
import ChatBox from '../components/ChatBox';
import './ChatbotPage.css';

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Xin chào! 🍽️ Mình là SmartFood AI. Bạn muốn ăn gì hôm nay? Mô tả sở thích để mình gợi ý quán nhé!',
    },
  ]);

  const handleSend = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    // Simulate AI response
    setTimeout(() => {
      const response = getMockChatResponse(text);
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: response };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  };

  return (
    <div className="page-content chatbot-page">
      <div className="container chatbot-container">
        <div className="chatbot-header">
          <h1 className="section-title">💬 Chat với AI</h1>
          <p className="chatbot-hint">Hãy nói cho mình biết bạn muốn ăn gì, ở đâu, kiểu gì...</p>
        </div>
        <ChatBox messages={messages} onSend={handleSend} />
      </div>
    </div>
  );
}
