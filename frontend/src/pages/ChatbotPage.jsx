import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { sendChatMessage, getWeather } from '../services/api';
import { supabase } from '../services/supabase';
import ChatBox from '../components/ChatBox';
import './ChatbotPage.css';

export default function ChatbotPage() {
  const { user } = useAuth();
  const { isFavorite, addFavorite, removeFavorite, favoriteIds } = useFavorites();
  const [userPos, setUserPos] = useState(null);
  const [weather, setWeather] = useState(null);

  // Load preferences directly from the 'users' table in Supabase
  const [directPrefs, setDirectPrefs] = useState({
    taste_preferences: [],
    preferred_styles: [],
    allergy_preferences: [],
    preferred_countries: []
  });

  useEffect(() => {
    const fetchPrefsDirectly = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('taste_preferences, preferred_styles, allergy_preferences, preferred_countries')
          .eq('id', user.id)
          .single();
        if (!error && data) {
          setDirectPrefs({
            taste_preferences: data.taste_preferences || [],
            preferred_styles: data.preferred_styles || [],
            allergy_preferences: data.allergy_preferences || [],
            preferred_countries: data.preferred_countries || []
          });
        }
      } catch (err) {
        console.error('Failed to fetch user preferences directly from Supabase users table inside chatbot:', err);
      }
    };
    fetchPrefsDirectly();
  }, [user?.id]);

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('chatbot_messages');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          role: 'assistant',
          content: 'Xin chào! Mình là Foođi AI. Bạn muốn ăn gì hôm nay? Mô tả sở thích để mình gợi ý quán nhé!',
        },
      ];
    } catch (e) {
      return [
        {
          id: 1,
          role: 'assistant',
          content: 'Xin chào! Mình là Foođi AI. Bạn muốn ăn gì hôm nay? Mô tả sở thích để mình gợi ý quán nhé!',
        },
      ];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('chatbot_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chatbot messages to sessionStorage:', e);
    }
  }, [messages]);

  // Request geolocation and load real weather context on mount
  useEffect(() => {
    const loadWeatherContext = async (lat, lng) => {
      try {
        const weatherData = await getWeather(lat, lng);
        setWeather(weatherData);
      } catch (err) {
        console.warn('Failed to load weather context for chatbot:', err);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserPos({ lat, lng });
          loadWeatherContext(lat, lng);
        },
        (err) => {
          console.warn('Geolocation denied or failed for chatbot', err);
          // Fallback to default coordinates
          loadWeatherContext(10.776, 106.70);
        }
      );
    } else {
      loadWeatherContext(10.776, 106.70);
    }
  }, []);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    // Add typing indicator
    const typingId = Date.now() + 1;
    const typingMsg = {
      id: typingId,
      role: 'assistant',
      content: '⏳ Đang suy nghĩ...',
    };
    setMessages((prev) => [...prev, typingMsg]);

    try {
      const context = {
        location: userPos || { lat: 10.776, lng: 106.70 },
        weather: weather?.condition || weather?.text || 'hot',
        temperature: weather?.temperature || 30,
        budget: null, // TODO: add budget input UI to ChatbotPage
        favorite_restaurants: favoriteIds ? [...favoriteIds] : [],
      };

      const result = await sendChatMessage({
        query: text,
        user_id: user?.id,
        user_preferences: {
          taste_preferences: directPrefs.taste_preferences,
          preferred_styles: directPrefs.preferred_styles,
          allergy_preferences: directPrefs.allergy_preferences,
          preferred_countries: directPrefs.preferred_countries,
        },
        context,
      });

      // Replace typing indicator with real assistant response
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== typingId)
          .concat({
            id: Date.now() + 2,
            role: 'assistant',
            content: result.response_message,
            restaurants: result.recommendations,
          })
      );
    } catch (err) {
      console.error('Failed to get chat response:', err);
      // Replace typing indicator with error response
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== typingId)
          .concat({
            id: Date.now() + 2,
            role: 'assistant',
            content: 'Xin lỗi bạn, kết nối tới máy chủ AI đang bị gián đoạn. Bạn thử lại sau nhé! 💔',
          })
      );
    }
  };

  const handleToggleFavorite = async (restaurantId) => {
    if (isFavorite(restaurantId)) {
      await removeFavorite(restaurantId);
    } else {
      await addFavorite(restaurantId);
    }
  };

  return (
    <div className="page-content chatbot-page">
      <div className="container chatbot-container">
        <div className="chatbot-header animate-fade-in">
          <div className="chatbot-header-text">
            <h1 className="section-title">💬 Chat với AI</h1>
            <p className="chatbot-hint">Hãy nói cho mình biết bạn muốn ăn gì, ở đâu, kiểu gì...</p>
          </div>
          {messages.length > 1 && (
            <button
              className="clear-chat-btn"
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn xóa lịch sử trò chuyện?")) {
                  setMessages([
                    {
                      id: 1,
                      role: 'assistant',
                      content: 'Xin chào! Mình là Foođi AI. Bạn muốn ăn gì hôm nay? Mô tả sở thích để mình gợi ý quán nhé!',
                    },
                  ]);
                }
              }}
            >
              🗑️ Xóa lịch sử
            </button>
          )}
        </div>
        <ChatBox
          messages={messages}
          onSend={handleSend}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    </div>
  );
}

