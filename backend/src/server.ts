import app from './app';
import RAGPipeline from './services/pipelineServices';

const port = process.env.EXPRESS_PORT || 3000;

app.listen(port, () => {
	console.log(`Express is listening at http://localhost:${port}`);
});
