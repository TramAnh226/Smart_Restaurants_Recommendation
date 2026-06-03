import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getAvailableTags } from '../services/supabase';
import { tagLabel, TASTE_EMOJI, TASTE_VI, CONTEXT_EMOJI, CONTEXT_VI, ENV_EMOJI, ENV_VI, STYLE_EMOJI, STYLE_VI } from '../utils/tagLabels';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [tastes, setTastes] = useState([]);
  const [styles, setStyles] = useState([]);
  const [contexts, setContexts] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Sync state with user profile once loaded
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setTastes(user.taste_preferences || []);
      setStyles(user.preferred_styles || []);
      setContexts(user.preferred_contexts || []);
      setEnvironments(user.preferred_environments || []);
    }
  }, [user]);

  // Dynamic tags from DB
  const [availableTags, setAvailableTags] = useState({
    tasteTags: [], styleTags: [], contextTags: [], environmentTags: []
  });
  const [tagsLoading, setTagsLoading] = useState(true);

  useEffect(() => {
    getAvailableTags()
      .then(tags => setAvailableTags(tags))
      .catch(err => console.error('Failed to load tags:', err))
      .finally(() => setTagsLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const result = await updateUser({
        name: editName,
        taste_preferences: tastes,
        preferred_styles: styles,
        preferred_contexts: contexts,
        preferred_environments: environments,
      });
      if (result.success) {
        setIsEditing(false);
      } else {
        setSaveError(result.error || 'Không thể lưu thay đổi');
      }
    } catch (err) {
      setSaveError('Không thể lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(user?.name || '');
    setTastes(user?.taste_preferences || []);
    setStyles(user?.preferred_styles || []);
    setContexts(user?.preferred_contexts || []);
    setEnvironments(user?.preferred_environments || []);
    setSaveError('');
    setIsEditing(false);
  };

  const toggleTag = (setter) => (tag) => {
    if (!isEditing) return;
    setter(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);
  };

  const renderTagSection = (title, tags, selected, emojiMap, viMap, onToggle) => (
    <div className="profile-section">
      <h3>{title}</h3>
      <div className="profile-tags">
        {tagsLoading ? (
          <span className="text-muted">Đang tải...</span>
        ) : (
          <>
            {(isEditing ? tags : tags.filter(t => selected.includes(t))).map(tag => {
              const isActive = selected.includes(tag);
              return (
                <span
                  key={tag}
                  className={`tag tag-taste ${isEditing ? 'editable' : ''} ${isActive ? 'active' : ''}`}
                  onClick={() => onToggle(tag)}
                >
                  {tagLabel(tag, emojiMap, viMap)} {isEditing && (isActive ? '✓' : '+')}
                </span>
              );
            })}
            {!isEditing && selected.length === 0 && <span className="text-muted">Chưa chọn</span>}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="section-title">👤 Hồ sơ cá nhân</h1>

        <div className="profile-card card">
          <div className="profile-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          {isEditing ? (
            <div className="profile-name-edit" style={{ margin: 'var(--space-md) auto', width: '100%', maxWidth: '300px' }}>
              <input
                type="text"
                className="input"
                style={{ textAlign: 'center', fontSize: 'var(--font-lg)', fontWeight: 'bold' }}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nhập họ tên của bạn"
                required
              />
            </div>
          ) : (
            <h2 className="profile-name">{user?.name || 'Guest'}</h2>
          )}
          <p className="profile-email" style={{ marginTop: isEditing ? '0' : 'var(--space-xs)' }}>{user?.email || ''}</p>

          <div className="profile-header-actions">
            {saveError && <div className="profile-save-error" style={{ color: 'var(--accent)', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>⚠️ {saveError}</div>}
            {!isEditing ? (
              <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                ✏️ Chỉnh sửa sở thích
              </button>
            ) : (
              <div className="edit-actions">
                <button className="btn btn-secondary" onClick={handleCancel} disabled={saving}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
                </button>
              </div>
            )}
          </div>

          {renderTagSection('🍴 Sở thích khẩu vị', availableTags.tasteTags, tastes, TASTE_EMOJI, TASTE_VI, toggleTag(setTastes))}
          {renderTagSection('🎯 Dịp / Hoàn cảnh', availableTags.contextTags, contexts, CONTEXT_EMOJI, CONTEXT_VI, toggleTag(setContexts))}
          {renderTagSection('🏠 Không gian yêu thích', availableTags.environmentTags, environments, ENV_EMOJI, ENV_VI, toggleTag(setEnvironments))}
          {renderTagSection('🎨 Phong cách quán', availableTags.styleTags, styles, STYLE_EMOJI, STYLE_VI, toggleTag(setStyles))}

          {!isEditing && (
            <button className="btn btn-secondary profile-logout" onClick={handleLogout}>
              🚪 Đăng xuất
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
