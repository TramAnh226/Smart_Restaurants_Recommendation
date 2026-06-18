import { mockWeather } from '../data/mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Fetch weather info for user coordinates
 */
export async function getWeather(lat, lon) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Fast timeout

    const response = await fetch(`${API_URL}/weather?lat=${lat}&lon=${lon}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Weather API returned error status');
    return await response.json();
  } catch (error) {
    console.warn('Weather API failed, falling back to mock weather:', error.message);
    return mockWeather;
  }
}

/**
 * Send chat message to recommendation model pipeline
 */
export async function sendChatMessage({ query, user_id, user_preferences, context }) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 15s timeout for full pipeline (NLP + Weather + DB + Gemini)

    const response = await fetch(`${API_URL}/recommendation/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Recommendation API returned error status');
    const data = await response.json();
    return {
      response_message: data.response_message || 'Đây là gợi ý của mình:',
      recommendations: data.recommendations || []
    };
  } catch (error) {
    console.warn('Recommendation API failed, falling back to mock AI + Supabase:', error.message);

    // local fallback text response
    const fallbackText = getMockChatResponse(query);

    // fetch random real restaurants from Supabase to recommend in chat
    let recommendations = [];
    try {
      const restaurants = await getRandomRestaurants(5);
      recommendations = restaurants.map((r, i) => ({
        id: r.id,
        name: r.name,
        score: r.rating || 4.5,
        rank: i + 1,
        reason: [`Có đánh giá ${r.rating || 4.5}⭐ và không gian ${r.environment_tags?.join(', ') || 'thoáng mát'}.`],
        // Attach full restaurant details so RestaurantCard can render fully
        ...r
      }));
    } catch (dbErr) {
      console.error('Failed to load fallback restaurants from DB:', dbErr);
    }

    return {
      response_message:
        `Mình tìm được ${data.restaurants.top_k} quán phù hợp.`,

      recommendations:
        data.restaurants.restaurants
    };
  }
}
