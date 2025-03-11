import { Page, expect } from '@playwright/test';

export const promptText = `Hello, I’m Theresa and you can contact me at theresa_42sample@weirdmail.xyz.  I’m interested in booking an appointment for a nail service. I’d like a full set of acrylic nails with a coffin shape, medium length, and a design that incorporates a French tip style with an ombre pink base. I’d also love to add some small rhinestones on a few nails if possible. I’m not sure about the exact shade, so it would be great if I could see some options when I come in. Could you let me know about availability this weekend? I’m flexible with timing, though ideally, something around late morning or early afternoon would be perfect.\nAlso, I’d love to know the approximate price range for this kind of design. I’ve heard amazing things about the nail art quality here, so I’m excited to try it out! If there\'s an option to add a pedicure or some kind of foot treatment after the nail service, I’d be interested in that too—maybe a basic pedicure with a color that matches the manicure. Looking forward to hearing back from you!`;

export async function generateAndCreateEvent(page: Page, promptText: string) {
	// Schedule generation
	await page.getByRole('button', { name: 'Schedule a Working Day' }).click();
	await page.getByRole('combobox').click();
	await page.getByRole('option', { name: '12:00' }).click();

	// Wait for system ready
	await page.getByText('Ready: All systems').waitFor();

	// Input prompt
	await page.getByRole('textbox', { name: '🟢 Ready: All systems' }).fill(promptText);

	// // Submit generation
	await page.locator('div').getByText('Submit').first().click();

	// Handle event creation dialog
	await page.getByRole('alertdialog', { name: 'Confirm Scheduling Details' }).click();

	// Verify generated fields
	await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(/(?:\[\w+\] )?Full set of acrylic nails/);
	await expect(page.getByRole('textbox', { name: 'Duration (H.MM)' })).toHaveValue(/.+/);
	await expect(page.getByRole('textbox', { name: 'Customer Email' })).toHaveValue(/\S+@\S+\.\S+/);

	// Create and save event
	await page.getByRole('button', { name: 'Create Event' }).click();
	await page.getByRole('dialog', { name: 'Create New Event' }).click();
	await page.getByRole('combobox').click();
	await page.getByRole('option', { name: 'Urgent & Important', exact: true }).click();
	await page.getByRole('button', { name: 'Save Event' }).click();
}
