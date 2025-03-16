import fs from 'fs';
import path from 'path';
import { MarkdownTextSplitter, CharacterTextSplitter } from 'langchain/text_splitter';
import logger from '../utils/logger';
import { vectorCollectionName } from '../config/constants';
import { getChromaCollection } from './chromaServices';

const documentsPath = process.env.DOCUMENTS_PATH || path.resolve(process.cwd(), 'documents');

async function loadDocuments(docsPath: string): Promise<{ name: string; content: string }[]> {
	try {
		const files = fs.readdirSync(docsPath);
		const documents = files.map((file) => ({
			name: path.parse(file).name,
			content: fs.readFileSync(path.join(docsPath, file), 'utf-8'),
		}));
		logger.info(`Documents loaded from ${docsPath}`);
		logger.info(`Documents: ${documents.map((doc) => doc.name).join(', ')}`);
		return documents;
	} catch (error) {
		logger.error(`Failed to load documents from ${docsPath}:`, error);
		throw error;
	}
}

async function splitDocuments(
	documents: { name: string; content: string }[]
): Promise<{ name: string; chunks: string[] }[]> {
	//const splitter = new MarkdownTextSplitter({ chunkSize: 250, chunkOverlap: 40 });
	const splitter = new CharacterTextSplitter({
		separator: '---',
		chunkSize: 1000,
		chunkOverlap: 50,
	});
	const chunks = await Promise.all(
		documents.map(async (document) => ({
			name: document.name,
			chunks: await splitter.splitText(document.content),
		}))
	);
	logger.info(`Documents split into chunks, ${chunks.length} documents`);
	return chunks;
}

async function storeEmbeddings(documents: { name: string; chunks: string[] }[]): Promise<void> {
	try {
		// Get or create collection using the shared service
		const collection = await getChromaCollection(vectorCollectionName);

		// Get all existing IDs
		const existingIDs = (await collection.get()).ids;

		// Delete existing items if there are any
		if (existingIDs.length > 0) {
			await collection.delete({
				ids: existingIDs,
			});
		}

		// Add new documents
		for (const document of documents) {
			await collection.add({
				documents: document.chunks,
				ids: document.chunks.map((_, index) => `${document.name}-${index}`),
			});
		}

		logger.info('Embeddings stored successfully');
	} catch (error) {
		logger.error('Failed to store embeddings:', error);
		throw error;
	}
}

export async function indexDocuments(): Promise<void> {
	try {
		const documents = await loadDocuments(documentsPath);
		const chunks = await splitDocuments(documents);
		await storeEmbeddings(chunks);
	} catch (error) {
		logger.error('Indexing failed:', error);
		throw error;
	}
}

export async function listDocuments(): Promise<Array<{ name: string; content: string }>> {
	try {
		if (!fs.existsSync(documentsPath)) {
			return [];
		}

		const files = fs.readdirSync(documentsPath);
		return files.map((file) => ({
			name: file,
			content: fs.readFileSync(path.join(documentsPath, file), 'utf-8'),
		}));
	} catch (error) {
		logger.error('Failed to list documents:', error);
		throw error;
	}
}

export async function createDocument(title: string, content: string): Promise<void> {
	try {
		if (!fs.existsSync(documentsPath)) {
			fs.mkdirSync(documentsPath, { recursive: true });
		}

		const sanitizedTitle = title.toLowerCase().slice(0, 100); // Limit length
		const fileName = `${sanitizedTitle.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.md`;

		const filePath = path.join(documentsPath, fileName);

		fs.writeFileSync(filePath, content, 'utf-8');
		logger.info(`Document created: ${filePath}`);
	} catch (error) {
		logger.error(`Failed to create document:`, error);
		throw error;
	}
}

export async function deleteDocument(filename: string): Promise<void> {
	try {
		// Basic filename validation
		if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
			throw new Error('Invalid filename');
		}

		// Normalize and verify the path is within documents directory
		const filePath = path.resolve(documentsPath, filename);
		if (!filePath.startsWith(documentsPath)) {
			throw new Error('Invalid file path');
		}

		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
			logger.info(`Document deleted: ${filePath}`);
		}
	} catch (error) {
		logger.error(`Failed to delete document:`, error);
		throw error;
	}
}
