import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DynamicTextarea = ({ label, placeholder, id }: { label: string; placeholder: string; id: string }) => {
	const [textareaHeight, setTextareaHeight] = useState("auto");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleInput = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			const newHeight = Math.min(textareaRef.current.scrollHeight, window.innerHeight * 0.7);
			textareaRef.current.style.height = `${newHeight}px`;
			setTextareaHeight(`${newHeight}px`);
		}
	};

	useEffect(() => {
		handleInput(); // Adjust height on initial render
	}, []);

	return (
		<div className="w-1/2">
			<Label htmlFor={id}>{label}</Label>
			<Textarea
				ref={textareaRef}
				placeholder={placeholder}
				id={id}
				style={{ height: textareaHeight }}
				onInput={handleInput}
				className="resize-none overflow-auto max-h-[70vh]"
			/>
		</div>
	);
};

export default DynamicTextarea;
