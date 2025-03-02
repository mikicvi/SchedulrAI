import { BotIcon, Loader2, UserCircle2Icon } from 'lucide-react';
import { type ChatMessage } from '@/hooks/use-chat';

interface ChatMessageProps {
	message: ChatMessage;
	isStreaming: boolean;
	loadingStatus: string;
}

export function ChatMessage({ message, isStreaming, loadingStatus }: ChatMessageProps) {
	return (
		<div className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
			{message.sender === 'bot' ? (
				isStreaming && message.text === '' ? (
					<Loader2 className='h-6 w-6 text-primary mt-1 animate-spin' />
				) : (
					<BotIcon className='h-6 w-6 text-primary mt-1' />
				)
			) : (
				<UserCircle2Icon className='h-6 w-6 text-muted-foreground mt-1' />
			)}
			<div
				className={`max-w-[80%] ${
					message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
				} rounded-lg p-4`}
			>
				{message.text || (isStreaming && message.sender === 'bot' ? loadingStatus || '...' : '')}
			</div>
		</div>
	);
}
