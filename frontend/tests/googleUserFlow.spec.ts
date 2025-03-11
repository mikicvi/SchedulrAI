import { test as base, expect } from '@playwright/test';
import { generateAndCreateEvent, promptText } from './generationSequence';

// Create a test fixture specifically for Google OAuth testing
// We need special permissions and settings for Google OAuth
const test = base.extend({
	page: async ({ browser }, use) => {
		// Create browser context with required settings
		const context = await browser.newContext({
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
			ignoreHTTPSErrors: true,
			bypassCSP: true, // Allow bypassing Content Security Policy
			permissions: ['clipboard-read', 'clipboard-write'],
		});

		// Configure additional Chrome flags through CDP
		const session = await context.newCDPSession(await context.newPage());
		await session.send('Network.enable');
		await session.send('Page.enable');
		await session.send('Security.setIgnoreCertificateErrors', {
			ignore: true,
		});

		const page = await context.newPage();
		await use(page);
		await context.close();
	},
});

const googleUser = {
	email: process.env.GOOGLE_TEST_EMAIL!,
	password: process.env.GOOGLE_TEST_PASSWORD!,
};

if (!googleUser.email || !googleUser.password) {
	throw new Error('GOOGLE_TEST_EMAIL and GOOGLE_TEST_PASSWORD environment variables must be set');
}

test('Google User Flow: Register, Login, Estimate, Create event, Send Confirmation email, Delete event, Logout', async ({
	page,
}) => {
	await page.goto('http://localhost:5173');

	await expect(page).toHaveTitle(/SchedulrAI/);

	// Register / Login with Google OAuth
	await page.getByRole('link', { name: "Don't have an account? Sign up" }).click();
	await page.getByRole('button', { name: 'Google G Logo Create an' }).click();
	await page.getByRole('textbox', { name: 'Email or phone' }).click();
	await page.getByRole('textbox', { name: 'Email or phone' }).fill(googleUser.email);
	await page.waitForTimeout(3000);
	await page.getByRole('button', { name: 'Next' }).click();
	await page.waitForTimeout(2000);
	await page.getByRole('textbox', { name: 'Enter your password' }).fill(googleUser.password);
	await page.getByRole('button', { name: 'Next' }).click();

	await page.getByRole('button', { name: 'Continue' }).click();
	await page.waitForTimeout(2000);
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.waitForTimeout(2000);
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.waitForTimeout(2000);

	// Estimate
	await generateAndCreateEvent(page, promptText);

	// Email and Success checks
	await expect(page.getByText('Event created successfully').first()).toBeVisible();
	await page.getByRole('button', { name: 'Send Email' }).click();

	await expect(page.getByRole('textbox', { name: 'Your email address' })).toHaveValue(/\S+@\S+\.\S+/);
	await expect(page.getByRole('textbox', { name: 'Recipient email address' })).toHaveValue(/\S+@\S+\.\S+/);
	const subjectText = await page.getByRole('textbox', { name: 'Email subject' }).inputValue();
	expect(subjectText).toMatch(/^Event Scheduled:( \[\w+\])? Full set of acrylic nails$/);

	await expect(page.getByRole('textbox', { name: 'Email body' })).toContainText('Event: ');

	await page.getByRole('button', { name: 'Reset Fields' }).click();
	await page.waitForTimeout(500);

	// Go and delete the event
	await page.getByRole('link', { name: 'Calendar' }).click();

	// check out event, then exit
	await page
		.getByText(/(?:\[\w+\] )?Full set of acrylic/)
		.nth(-1)
		.click();
	await page.waitForTimeout(1000);
	await page.getByRole('button', { name: 'Delete' }).click();

	// logout
	await page.getByRole('button', { name: 'Schedulr AI' }).click();
	await page.getByRole('menuitem', { name: 'Profile' }).click();
	await page.waitForTimeout(2000);
	await page.getByRole('button', { name: 'Schedulr AI' }).click();
	await page.getByRole('menuitem', { name: 'Logout' }).click();
});
