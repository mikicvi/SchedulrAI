import { useState } from 'react';
import { useApi } from './use-Api';

// Hook to handle the pipeline logic - call the REST API at /api/runPipeline and update the state accordingly -
const usePipeline = () => {
	const [userInput, setUserInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState<string | null>(null);
	const { apiFetch } = useApi();

	const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setUserInput(event.target.value);
	};

	const clearResponse = () => {
		setResponse(null);
	};

	const handleSubmit = async () => {
		setLoading(true);
		try {
			const response = await apiFetch('/runPipeline', {
				method: 'POST',
				body: JSON.stringify({ userInput: userInput }),
			});
			const data = await response.json();
			setResponse(typeof data === 'string' ? data.replace(/"/g, '') : JSON.stringify(data));
		} catch (error) {
			console.error('Error:', error);
		} finally {
			setLoading(false);
		}
	};

	const resetPipeline = () => {
		setUserInput('');
		setResponse(null);
		setLoading(false);
	};

	return {
		userInput,
		loading,
		response,
		handleInputChange,
		handleSubmit,
		resetPipeline,
		clearResponse,
	};
};

export default usePipeline;
