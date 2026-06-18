import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import RestaurantCard from '../components/RestaurantCard';
import './FavoritesPage.css';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { removeFavorite } = useFavorites();

  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    }
  }, [user?.id]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // Query favorites exactly as specified
      const { data: favs, error: favError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

      if (favError) throw favError;

      if (favs && favs.length > 0) {
        const restaurantIds = favs.map(f => f.restaurant_id);
        const { data: restaurants, error: resError } = await supabase
          .from('restaurant')
          .select('*')
          .in('id', restaurantIds);

        if (resError) throw resError;

        const mapped = favs.map(f => ({
          ...f,
          restaurant: restaurants.find(r => String(r.id) === String(f.restaurant_id))
        })).filter(item => item.restaurant);

        setFavorites(mapped);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (restaurantId) => {
    const res = await removeFavorite(restaurantId);
    if (res.success) {
      setFavorites(prev => prev.filter(item => String(item.restaurant_id) !== String(restaurantId)));
    }
  };

  return (
    <div className="page-content">
      <div className="container animate-fade-in">
        <h1 className="section-title">❤️ Quán yêu thích</h1>

        {loading ? (
          <div className="favorites-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 260, borderRadius: 16 }} />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="favorites-grid">
            {favorites.map((item) => (
              <RestaurantCard
                key={item.id}
                restaurant={item.restaurant}
                isFavorite={true}
                onToggleFavorite={() => handleRemove(item.restaurant_id)}
              />
            ))}
          </div>
        ) : (
          <div className="favorites-empty">
            <span className="favorites-empty-icon">💔</span>
            <p>Chưa có quán yêu thích nào</p>
            <p className="favorites-empty-hint">Nhấn ❤️ trên quán ăn để thêm vào đây</p>
          </div>
        )}
      </div>
    </div>
  );
}


