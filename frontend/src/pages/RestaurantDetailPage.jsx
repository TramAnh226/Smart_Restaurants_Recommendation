import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRestaurantById, getMenuByRestaurant } from '../services/supabase';
import { tasteLabel, contextLabel, envLabel } from '../utils/tagLabels';
import MapView from '../components/MapView';
import './RestaurantDetailPage.css';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  // TODO (post-M1): persist to Supabase favorites table using real user_id

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resData, menuData] = await Promise.all([
        getRestaurantById(id),
        getMenuByRestaurant(id),
      ]);
      setRestaurant(resData);
      setMenu(menuData || []);
    } catch (err) {
      console.error('Failed to load restaurant:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const dayNameVi = {
    monday: 'Thứ Hai', tuesday: 'Thứ Ba', wednesday: 'Thứ Tư',
    thursday: 'Thứ Năm', friday: 'Thứ Sáu', saturday: 'Thứ Bảy', sunday: 'Chủ Nhật',
    mon: 'Thứ Hai', tue: 'Thứ Ba', wed: 'Thứ Tư',
    thu: 'Thứ Năm', fri: 'Thứ Sáu', sat: 'Thứ Bảy', sun: 'Chủ Nhật',
  };

  const formatDay = (day) => dayNameVi[day.toLowerCase()] || day;

  if (loading) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="skeleton" style={{ height: 200, marginBottom: 16, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 16, width: '40%' }} />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="page-content">
        <div className="container">
          <p>Không tìm thấy quán ăn</p>
          <Link to="/" className="btn btn-primary">← Về trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container detail-container">
        <Link to="/" className="detail-back">← Quay lại</Link>

        <div className="detail-header card">
          <div className="detail-info">
            <h1 className="detail-name">{restaurant.name}</h1>

            <div className="detail-meta">
              <span className="rating">
                <span className="star">⭐</span>
                {restaurant.rating || '—'}
              </span>
              <span className="detail-price">
                💰 {formatPrice(restaurant.price_lowest)} — {formatPrice(restaurant.price_highest)}
              </span>
              {restaurant.review_count && (
                <span className="detail-reviews">📝 {restaurant.review_count} đánh giá</span>
              )}
            </div>

            <div className="detail-address">
              📍 {restaurant.address || 'Chưa có địa chỉ'}
            </div>

            <div className="detail-tags">
              {(restaurant.context_tags || []).map((t) => (
                <span key={t} className="tag tag-context">{contextLabel(t)}</span>
              ))}
              {(restaurant.environment_tags || []).map((t) => (
                <span key={t} className="tag tag-env">{envLabel(t)}</span>
              ))}

            </div>

            <button
              className={`btn ${isFavorite ? 'btn-primary' : 'btn-secondary'} detail-fav-btn`}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              {isFavorite ? '❤️ Đã yêu thích' : '🤍 Thêm yêu thích'}
            </button>
          </div>
        </div>

        {/* Opening Hours */}
        {restaurant.opening_hours && (
          <div className="detail-section card">
            <h2 className="detail-section-title">🕐 Giờ mở cửa</h2>
            <div className="detail-hours">
              {(() => {
                const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const entries = Object.entries(restaurant.opening_hours);
                entries.sort((a, b) => {
                  const ia = dayOrder.indexOf(a[0].toLowerCase());
                  const ib = dayOrder.indexOf(b[0].toLowerCase());
                  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                });
                return entries.map(([day, hours]) => (
                  <div key={day} className="detail-hour-row">
                    <span className="detail-day">{formatDay(day)}</span>
                    <span className="detail-time">{hours || 'Đóng cửa'}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Menu */}
        {menu.length > 0 && (
          <div className="detail-section card">
            <h2 className="detail-section-title">📋 Thực đơn ({menu.length} món)</h2>
            <div className="detail-menu">
              {menu.map((item) => (
                <div key={item.id} className="menu-item">
                  <div className="menu-item-info">
                    <span className="menu-item-name">{item.name}</span>
                    <div className="menu-item-tags">
                      {(item.taste_tags || []).map((t) => (
                        <span key={t} className="tag tag-taste">{tasteLabel(t)}</span>
                      ))}
                    </div>
                  </div>
                  <span className="menu-item-price">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OpenStreetMap via Leaflet */}
        {restaurant.latitude && restaurant.longitude && (
          <div className="detail-section card">
            <h2 className="detail-section-title">🗺️ Vị trí trên bản đồ</h2>
            <MapView
              lat={restaurant.latitude}
              lng={restaurant.longitude}
              name={restaurant.name}
              showUser={true}
              height={400}
            />
          </div>
        )}
      </div>
    </div>
  );
}
