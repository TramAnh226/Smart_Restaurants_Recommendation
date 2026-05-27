import { useState, useEffect } from 'react';
import { getAvailableTags } from '../services/supabase';
import { tagLabel, TASTE_EMOJI, TASTE_VI, CONTEXT_EMOJI, CONTEXT_VI, ENV_EMOJI, ENV_VI, STYLE_EMOJI, STYLE_VI } from '../utils/tagLabels';
import './AdvancedFilterModal.css';

export default function AdvancedFilterModal({ isOpen, onClose, onApply, initialFilters }) {
  const [filters, setFilters] = useState(initialFilters || {
    search: '',
    maxDistance: 20, // 20 means 'all'
    minRating: 0,
    maxPrice: null,
    tastes: [],
    styles: [],
    contexts: [],
    environments: []
  });

  const [availableTags, setAvailableTags] = useState({
    tasteTags: [],
    styleTags: [],
    contextTags: [],
    environmentTags: [],
  });
  const [tagsLoading, setTagsLoading] = useState(false);

  // Fetch available tags from DB when modal opens
  useEffect(() => {
    if (isOpen && availableTags.tasteTags.length === 0) {
      setTagsLoading(true);
      getAvailableTags()
        .then(tags => setAvailableTags(tags))
        .catch(err => console.error('Failed to load tags:', err))
        .finally(() => setTagsLoading(false));
    }
  }, [isOpen]);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen && initialFilters) {
      setFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleTag = (key, tagId) => {
    const current = filters[key] || [];
    const newList = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId];
    handleChange(key, newList);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const defaultFilters = {
      search: '', maxDistance: 20, minRating: 0, maxPrice: null,
      tastes: [], styles: [], contexts: [], environments: []
    };
    setFilters(defaultFilters);
    onApply(defaultFilters);
    onClose();
  };

  return (
    <div className="adv-filter-modal-overlay">
      <div className="adv-filter-modal animate-slide-up">
        <div className="adv-filter-header">
          <h2>⚙️ Lọc Nâng Cao</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="adv-filter-body">
          <div className="filter-group">
            <label>🔍 Tìm tên quán ăn</label>
            <input 
              type="text" 
              placeholder="Nhập tên quán..." 
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>📍 Khoảng cách tối đa: {filters.maxDistance < 20 ? `${filters.maxDistance} km` : 'Tất cả'}</label>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={filters.maxDistance}
              onChange={(e) => handleChange('maxDistance', Number(e.target.value))}
              className="filter-slider"
            />
            <div className="slider-labels">
              <span>1km</span><span>20km+</span>
            </div>
          </div>

          <div className="filter-group">
            <label>⭐️ Đánh giá tối thiểu: {filters.minRating > 0 ? `${filters.minRating} ⭐️` : 'Tất cả'}</label>
            <input 
              type="range" 
              min="0" 
              max="5" 
              step="0.5"
              value={filters.minRating}
              onChange={(e) => handleChange('minRating', Number(e.target.value))}
              className="filter-slider"
            />
            <div className="slider-labels">
              <span>0</span><span>5</span>
            </div>
          </div>

          <div className="filter-group">
            <label>💰 Mức giá tối đa</label>
            <select 
              value={filters.maxPrice || ''} 
              onChange={(e) => handleChange('maxPrice', e.target.value ? Number(e.target.value) : null)}
              className="filter-select"
            >
              <option value="">Tất cả mức giá</option>
              <option value="50000">Dưới 50,000đ</option>
              <option value="100000">Dưới 100,000đ</option>
              <option value="200000">Dưới 200,000đ</option>
              <option value="500000">Dưới 500,000đ</option>
            </select>
          </div>

          {tagsLoading ? (
            <div className="filter-group"><p style={{ opacity: 0.6 }}>Đang tải tags...</p></div>
          ) : (
            <>
              {/* Taste tags — from menu table */}
              {availableTags.tasteTags.length > 0 && (
                <div className="filter-group">
                  <label>🍴 Khẩu vị (từ menu)</label>
                  <div className="filter-tags">
                    {availableTags.tasteTags.map(tag => (
                      <span 
                        key={tag} 
                        className={`filter-tag ${(filters.tastes || []).includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleTag('tastes', tag)}
                      >
                        {tagLabel(tag, TASTE_EMOJI, TASTE_VI)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Context tags — from restaurant table */}
              {availableTags.contextTags.length > 0 && (
                <div className="filter-group">
                  <label>🎯 Dịp / Hoàn cảnh</label>
                  <div className="filter-tags">
                    {availableTags.contextTags.map(tag => (
                      <span 
                        key={tag} 
                        className={`filter-tag ${(filters.contexts || []).includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleTag('contexts', tag)}
                      >
                        {tagLabel(tag, CONTEXT_EMOJI, CONTEXT_VI)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Environment tags — from restaurant table */}
              {availableTags.environmentTags.length > 0 && (
                <div className="filter-group">
                  <label>🏠 Không gian</label>
                  <div className="filter-tags">
                    {availableTags.environmentTags.map(tag => (
                      <span 
                        key={tag} 
                        className={`filter-tag ${(filters.environments || []).includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleTag('environments', tag)}
                      >
                        {tagLabel(tag, ENV_EMOJI, ENV_VI)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Style tags — from menu table */}
              {availableTags.styleTags.length > 0 && (
                <div className="filter-group">
                  <label>🎨 Phong cách quán</label>
                  <div className="filter-tags">
                    {availableTags.styleTags.map(tag => (
                      <span 
                        key={tag} 
                        className={`filter-tag ${(filters.styles || []).includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleTag('styles', tag)}
                      >
                        {tagLabel(tag, STYLE_EMOJI, STYLE_VI)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="adv-filter-footer">
          <button className="btn btn-secondary" onClick={handleClear}>Xoá bộ lọc</button>
          <button className="btn btn-primary" onClick={handleApply}>Áp dụng</button>
        </div>
      </div>
    </div>
  );
}
