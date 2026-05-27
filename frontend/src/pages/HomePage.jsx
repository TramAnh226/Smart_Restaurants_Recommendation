import { useState, useEffect, useCallback } from 'react';
import { getRestaurants } from '../services/supabase';
import { mockWeather, quickFilters } from '../data/mockData';
import RestaurantCard from '../components/RestaurantCard';
import WeatherCard from '../components/WeatherCard';
import QuickFilterBar from '../components/QuickFilterBar';
import RecommendationCarousel from '../components/RecommendationCarousel';
import AdvancedFilterModal from '../components/AdvancedFilterModal';
import { calcDistance } from '../utils/geo';
import './HomePage.css';

const ADV_DEFAULT = {
  search: '',
  maxDistance: 20,
  minRating: 0,
  maxPrice: null,
  tastes: [],
  styles: [],
  contexts: [],
  environments: []
};

// SessionStorage helpers — persist filters across page navigation
const FILTER_KEY = 'home_filters';
function saveFilters(quickFilter, advFilters) {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify({ quickFilter, advFilters })); } catch {}
}
function loadFilters() {
  try {
    const raw = sessionStorage.getItem(FILTER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export default function HomePage() {
  // Restore cached filters on mount
  const cached = loadFilters();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(cached?.quickFilter || null);
  
  // Advanced Filter state
  const [isAdvFilterOpen, setIsAdvFilterOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState(cached?.advFilters || ADV_DEFAULT);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    loadRestaurants();
    
    // Request geolocation for distance filtering
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn('Geolocation denied or failed', err)
      );
    }
  }, []);

  // Re-fetch when advanced filters with server-side fields change
  // (taste_tags, style_tags, context_tags, environment_tags, price)
  const buildServerFilters = useCallback(() => {
    const serverFilters = {};
    
    // Quick filter (already has context_tags, environment_tags, max_price)
    if (activeFilter) {
      Object.assign(serverFilters, activeFilter);
    }
    
    // Advanced filter — taste/style go to server (menu table lookup)
    if (advFilters.tastes?.length > 0) serverFilters.taste_tags = advFilters.tastes;
    if (advFilters.styles?.length > 0) serverFilters.style_tags = advFilters.styles;
    
    // Advanced filter — context/environment override quick filter if set
    if (advFilters.contexts?.length > 0) serverFilters.context_tags = advFilters.contexts;
    if (advFilters.environments?.length > 0) serverFilters.environment_tags = advFilters.environments;
    
    // Advanced filter — price overrides quick filter if set
    if (advFilters.maxPrice) serverFilters.max_price = advFilters.maxPrice;
    
    return serverFilters;
  }, [activeFilter, advFilters]);

  const loadRestaurants = async (filters = {}) => {
    try {
      setLoading(true);
      const data = await getRestaurants({ limit: 100, filters });
      setRestaurants(data || []);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload whenever server-side filters change
  useEffect(() => {
    const filters = buildServerFilters();
    loadRestaurants(filters);
  }, [buildServerFilters]);

  const handleFilterSelect = (filter) => {
    const next = activeFilter?.id === filter.id ? null : filter;
    setActiveFilter(next);
    saveFilters(next, advFilters);
  };

  const handleAdvFiltersApply = (newFilters) => {
    setAdvFilters(newFilters);
    saveFilters(activeFilter, newFilters);
  };

  // Apply client-side-only filters (search, rating, distance)
  // These are fast and don't need a server round-trip
  const applyClientFilters = (list) => {
    return list.filter((r) => {
      // 1. Search name
      if (advFilters.search && !r.name.toLowerCase().includes(advFilters.search.toLowerCase())) return false;
      
      // 2. Rating
      if (advFilters.minRating > 0 && r.rating < advFilters.minRating) return false;
      
      // 3. Distance (only if userPos is available and maxDistance < 20)
      if (userPos && advFilters.maxDistance < 20) {
        if (!r.latitude || !r.longitude) return false;
        const dist = calcDistance(userPos.lat, userPos.lng, r.latitude, r.longitude);
        if (dist > advFilters.maxDistance) return false;
      }
      
      return true;
    });
  };

  const finalRestaurants = applyClientFilters(restaurants);

  // Split restaurants into sections
  const recommended = finalRestaurants.slice(0, 10);
  const popular = finalRestaurants.filter((r) => r.rating >= 4.7).slice(0, 10);
  const budget = finalRestaurants.filter((r) => r.price_lowest && r.price_lowest <= 50000).slice(0, 10);

  return (
    <div className="page-content">
      <div className="container">
        <div className="home-header animate-fade-in">
          <h1 className="home-greeting">Hôm nay ăn gì? 🍜</h1>
          <p className="home-subtext">Khám phá quán ăn phù hợp nhất với bạn</p>
        </div>

        <WeatherCard weather={mockWeather} />

        <div className="filter-bar-container">
          <QuickFilterBar
            filters={quickFilters}
            activeFilter={activeFilter}
            onSelect={handleFilterSelect}
          />
          <button 
            className="btn btn-secondary adv-filter-btn" 
            onClick={() => setIsAdvFilterOpen(true)}
          >
            ⚙️ Lọc
          </button>
        </div>

        {loading ? (
          <div className="home-loading">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 260, borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <>
            <RecommendationCarousel
              title="🔥 Gợi ý cho bạn"
              restaurants={recommended}
            />

            {popular.length > 0 && (
              <RecommendationCarousel
                title="⭐ Phổ biến nhất"
                restaurants={popular}
              />
            )}

            {budget.length > 0 && (
              <RecommendationCarousel
                title="💰 Ngon - Bổ - Rẻ (dưới 50k)"
                restaurants={budget}
              />
            )}
            
            {recommended.length === 0 && popular.length === 0 && budget.length === 0 && (
              <div className="no-results">
                <h3>Không tìm thấy quán ăn phù hợp</h3>
                <p>Thử điều chỉnh lại bộ lọc hoặc khoảng cách nhé!</p>
              </div>
            )}
          </>
        )}

        <AdvancedFilterModal 
          isOpen={isAdvFilterOpen}
          onClose={() => setIsAdvFilterOpen(false)}
          initialFilters={advFilters}
          onApply={handleAdvFiltersApply}
        />
      </div>
    </div>
  );
}
