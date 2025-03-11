import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	timeout: 60000,
	expect: {
		timeout: 10000,
	},
	webServer: [
		{
			command: 'cd ../backend && npm run dev',
			port: 3000,
			reuseExistingServer: true,
		},
		{
			command: 'npm run dev',
			port: 5173,
			reuseExistingServer: true,
		},
	],
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		video: 'on-first-retry',
		// Show browser and slow down actions for debugging
		headless: false,
		// Screenshot on failure
		screenshot: 'only-on-failure',
		actionTimeout: 15000,
	},
	projects: [
		{
			name: 'Chrome',
			use: {
				browserName: 'chromium',
				deviceScaleFactor: undefined,
				launchOptions: { slowMo: 100, headless: false, args: ['--start-maximized'] },
				viewport: null,
			},
		},
	],
});
