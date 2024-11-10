import { ChatOllamaInput } from '@langchain/ollama';

export interface PipelineService extends ChatOllamaInput {
	embeddingModel: string;
}
