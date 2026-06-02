import './FavoritesPage.css';

export default function FavoritesPage() {
  return (
    <div className="page-content">
      <div className="container">
        <h1 className="section-title">❤️ Quán yêu thích</h1>
        <div className="favorites-empty">
          <span className="favorites-empty-icon">💔</span>
          <p>Chưa có quán yêu thích nào</p>
          <p className="favorites-empty-hint">Nhấn ❤️ trên quán ăn để thêm vào đây</p>
        </div>
      </div>
    </div>
  );
}
