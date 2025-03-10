import { test, expect } from '@playwright/test';

test('Main Application Flow: Register, Login, Estimate, Create event, Delete event, Check & dismiss notifications, Check settings, Logout', async ({
	page,
}) => {
	await page.goto('http://localhost:5173');

	await expect(page).toHaveTitle(/SchedulrAI/);

	//user preferences menu
	// theme
	await page.getByRole('button', { name: 'Preferences Menu' }).click();
	await page.getByRole('menuitem', { name: 'Theme' }).hover();
	await page.getByRole('menuitem', { name: 'Dark' }).click();
	await page.getByRole('button', { name: 'Preferences Menu' }).click();
	await page.getByRole('menuitem', { name: 'Theme' }).hover();
	await page.getByRole('menuitem', { name: 'Light' }).click();
	await page.getByRole('button', { name: 'Preferences Menu' }).click();
	await page.getByRole('menuitem', { name: 'Theme' }).hover();
	await page.getByRole('menuitem', { name: 'System' }).click();
	// Font size
	await page.getByRole('button', { name: 'Preferences Menu' }).click();
	await page.getByRole('menuitem', { name: 'Font Size' }).hover();
	await page.getByRole('menuitem', { name: 'Large', exact: true }).locator('div').first().click();
	await page.getByRole('button', { name: 'Preferences Menu' }).click();
	await page.getByRole('menuitem', { name: 'Font Size' }).hover();
	await page.getByText('X-Large', { exact: true }).click();
	await page.getByRole('button', { name: 'Preferences Menu' }).click();
	await page.getByRole('menuitem', { name: 'Font Size' }).hover();
	await page.getByText('XX-Large').click();
	await page.getByRole('button', { name: 'Preferences Menu' }).click();
	await page.getByRole('menuitem', { name: 'Font Size' }).hover();
	await page.getByText('Default').click();
	// ---

	await page.goto('http://localhost:5173/login');
	// register
	await page.getByRole('link', { name: "Don't have an account? Sign up" }).click();
	await page.getByRole('textbox', { name: 'First Name' }).click();
	await page.getByRole('textbox', { name: 'First Name' }).fill('test');
	await page.getByRole('textbox', { name: 'First Name' }).press('Tab');
	await page.getByRole('textbox', { name: 'Last Name' }).fill('test');
	await page.getByRole('textbox', { name: 'Last Name' }).press('Tab');
	await page.getByRole('textbox', { name: 'Username' }).fill('test');
	await page.getByRole('textbox', { name: 'Username' }).press('Tab');
	await page.getByRole('textbox', { name: 'Email' }).fill('test@test.com');
	await page.getByRole('textbox', { name: 'Email' }).press('Tab');
	await page.getByRole('textbox', { name: 'Password', exact: true }).fill('test');
	await page.getByRole('textbox', { name: 'Password', exact: true }).press('Tab');
	await page.getByRole('button').filter({ hasText: /^$/ }).click();

	await page.getByRole('button').filter({ hasText: /^$/ }).press('Tab');
	await page.getByRole('textbox', { name: 'Confirm Password' }).fill('test');
	await page.getByRole('button', { name: 'Register' }).click();

	//if user already exists then login
	try {
		await page.getByRole('region', { name: 'Notifications (F8)' }).getByRole('status').click();
		await page.getByRole('link', { name: 'Already have an account? Log' }).click();
	} catch (error) {
		// If element doesn't exist, continue with the test
		console.log('User not registered - continuing with test');
	}

	// login section
	await page.locator('#username').click();
	await page.locator('#username').fill('test');
	await page.locator('#password').click();
	await page.locator('#password').fill('test');
	// delay for 1 second
	await page.waitForTimeout(1000);
	await page.getByRole('button', { name: 'Login' }).click();
	// delay for 1 second
	await page.waitForTimeout(1000);
	console.log('Logged in');

	// Home page
	await page.getByRole('button', { name: 'Schedule a Working Day' }).click();
	await page.getByRole('button', { name: 'Schedule a Working Day' }).click();
	await page.getByRole('combobox').click();
	await page.getByRole('option', { name: '12:00' }).click();
	await page.getByText('Ready: All systems').waitFor();
	console.log('Ready: All systems');
	await page
		.getByRole('textbox', { name: '🟢 Ready: All systems' })
		.fill(
			`Hello, I’m Theresa and you can contact me at theresa_42sample@weirdmail.xyz.  I’m interested in booking an appointment for a nail service. I’d like a full set of acrylic nails with a coffin shape, medium length, and a design that incorporates a French tip style with an ombre pink base. I’d also love to add some small rhinestones on a few nails if possible. I’m not sure about the exact shade, so it would be great if I could see some options when I come in. Could you let me know about availability this weekend? I’m flexible with timing, though ideally, something around late morning or early afternoon would be perfect.\nAlso, I’d love to know the approximate price range for this kind of design. I’ve heard amazing things about the nail art quality here, so I’m excited to try it out! If there\'s an option to add a pedicure or some kind of foot treatment after the nail service, I’d be interested in that too—maybe a basic pedicure with a color that matches the manicure. Looking forward to hearing back from you!`
		);
	await page
		.locator('div')
		.filter({ hasText: /^SubmitConnected to status stream$/ })
		.getByRole('button')
		.click();

	// waiting for the response to come back
	// create event section
	await page.getByRole('alertdialog', { name: 'Confirm Scheduling Details' }).click();
	await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(/(?:\[\w+\] )?Full set of acrylic nails/); // name might not be present
	await expect(page.getByRole('textbox', { name: 'Duration (H.MM)' })).toHaveValue(/.+/);
	await expect(page.getByRole('textbox', { name: 'Customer Email' })).toHaveValue(/\S+@\S+\.\S+/);

	await page.getByRole('button', { name: 'Create Event' }).click();

	await page.getByRole('dialog', { name: 'Create New Event' }).click();
	await page.getByRole('combobox').click();
	await page.getByRole('option', { name: 'Urgent & Important', exact: true }).click();

	await page.getByRole('button', { name: 'Save Event' }).click();

	// Calendar section
	await page.getByRole('button', { name: 'Week' }).click();
	await page.waitForTimeout(500);
	await page.getByRole('button', { name: 'Day', exact: true }).click();
	await page.getByRole('button', { name: 'Today' }).click();
	//forward and backward buttons
	await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
	await page.getByRole('button').filter({ hasText: /^$/ }).nth(2).click();
	// back to month
	await page.getByRole('button', { name: 'Month' }).click();
	await page.waitForTimeout(1500);
	// check out event, then exit
	await page
		.getByText(/(?:\[\w+\] )?Full set of acrylic/)
		.nth(-1)
		.click();
	await page.waitForTimeout(1000);
	await page.getByRole('button', { name: 'Delete' }).click();
	//---
	//notifications section ---
	await page.getByRole('button', { name: '1', exact: true }).click();
	await page.getByRole('menuitem', { name: 'View all notifications' }).click();
	await page.getByRole('button', { name: 'Success Event created' }).click();
	await page.getByRole('button', { name: 'Clear All' }).click();
	//---

	// Chatbot section
	await page.getByRole('link', { name: 'Chat with your documents' }).click();
	await page.getByRole('textbox', { name: 'Type your message...' }).click();
	await page
		.getByRole('textbox', { name: 'Type your message...' })
		.fill('Hey, how long would it take to get a set of acrylic nails done?');
	await page.getByRole('button', { name: 'Send' }).click();
	// hover info message
	await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).hover();

	// delay for 5 seconds to allow the chatbot to respond
	await page.waitForTimeout(5000);

	// support - opens external mail client with the support email - not working in headless mode
	//await page.getByRole('link', { name: 'Support' }).click();

	// Profile section
	await page.getByRole('button', { name: 'TT test test test@test.com' }).click();
	await page.getByRole('menuitem', { name: 'Profile' }).click();

	// too fast, wait
	await page.waitForTimeout(2000);
	await page.getByRole('button', { name: 'TT test test test@test.com' }).click();

	// Application settings

	await page.getByRole('menuitem', { name: 'Application Settings' }).click();
	await page.getByRole('button', { name: 'Example for your custom' }).click();
	await page.getByRole('button', { name: 'Default Documents' }).click();

	// Logout
	await page.getByRole('button', { name: 'TT test test test@test.com' }).click();
	await page.getByRole('menuitem', { name: 'Logout' }).click();
});
