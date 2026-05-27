import RestaurantCard from './RestaurantCard';
import './RecommendationCarousel.css';

export default function RecommendationCarousel({ title, restaurants }) {
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="rec-carousel animate-fade-in">
      <h2 className="section-title">{title}</h2>
      <div className="rec-carousel-scroll">
        {restaurants.map((restaurant, index) => (
          <RestaurantCard
            key={restaurant.id || index}
            restaurant={restaurant}
          />
        ))}
      </div>
    </div>
  );
}
