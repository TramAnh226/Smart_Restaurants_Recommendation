import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user?.id) {
      setFavoriteIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      const ids = new Set(data.map(item => String(item.restaurant_id)));
      setFavoriteIds(ids);
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const addFavorite = async (restaurantId) => {
    if (!user?.id) return { success: false, error: 'Chưa đăng nhập' };
    const rid = String(restaurantId);
    try {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, restaurant_id: rid });
      if (error) throw error;

      setFavoriteIds(prev => {
        const next = new Set(prev);
        next.add(rid);
        return next;
      });
      return { success: true };
    } catch (err) {
      console.error('Error adding favorite:', err);
      return { success: false, error: err.message };
    }
  };

  const removeFavorite = async (restaurantId) => {
    if (!user?.id) return { success: false, error: 'Chưa đăng nhập' };
    const rid = String(restaurantId);
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('restaurant_id', rid);
      if (error) throw error;

      setFavoriteIds(prev => {
        const next = new Set(prev);
        next.delete(rid);
        return next;
      });
      return { success: true };
    } catch (err) {
      console.error('Error removing favorite:', err);
      return { success: false, error: err.message };
    }
  };

  const isFavorite = (restaurantId) => {
    return favoriteIds.has(String(restaurantId));
  };

  return {
    favoriteIds,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites: loadFavorites
  };
}
