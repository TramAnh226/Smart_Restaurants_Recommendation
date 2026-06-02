/**
 * Supabase Client — Real Data Access (M6)
 * 
 * Dùng để pull dữ liệu thật từ Supabase cho frontend test độc lập.
 * Khi M1 API sẵn sàng → switch sang api.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Lấy restaurant IDs có menu items khớp với taste/style tags
 * 2-step approach: query menu table → get unique restaurant_ids
 */
async function getRestaurantIdsByMenuTags({ taste_tags, style_tags } = {}) {
  // Build a menu query for each tag type and intersect the results
  let restaurantIds = null;

  if (taste_tags && taste_tags.length > 0) {
    const { data, error } = await supabase
      .from('menu')
      .select('restaurant_id')
      .contains('taste_tags', JSON.stringify(taste_tags));
    if (error) throw error;
    restaurantIds = new Set(data.map(m => m.restaurant_id));
  }

  if (style_tags && style_tags.length > 0) {
    const { data, error } = await supabase
      .from('menu')
      .select('restaurant_id')
      .contains('style_tags', JSON.stringify(style_tags));
    if (error) throw error;
    const styleIds = new Set(data.map(m => m.restaurant_id));
    // Intersect with taste results (if any)
    if (restaurantIds) {
      restaurantIds = new Set([...restaurantIds].filter(id => styleIds.has(id)));
    } else {
      restaurantIds = styleIds;
    }
  }

  return restaurantIds; // null = no menu filter applied, Set = filtered IDs
}

/**
 * Lấy danh sách restaurants với filter + pagination
 * taste_tags/style_tags are on the menu table, not restaurant table.
 * We use a 2-step approach: find matching restaurant IDs from menu first,
 * then fetch those restaurants. This avoids the expensive JOIN that caused timeouts.
 */
export async function getRestaurants({ limit = 100, offset = 0, filters = {} } = {}) {
  // Step 1: If taste/style filters are active, get matching restaurant IDs from menu table
  const menuFilterIds = await getRestaurantIdsByMenuTags({
    taste_tags: filters.taste_tags,
    style_tags: filters.style_tags,
  });

  // If menu filter returned an empty set, no restaurants match → return early
  if (menuFilterIds && menuFilterIds.size === 0) {
    return [];
  }

  // Step 2: Query restaurant table with all filters
  let query = supabase
    .from('restaurant')
    .select('*')
    .order('rating', { ascending: false });

  // Narrow to restaurants that matched menu-level tags
  if (menuFilterIds) {
    const idArray = [...menuFilterIds];
    query = query.in('id', idArray);
  }

  // Filter theo context_tags (JSONB column — must stringify for .contains())
  if (filters.context_tags && filters.context_tags.length > 0) {
    query = query.contains('context_tags', JSON.stringify(filters.context_tags));
  }

  // Filter theo environment_tags (JSONB column)
  if (filters.environment_tags && filters.environment_tags.length > 0) {
    query = query.contains('environment_tags', JSON.stringify(filters.environment_tags));
  }

  // Filter theo price range
  if (filters.max_price) {
    query = query.lte('price_lowest', filters.max_price);
  }

  // Apply pagination after all filters
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Lấy chi tiết 1 restaurant theo id
 */
export async function getRestaurantById(id) {
  const { data, error } = await supabase
    .from('restaurant')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Lấy menu items theo restaurant_id
 */
export async function getMenuByRestaurant(restaurantId) {
  const { data, error } = await supabase
    .from('menu')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('price', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Tìm kiếm restaurants theo tên
 */
export async function searchRestaurants(keyword, limit = 20) {
  const { data, error } = await supabase
    .from('restaurant')
    .select('*')
    .ilike('name', `%${keyword}%`)
    .limit(limit)
    .order('rating', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Lấy restaurants random cho homepage
 */
export async function getRandomRestaurants(limit = 10) {
  // Supabase doesn't have native random, so we fetch more and shuffle
  const { data, error } = await supabase
    .from('restaurant')
    .select('*')
    .limit(100);

  if (error) throw error;

  // Shuffle and take limit
  const shuffled = data.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
}



/**
 * Lấy tất cả unique tags từ DB để dùng cho filter UI
 * Fetches distinct tag values from both restaurant and menu tables.
 */
export async function getAvailableTags() {
  // Fetch from restaurant table (context_tags, environment_tags)
  const { data: restaurants } = await supabase
    .from('restaurant')
    .select('context_tags, environment_tags')
    .limit(500);

  // Fetch from menu table (taste_tags, style_tags)
  const { data: menus } = await supabase
    .from('menu')
    .select('taste_tags, style_tags')
    .limit(500);

  const contextTags = new Set();
  const environmentTags = new Set();
  const tasteTags = new Set();
  const styleTags = new Set();

  for (const r of (restaurants || [])) {
    (r.context_tags || []).forEach(t => contextTags.add(t));
    (r.environment_tags || []).forEach(t => environmentTags.add(t));
  }
  for (const m of (menus || [])) {
    (m.taste_tags || []).forEach(t => tasteTags.add(t));
    (m.style_tags || []).forEach(t => styleTags.add(t));
  }

  return {
    tasteTags: [...tasteTags].sort(),
    styleTags: [...styleTags].sort(),
    contextTags: [...contextTags].sort(),
    environmentTags: [...environmentTags].sort(),
  };
}
