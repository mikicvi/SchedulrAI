export type ModelType = 'chat' | 'embedding';

export interface OllamaConfig {
	apiBase: string;
	port: string;
	chatModel?: string;
	embedModel?: string;
}
