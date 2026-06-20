import { useParams, useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import './MapPage.css';

export default function MapPage() {
  const { lat, lng, name } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  if (!lat || !lng) {
    return (
      <div className="map-page-error">
        <div className="container">
          <p>Thiếu thông tin vị trí</p>
          <button className="btn btn-primary" onClick={handleBack}>← Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      <button className="map-back-btn" onClick={handleBack} title="Quay lại">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Quay lại</span>
      </button>
      <div className="map-page-content">
        <MapView
          lat={parseFloat(lat)}
          lng={parseFloat(lng)}
          name={name || 'Quán ăn'}
          showUser={true}
          height="100vh"
        />
      </div>
    </div>
  );
}
