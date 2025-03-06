import { Router } from 'express';
import { createDocument, deleteDocument, indexDocuments, listDocuments } from '../services/documentServices';
import { ensureAuthenticated } from '../middlewares/auth';
import { getUserById, updateUser } from '../services/dbServices';
import { resetChromaCollection } from '../services/chromaServices';
import logger from '../utils/logger';

const router = Router();

router.post('/kb/indexDocuments', ensureAuthenticated, async (req, res) => {
	try {
		await indexDocuments();
		res.status(200).json({ status: 'Indexing completed' });
	} catch (error) {
		res.status(500).json({ status: 'Indexing failed', error: error.message });
	}
});

// Add knowledge base document
router.post('/kb/knowledge/update', ensureAuthenticated, async (req, res) => {
	try {
		const user = await getUserById(req.user.id);
		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found',
			});
		} else {
			const knowledgeBase = req.body;

			// Create documents in the filesystem
			for (const doc of knowledgeBase) {
				await createDocument(doc.title, doc.content);
			}

			// Get existing documents or initialize empty array
			const existingDocs = user.userSettings?.userSettingsKB || [];

			// Map new documents
			const newDocs = knowledgeBase.map((doc) => ({
				title: `${doc.title.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.md`,
				content: doc.content,
			}));

			// Combine existing and new documents
			const userSettingsKB = [...existingDocs, ...newDocs];

			// Update user settings
			await updateUser(user.id, {
				userSettings: {
					...user.userSettings,
					userSettingsKB,
				},
			});

			// Index the new documents
			await indexDocuments();

			res.json({
				success: true,
				message: 'Knowledge base updated successfully',
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
});

// Reset vector database
router.post('/kb/knowledge/reset', ensureAuthenticated, async (req, res) => {
	try {
		const user = await getUserById(req.user.id);
		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found',
			});
		} else {
			// Clear user's knowledge base)
			await updateUser(user.id, {
				userSettings: {
					...user.userSettings,
					userSettingsKB: [],
				},
			});

			// Reset Chroma collection
			await resetChromaCollection('SchedulrAI-KB');

			res.json({
				success: true,
				message: 'Vector database reset successfully',
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
});

router.get('/kb/listDocuments', ensureAuthenticated, async (req, res) => {
	try {
		const user = await getUserById(req.user.id);
		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found',
			});
		} else {
			const availableDocuments = await listDocuments();

			// Convert file documents to a consistent format and mark as default
			const defaultDocs = availableDocuments.map((doc) => ({
				title: doc.name,
				content: doc.content,
				type: 'default', // Mark as default document
			}));

			// Get user-specific documents and mark them, with null check
			const userDocs = (user.userSettings?.userSettingsKB || []).map((doc) => ({
				title: doc.title,
				content: doc.content,
				type: 'user',
			}));

			logger.info(`userDocs: ${JSON.stringify(userDocs)}`);
			// Combine both lists, with user docs potentially overriding defaults
			const allDocuments = [...defaultDocs, ...userDocs];

			res.json({
				success: true,
				documents: allDocuments,
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
});

// Add new route for document deletion
router.delete('/kb/document/:filename', ensureAuthenticated, async (req, res) => {
	try {
		const { filename } = req.params;
		const user = await getUserById(req.user.id);

		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found',
			});
		} else {
			// Delete the file
			await deleteDocument(filename);

			// Update user settings to remove the document, with null check
			const updatedKnowledgeBase =
				user.userSettings?.userSettingsKB?.filter((doc) => doc.title !== filename) || [];

			await updateUser(user.id, {
				userSettings: {
					...user.userSettings,
					userSettingsKB: updatedKnowledgeBase,
				},
			});

			await indexDocuments();

			res.json({
				success: true,
				message: 'Document deleted successfully',
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
});

export default router;
