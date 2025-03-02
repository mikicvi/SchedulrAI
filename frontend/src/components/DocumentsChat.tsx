import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { ChatMessage } from '@/components/ui/chat-message';
import { ChatInput } from '@/components/ui/chat-input';
import { useChat } from '@/hooks/use-chat';

export default function DocumentsChat() {
	const { messages, isStreaming, loadingStatus, sendMessage, messagesEndRef } = useChat();

	return (
		<Card className='flex flex-col h-[calc(100vh-6rem)] p-6'>
			<div className='flex items-center mb-4'>
				<div className='flex-1'>
					<h2 className='text-xl font-semibold'>Chat with AI</h2>
					<p className='text-sm text-muted-foreground'>
						Single-turn conversation - Each question starts a new chat
					</p>
				</div>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger>
							<InfoIcon className='h-5 w-5 text-muted-foreground mb-6' />
						</TooltipTrigger>
						<TooltipContent className='max-w-[300px] p-2 mr-4 mb-12'>
							<p>
								This is a single-turn conversation, meaning each new question starts fresh without
								context from previous exchanges. For best results, make your questions self-contained
								and specific.
								<br />
								<br />
								Note: Large Language Models may hallucinate and provide inaccurate, or completely false
								information. Use with caution and double-check critical information.
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
			<div className='flex flex-col space-y-4 p-4 overflow-y-auto'>
				{messages.map((message, index) => (
					<ChatMessage
						key={index}
						message={message}
						isStreaming={isStreaming}
						loadingStatus={loadingStatus}
					/>
				))}
				<div ref={messagesEndRef} />
			</div>
			<ChatInput onSend={sendMessage} isStreaming={isStreaming} />
		</Card>
	);
}
