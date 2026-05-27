/**
 * Mock Data — Fallback cho chat, weather, auth
 * Dùng khi chưa có API từ M1/M2
 */

// ===== MOCK USER =====
export const mockUser = {
  id: 'user_001',
  username: 'demo_user',
  email: 'demo@gmail.com',
  name: 'Nguyễn Văn Demo',
  taste_preferences: ['spicy', 'savory'],
  allergy_preferences: [],
  preferred_countries: ['vietnamese', 'japanese'],
  preferred_styles: ['street_food', 'cafe'],
  preferred_contexts: ['casual', 'group'],
  preferred_environments: ['indoor', 'air_conditioned'],
};

// ===== MOCK WEATHER =====
export const mockWeather = {
  temp: 32,
  condition: 'hot',
  description: 'Trời nắng nóng',
  icon: '☀️',
  suggestion: 'Nên tìm quán có máy lạnh hoặc đồ uống mát',
};

export const weatherConditions = {
  rain: { icon: '🌧️', suggestion: 'Nên chọn quán trong nhà', condition: 'rain' },
  hot: { icon: '☀️', suggestion: 'Đồ uống mát hoặc quán máy lạnh', condition: 'hot' },
  cool: { icon: '🌤️', suggestion: 'Thời tiết đẹp, thích hợp ngồi ngoài trời', condition: 'cool' },
};

// ===== MOCK CHAT RESPONSES =====
export const mockChatResponses = [
  {
    trigger: 'cay',
    response: 'Mình tìm được một số quán đồ cay ngon gần bạn! 🌶️ Bạn muốn mức giá nào?',
  },
  {
    trigger: 'cafe',
    response: 'Có nhiều quán cafe học bài yên tĩnh lắm! ☕ Bạn muốn gần khu vực nào?',
  },
  {
    trigger: 'rẻ',
    response: 'Để mình tìm quán ngon giá sinh viên cho bạn! 💰',
  },
  {
    trigger: 'default',
    response: 'Mình hiểu rồi! Để mình tìm quán phù hợp nhất cho bạn nhé 🍽️',
  },
];

// ===== QUICK FILTERS =====
// Only use tags that exist on the restaurant table (context_tags, environment_tags, price)
// taste_tags and style_tags are NULL on restaurant — they only exist on menu items
export const quickFilters = [
  { id: 'under50k', label: '💰 Dưới 50k', max_price: 50000 },
  { id: 'fast', label: '🍜 Ăn nhanh', context_tags: ['fast'] },
  { id: 'group', label: '👥 Đi nhóm', context_tags: ['group'] },
  { id: 'date', label: '💑 Hẹn hò', context_tags: ['date'] },
  { id: 'family', label: '👨‍👩‍👧 Gia đình', context_tags: ['family'] },
  { id: 'study', label: '📚 Học bài', context_tags: ['study'] },
  { id: 'casual', label: '😎 Bình dân', context_tags: ['casual'] },
  { id: 'indoor', label: '🏠 Trong nhà', environment_tags: ['indoor'] },
  { id: 'outdoor', label: '🌳 Ngoài trời', environment_tags: ['outdoor'] },
  { id: 'quiet', label: '🤫 Yên tĩnh', environment_tags: ['quiet'] },
];

// ===== MOCK FAVORITES (khi chưa có API) =====
export const mockFavorites = [];

/**
 * Giả lập chat response
 */
export function getMockChatResponse(message) {
  const lower = message.toLowerCase();
  const match = mockChatResponses.find((r) => r.trigger !== 'default' && lower.includes(r.trigger));
  return match ? match.response : mockChatResponses.find((r) => r.trigger === 'default').response;
}
