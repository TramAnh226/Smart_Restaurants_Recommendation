import './FavoritesPage.css';

export default function FavoritesPage() {
  return (
    <div className="page-content">
      <div className="container">
        <h1 className="section-title">❤️ Quán yêu thích</h1>
        <div className="favorites-empty">
          <span className="favorites-empty-icon">🔒</span>
          <p>Tính năng đang chờ tích hợp</p>
          <p className="favorites-empty-hint">
            Chức năng yêu thích sẽ hoạt động sau khi M1 hoàn thành xác thực tài khoản thật.
            Dữ liệu sẽ được lưu vào bảng <code>favorites</code> trên Supabase theo từng người dùng.
          </p>
        </div>
      </div>
    </div>
  );
}
