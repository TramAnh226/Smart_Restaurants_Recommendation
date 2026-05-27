/**
 * Tag Labels — Shared utility for consistent Vietnamese tag display
 * 
 * All tag rendering across the app (cards, filters, profile, detail page)
 * should use these maps so labels stay consistent everywhere.
 */

export const TASTE_EMOJI = {
  spicy: '🌶️', sweet: '🍰', savory: '🍲', sour: '🍋', bitter: '☕',
  crispy: '🍤', fresh: '🥬', light: '🥗', smoky: '🔥', creamy: '🍦', umami: '🍜'
};

export const TASTE_VI = {
  spicy: 'Cay', sweet: 'Ngọt', savory: 'Đậm đà', sour: 'Chua', bitter: 'Đắng',
  crispy: 'Giòn', fresh: 'Tươi mát', light: 'Nhẹ vị', smoky: 'Hun khói', creamy: 'Béo ngậy', umami: 'Umami'
};

export const CONTEXT_EMOJI = {
  casual: '😎', date: '💑', family: '👨‍👩‍👧', fast: '🍜', group: '👥',
  private: '🔒', relaxed: '☕', social: '🎉', student_friendly: '🎓', study: '📚'
};

export const CONTEXT_VI = {
  casual: 'Bình dân', date: 'Hẹn hò', family: 'Gia đình', fast: 'Ăn nhanh', group: 'Đi nhóm',
  private: 'Riêng tư', relaxed: 'Thư giãn', social: 'Giao lưu', student_friendly: 'Sinh viên', study: 'Học bài'
};

export const ENV_EMOJI = {
  air_conditioned: '❄️', garden: '🌿', indoor: '🏠', outdoor: '🌳', quiet: '🤫'
};

export const ENV_VI = {
  air_conditioned: 'Máy lạnh', garden: 'Sân vườn', indoor: 'Trong nhà', outdoor: 'Ngoài trời', quiet: 'Yên tĩnh'
};

export const STYLE_EMOJI = {
  cafe: '☕', fast_food: '🍟', restaurant: '🍽️', snack: '🍿', street_food: '🛒'
};

export const STYLE_VI = {
  cafe: 'Cafe', fast_food: 'Thức ăn nhanh', restaurant: 'Nhà hàng', snack: 'Ăn vặt', street_food: 'Đường phố'
};

/**
 * Get display label for a tag: "emoji Vietnamese"
 * Falls back to Title Case English if no Vietnamese mapping exists.
 */
export function tagLabel(tag, emojiMap, viMap) {
  const emoji = emojiMap?.[tag] || '🏷️';
  const vi = viMap?.[tag] || tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `${emoji} ${vi}`;
}

/** Shorthand helpers */
export const tasteLabel = (tag) => tagLabel(tag, TASTE_EMOJI, TASTE_VI);
export const contextLabel = (tag) => tagLabel(tag, CONTEXT_EMOJI, CONTEXT_VI);
export const envLabel = (tag) => tagLabel(tag, ENV_EMOJI, ENV_VI);
export const styleLabel = (tag) => tagLabel(tag, STYLE_EMOJI, STYLE_VI);
