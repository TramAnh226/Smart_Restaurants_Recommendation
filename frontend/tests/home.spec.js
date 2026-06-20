import { test, expect } from '@playwright/test';
import { login } from './auth';

test('Load restaurants', async ({ page }) => {
    // Log in first to access the homepage
    await login(page);

    // Wait for the restaurant cards to load on the dashboard
    const restaurantCard = page.locator('.restaurant-card');
    await expect(restaurantCard.first()).toBeVisible({ timeout: 10000 });

    const count = await restaurantCard.count();
    expect(count).toBeGreaterThan(0);
});