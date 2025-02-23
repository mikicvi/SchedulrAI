import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DynamicTextareaProps {
	label: string;
	placeholder: string;
	id: string;
	value: string;
	onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const DynamicTextarea: React.FC<DynamicTextareaProps> = ({ label, placeholder, id, value, onChange }) => {
	const [textareaHeight, setTextareaHeight] = useState('auto');
	const [overflow, setOverflow] = useState('hidden');
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleInput = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			const newHeight = Math.min(textareaRef.current.scrollHeight, window.innerHeight * 0.7);
			textareaRef.current.style.height = `${newHeight}px`;
			setTextareaHeight(`${newHeight}px`);
			setOverflow(textareaRef.current.scrollHeight > newHeight ? 'auto' : 'hidden');
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			const submitButton = textareaRef.current?.form?.querySelector('button[type="submit"]');
			if (submitButton instanceof HTMLButtonElement) {
				submitButton.click();
				submitButton.focus();
			}
		}
	};

	useEffect(() => {
		handleInput(); // Adjust height on initial render
	}, [value]);

	return (
		<div className='w-full'>
			<Label htmlFor={id}>{label}</Label>
			<Textarea
				ref={textareaRef}
				placeholder={placeholder}
				id={id}
				value={value}
				onChange={onChange}
				onInput={handleInput}
				onKeyDown={handleKeyDown}
				className='resize-none w-full max-h-[70vh] min-h-[150px]'
				style={{ height: textareaHeight, overflow: overflow }}
			/>
		</div>
	);
};

export default DynamicTextarea;
