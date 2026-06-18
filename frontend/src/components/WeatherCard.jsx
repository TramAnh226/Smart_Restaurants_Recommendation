import './WeatherCard.css';

function getWeatherData(weather) {
  if (!weather) return null;

  // Normalize temperature: handle temperature from API (data.temperature) or mock (data.temp)
  const temperature = typeof weather.temperature !== 'undefined' 
    ? weather.temperature 
    : (typeof weather.temp !== 'undefined' ? weather.temp : 25);

  // Normalize weather description / condition
  const rawDesc = weather.weather || weather.description || weather.condition || 'Clear';
  const descLower = rawDesc.toLowerCase();

  let conditionGroup;
  let icon;
  let vietnameseDesc;
  let suggestion;

  if (descLower.includes('thunderstorm') || descLower.includes('storm')) {
    conditionGroup = 'thunderstorm';
    icon = '⛈️';
    vietnameseDesc = 'Trời mưa giông';
    suggestion = 'Mưa bão sấm chớp, nên chọn quán trong nhà ấm cúng hoặc đặt giao hàng tận nơi nhé! 🛵';
  } else if (descLower.includes('drizzle')) {
    conditionGroup = 'drizzle';
    icon = '🌦️';
    vietnameseDesc = 'Mưa phùn nhẹ';
    suggestion = 'Mưa phùn se lạnh, một tô phở nóng hổi hay ly cà phê ấm áp là lựa chọn lý tưởng! 🍜';
  } else if (descLower.includes('rain')) {
    conditionGroup = 'rain';
    icon = '🌧️';
    vietnameseDesc = 'Trời có mưa';
    suggestion = 'Trời mưa lạnh rồi, rất thích hợp thưởng thức lẩu nóng, mì cay hoặc nướng ngói ấm áp! 🍲';
  } else if (descLower.includes('snow')) {
    conditionGroup = 'snow';
    icon = '❄️';
    vietnameseDesc = 'Trời lạnh buốt';
    suggestion = 'Thời tiết rét lạnh, lẩu sôi sùng sục hoặc đồ nướng là lựa chọn số một để làm ấm! 🍲';
  } else if (descLower.includes('cloud') || descLower.includes('overcast')) {
    conditionGroup = 'clouds';
    icon = '☁️';
    vietnameseDesc = 'Trời nhiều mây';
    if (temperature >= 30) {
      suggestion = 'Thời tiết oi bức nhiều mây, ưu tiên các quán máy lạnh mát mẻ hoặc nước uống giải nhiệt! 🍹';
    } else if (temperature < 20) {
      suggestion = 'Trời se lạnh nhiều mây, một tô súp nóng hoặc cà phê ấm áp là gợi ý hoàn hảo! ☕';
    } else {
      suggestion = 'Thời tiết dịu mát nhiều mây, lý tưởng cho cà phê vỉa hè hoặc ăn vặt đường phố! 🍢';
    }
  } else if (['mist', 'smoke', 'haze', 'fog', 'sand', 'dust', 'ash', 'squall', 'tornado'].some(w => descLower.includes(w))) {
    conditionGroup = 'atmosphere';
    icon = '🌫️';
    vietnameseDesc = 'Có sương mù';
    suggestion = 'Thời tiết âm u khuất tầm nhìn, ghé quán cà phê ấm cúng ngắm cảnh là tuyệt nhất! ☕';
  } else {
    // Clear / Default
    conditionGroup = 'clear';
    vietnameseDesc = 'Trời nắng ráo';
    if (temperature >= 30) {
      icon = '☀️';
      vietnameseDesc = 'Nắng nóng';
      suggestion = 'Trời nắng nóng gay gắt, hãy ghé các quán có máy lạnh ❄️, ăn kem chè giải nhiệt nhé!';
    } else if (temperature < 20) {
      icon = '🌤️';
      vietnameseDesc = 'Thời tiết se lạnh';
      suggestion = 'Trời se lạnh, cực kỳ thích hợp thưởng thức lẩu nóng hoặc đồ nướng thơm phức! 🍢';
    } else {
      icon = '☀️';
      suggestion = 'Thời tiết nắng ráo đẹp trời, lý tưởng tụ tập quán ngoài trời hoặc cafe view đẹp! 📸';
    }
  }

  // Handle mock specific suggestions/icons/descriptions if they exist to maintain backward compatibility
  if (weather.icon) icon = weather.icon;
  if (weather.suggestion) suggestion = weather.suggestion;
  if (weather.description && (weather.description.includes('Trời') || weather.description.includes('nắng') || weather.description.includes('mưa'))) {
    vietnameseDesc = weather.description;
  }

  return {
    temperature,
    vietnameseDesc,
    icon,
    suggestion,
    conditionGroup
  };
}

export default function WeatherCard({ weather }) {
  if (!weather) return null;

  const data = getWeatherData(weather);

  return (
    <div className={`weather-card card animate-fade-in ${data.conditionGroup}`}>
      <div className="weather-icon">
        {data.icon}
      </div>

      <div className="weather-info">
        <div className="weather-temp">
          {Math.round(data.temperature)}°C
        </div>

        <div className="weather-desc">
          {data.vietnameseDesc}
        </div>
      </div>

      <div className="weather-suggestion">
        <span className="weather-suggestion-icon">💡</span>
        <span className="weather-suggestion-text">
          {data.suggestion}
        </span>
      </div>
    </div>
  );
}
