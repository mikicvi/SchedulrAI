import React, { useState, useRef, useEffect } from 'react';
import Layout from './Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BotIcon, InfoIcon, UserCircle2Icon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function DocChat() {
	const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
	const [userInput, setUserInput] = useState('');
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
		if (messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
			inputRef.current?.focus();
		}
	}, [messages]);

	const handleSend = () => {
		if (userInput.trim()) {
			const newMessage = { sender: 'user', text: userInput };
			setMessages([...messages, newMessage]);
			setUserInput('');
			// Simulate chatbot response for testing purposes
			// @todo: consume backend API to get chatbot response - if built in time
			setTimeout(() => {
				const botMessage = { sender: 'bot', text: 'This is a simulated response.' };
				setMessages((prevMessages) => [...prevMessages, botMessage]);
			}, 1000);
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

	const breadcrumbItems = [
		{ title: 'Documents Chat', href: '/documentsChat' },
		{ title: 'Chat with your documents' },
	];

	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<Card className='flex flex-col h-[calc(100vh-7rem)] p-6'>
				<div className='flex items-center mb-4'>
					<h2 className='text-xl font-semibold flex-1'>Chat with AI</h2>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger>
								<InfoIcon className='h-5 w-5 text-muted-foreground' />
							</TooltipTrigger>
							<TooltipContent className='max-w-[300px] p-2'>
								<p>
									Disclaimer: Large Language Models may hallucinate and provide inaccurate, or
									completely false information. Use with caution and double-check critical
									information.
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<div className='flex flex-col space-y-4 p-4 overflow-y-auto'>
					{messages.map((message, index) => (
						<div
							key={index}
							className={`flex items-start gap-2 ${
								message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
							}`}
						>
							{message.sender === 'bot' ? (
								<BotIcon className='h-6 w-6 text-primary mt-1' />
							) : (
								<UserCircle2Icon className='h-6 w-6 text-muted-foreground mt-1' />
							)}
							<div
								className={`max-w-[80%] ${
									message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
								} rounded-lg p-4`}
							>
								{message.text}
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>
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
			</Card>
		</Layout>
	);
}
