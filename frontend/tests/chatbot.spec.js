import { test, expect } from '@playwright/test';
import { login } from './auth';

test('Chatbot recommendation', async ({ page }) => {
    // Log in first to access the app
    await login(page);

    // Navigate to the chatbot page (/chat, not /chatbot)
    await page.goto('/chat');

    // Fill the chat input field
    const chatInput = page.locator('.chatbox-input');
    await expect(chatInput).toBeVisible();
    await chatInput.fill('phở bò');

    // Press Enter to send the message
    await page.keyboard.press('Enter');

    // Wait for the chatbot to reply (replacing the typing indicator)
    const botMessage = page.locator('.chatbox-message.assistant').last();
    await expect(botMessage).toBeVisible({ timeout: 15000 });
    
    // Check that the bot message contains 'phở' (case insensitive)
    await expect(botMessage).toContainText('phở', { ignoreCase: true, timeout: 15000 });
});