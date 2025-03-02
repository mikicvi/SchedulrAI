import { useState, useEffect, useRef } from 'react';
import { useApi } from './use-Api';

export interface ChatMessage {
	sender: 'user' | 'bot';
	text: string;
}

export function useChat() {
	const { apiFetch } = useApi();
	const [isStreaming, setIsStreaming] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [loadingStatus, setLoadingStatus] = useState<string>('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const sendMessage = async (userInput: string) => {
		if (userInput.trim() && !isStreaming) {
			const newMessage: ChatMessage = { sender: 'user', text: userInput };
			setMessages((prev) => [...prev, newMessage]);
			setIsStreaming(true);

			try {
				const response = await apiFetch('/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ message: userInput }),
				});

				if (!response.ok) throw new Error('Chat request failed');
				const reader = response.body?.getReader();
				if (!reader) throw new Error('No response stream');

				setMessages((prev) => [...prev, { sender: 'bot', text: '' }]);
				let hasStartedResponse = false;
				let lastFullText = '';

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const text = new TextDecoder().decode(value);
					const lines = text.split('\n');

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							const data = JSON.parse(line.slice(6));

							if (data.type === 'status') {
								setLoadingStatus(data.content);
							} else if (data.type === 'content') {
								if (!hasStartedResponse) {
									hasStartedResponse = true;
									setLoadingStatus('');
								}

								setMessages((prev) => {
									const newMessages = [...prev];
									const lastMessage = newMessages[newMessages.length - 1];
									if (lastMessage.sender === 'bot') {
										const contentToAdd = data.content;
										if (lastFullText === '') {
											lastFullText = contentToAdd;
											lastMessage.text = contentToAdd;
										} else {
											const words = lastFullText.split(' ');
											const lastWord = words[words.length - 1];
											if (contentToAdd.startsWith(lastWord)) {
												const trimmedContent = contentToAdd.substring(lastWord.length);
												lastMessage.text = lastFullText + trimmedContent;
												lastFullText = lastMessage.text;
											} else {
												lastMessage.text = lastFullText + contentToAdd;
												lastFullText = lastMessage.text;
											}
										}
									}
									return newMessages;
								});
							}
						}
					}
				}
			} catch (error) {
				console.error('Chat error:', error);
				setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, I encountered an error.' }]);
			} finally {
				setIsStreaming(false);
				setLoadingStatus('');
			}
		}
	};

	return {
		messages,
		isStreaming,
		loadingStatus,
		sendMessage,
		messagesEndRef,
	};
}
