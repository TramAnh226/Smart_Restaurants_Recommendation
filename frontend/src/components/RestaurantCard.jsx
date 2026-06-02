import { useNavigate } from 'react-router-dom';
import { contextLabel, envLabel } from '../utils/tagLabels';
import './RestaurantCard.css';

export default function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();

  if (!restaurant) return null;

  const formatPrice = (price) => {
    if (!price) return '';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const priceText = restaurant.price_lowest
    ? `${formatPrice(restaurant.price_lowest)} — ${formatPrice(restaurant.price_highest)}`
    : restaurant.price || '';

  const contextTags = restaurant.context_tags || [];
  const envTags = restaurant.environment_tags || [];

  return (
    <div
      className="restaurant-card card"
      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="rc-image-wrapper">
        {restaurant.preview ? (
          <img src={restaurant.preview} alt={restaurant.name} className="rc-image" loading="lazy" />
        ) : (
          <div className="rc-image-placeholder">🍽️</div>
        )}
        {restaurant.score && (
          <div className="rc-score-badge">
            {typeof restaurant.score === 'number' ? restaurant.score.toFixed(1) : restaurant.score}
          </div>
        )}
      </div>

      <div className="rc-content">
        <h3 className="rc-name">{restaurant.name}</h3>

        <div className="rc-meta">
          <span className="rating">
            <span className="star">⭐</span>
            {restaurant.rating || '—'}
          </span>
          {priceText && <span className="rc-price">💰 {priceText}</span>}
        </div>

        <div className="rc-tags">
          {contextTags.slice(0, 2).map((t) => (
            <span key={t} className="tag tag-context">{contextLabel(t)}</span>
          ))}
          {envTags.slice(0, 2).map((t) => (
            <span key={t} className="tag tag-env">{envLabel(t)}</span>
          ))}
        </div>

        {restaurant.reason && restaurant.reason.length > 0 && (
          <div className="rc-reason">
            <span className="rc-reason-icon">💡</span>
            <span className="rc-reason-text">{restaurant.reason[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
