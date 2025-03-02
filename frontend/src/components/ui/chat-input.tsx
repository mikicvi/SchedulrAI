import { useRef, useState } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';

interface ChatInputProps {
	onSend: (message: string) => void;
	isStreaming: boolean;
}

export function ChatInput({ onSend, isStreaming }: ChatInputProps) {
	const [userInput, setUserInput] = useState('');
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const handleSend = () => {
		if (userInput.trim() && !isStreaming) {
			onSend(userInput);
			setUserInput('');
			inputRef.current?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const autoResize = (element: HTMLTextAreaElement) => {
		element.style.height = 'auto';
		const newHeight = Math.min(element.scrollHeight, 80);
		element.style.height = `${newHeight}px`;
	};

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setUserInput(e.target.value);
		autoResize(e.target);
	};

	return (
		<div className='input-container flex mt-auto pt-4'>
			<Textarea
				ref={inputRef}
				value={userInput}
				onChange={handleTextareaChange}
				onKeyDown={handleKeyDown}
				placeholder='Type your message...'
				className='flex-1 min-h-[20px] max-h-[80px] resize-none'
				style={{ overflow: 'auto' }}
			/>
			<Button onClick={handleSend} className='ml-2 self-end'>
				Send
			</Button>
		</div>
	);
}
