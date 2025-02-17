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

	const handleSubmit = async () => {
		setLoading(true);
		try {
			const response = await apiFetch('http://localhost:3000/api/runPipeline', {
				method: 'POST',
				body: JSON.stringify({ userInput: userInput }),
			});
			const data = await response.json();
			setResponse(data.result.replace(/\"/g, ''));
		} catch (error) {
			console.error('Error:', error);
		} finally {
			setLoading(false);
		}
	};

	return {
		userInput,
		loading,
		response,
		handleInputChange,
		handleSubmit,
	};
};

export default usePipeline;
