import app from './app';

const port = process.env.EXPRESS_PORT || 3000;
const proto = process.env.PROTOCOL || 'http';

app.listen(port, () => {
	console.log(`Express is listening at ${proto}://localhost:${port}`);
});
