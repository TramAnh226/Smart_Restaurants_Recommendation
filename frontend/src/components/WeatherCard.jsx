import './WeatherCard.css';

export default function WeatherCard({ weather }) {
  if (!weather) return null;

  return (
    <div className="weather-card card animate-fade-in">
      <div className="weather-icon">{weather.icon}</div>
      <div className="weather-info">
        <div className="weather-temp">{weather.temp}°C</div>
        <div className="weather-desc">{weather.description}</div>
      </div>
      <div className="weather-suggestion">
        <span className="weather-suggestion-icon">💡</span>
        <span>{weather.suggestion}</span>
      </div>
    </div>
  );
}
