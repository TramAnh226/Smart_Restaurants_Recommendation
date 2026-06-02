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
  const [tastes, setTastes] = useState(user?.taste_preferences || []);
  const [styles, setStyles] = useState(user?.preferred_styles || []);
  const [contexts, setContexts] = useState(user?.preferred_contexts || []);
  const [environments, setEnvironments] = useState(user?.preferred_environments || []);

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

  const handleSave = () => {
    updateUser({
      taste_preferences: tastes,
      preferred_styles: styles,
      preferred_contexts: contexts,
      preferred_environments: environments,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTastes(user?.taste_preferences || []);
    setStyles(user?.preferred_styles || []);
    setContexts(user?.preferred_contexts || []);
    setEnvironments(user?.preferred_environments || []);
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
          <h2 className="profile-name">{user?.name || 'Guest'}</h2>
          <p className="profile-email">{user?.email || ''}</p>

          <div className="profile-header-actions">
            {!isEditing ? (
              <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                ✏️ Chỉnh sửa sở thích
              </button>
            ) : (
              <div className="edit-actions">
                <button className="btn btn-secondary" onClick={handleCancel}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSave}>💾 Lưu thay đổi</button>
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
