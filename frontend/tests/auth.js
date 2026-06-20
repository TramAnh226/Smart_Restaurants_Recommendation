import fs from 'fs';
import path from 'path';

export async function login(page, email = 'tester.smart.restaurant.1@gmail.com', password = '123456') {
    // Read the supabase key from frontend/.env file
    let supabaseKey = '';
    try {
        const envContent = fs.readFileSync('.env', 'utf8');
        const match = envContent.match(/VITE_SUPABASE_KEY=(.*)/);
        if (match && match[1]) {
            supabaseKey = match[1].trim();
        }
    } catch (e) {
        console.error('Failed to read .env file:', e);
    }

    // Intercept database Postgrest requests to use the valid anon key instead of the fake user token
    if (supabaseKey) {
        await page.route('**/rest/v1/**', async (route) => {
            const headers = {
                ...route.request().headers(),
                'authorization': `Bearer ${supabaseKey}`
            };
            await route.continue({ headers });
        });
    }

    // Intercept Supabase Auth requests to return a mock session using a valid existing user ID
    await page.route('**/auth/v1/token*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mocked-token',
                refresh_token: 'mocked-refresh-token',
                expires_in: 3600,
                user: {
                    id: 'd3b07384-d113-4ec5-a5e6-ec66289b4f2c',
                    email: email,
                    user_metadata: { name: 'Test Schema Agent' },
                    aud: 'authenticated',
                    role: 'authenticated'
                }
            })
        });
    });

    await page.route('**/auth/v1/user*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 'd3b07384-d113-4ec5-a5e6-ec66289b4f2c',
                email: email,
                user_metadata: { name: 'Test Schema Agent' },
                aud: 'authenticated',
                role: 'authenticated'
            })
        });
    });

    await page.goto('/login');

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to home page
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
}
