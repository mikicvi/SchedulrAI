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

	useEffect(() => {
		handleInput(); // Adjust height on initial render
	}, [value]);

	return (
		<div className="w-1/2">
			<Label htmlFor={id}>{label}</Label>
			<Textarea
				ref={textareaRef}
				placeholder={placeholder}
				id={id}
				value={value}
				onChange={onChange}
				onInput={handleInput}
				className="resize-none max-h-[70vh]"
				style={{ height: textareaHeight, overflow: overflow }}
			/>
		</div>
	);
};

export default DynamicTextarea;
