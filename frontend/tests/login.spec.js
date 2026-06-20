import { test, expect } from '@playwright/test';
import { login } from './auth';

test('User can login', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('http://localhost:5173/');
});