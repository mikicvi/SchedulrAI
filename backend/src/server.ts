import initializeApp from './app.js';
import logger from './utils/logger.js';

const port = process.env.EXPRESS_PORT || 3000;
const proto = process.env.PROTOCOL || 'http';

initializeApp()
	.then((app) => {
		app.listen(port, () => {
			logger.info(`Express is listening at ${proto}://localhost:${port}`);
		});
	})
	.catch((err) => {
		logger.error('Failed to initialize the app:', err);
	});
