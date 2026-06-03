import { useState, useRef, useEffect } from 'react';
import RestaurantCard from './RestaurantCard';
import './ChatBox.css';

export default function ChatBox({ messages, onSend, isFavorite, onToggleFavorite }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="chatbox">
      <div className="chatbox-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chatbox-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className="chatbox-bubble">
              {msg.role === 'assistant' && <span className="chatbox-avatar">🤖</span>}
              <div className="chatbox-text">
                <div>{msg.content}</div>
                {msg.restaurants && msg.restaurants.length > 0 && (
                  <div className="chatbox-restaurants">
                    {msg.restaurants.map((res) => (
                      <RestaurantCard
                        key={res.id}
                        restaurant={res}
                        isFavorite={isFavorite ? isFavorite(res.id) : false}
                        onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(res.id) : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && <span className="chatbox-avatar">👤</span>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chatbox-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="input chatbox-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi SmartFood AI... (vd: quán cay ngon giá rẻ)"
          autoFocus
        />
        <button type="submit" className="btn btn-primary chatbox-send" disabled={!input.trim()}>
          📤 Gửi
        </button>
      </form>
    </div>
  );
}
