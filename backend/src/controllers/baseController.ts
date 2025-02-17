import { Request, Response } from 'express';
import logger from '../utils/logger';

type ServiceFunctions<T> = {
	create: (data: any) => Promise<T>;
	getById: (id: number) => Promise<T | null>;
	update: (id: number, data: any) => Promise<[number, T[]] | null | void>;
	delete: (id: number) => Promise<number | void>;
};

export const createBaseController = <T>(serviceFunctions: ServiceFunctions<T>, resourceName: string) => ({
	async create(req: Request, res: Response) {
		try {
			const resource = await serviceFunctions.create(req.body);
			if (!resource) {
				throw new Error(`Failed to create ${resourceName}`);
			}
			logger.info(`${resourceName} created: ${JSON.stringify(resource)}`);
			res.status(201)
				.location(`/${resourceName.toLowerCase()}s/${(resource as any).id}`)
				.json({
					status: 'success',
					data: resource,
				});
		} catch (error) {
			logger.error(`Error creating ${resourceName}: ${error.message}`);
			res.status(400).json({
				status: 'error',
				message: error.message,
			});
		}
	},

	async getById(req: Request, res: Response) {
		const { id } = req.params;
		try {
			const resource = await serviceFunctions.getById(Number(id));
			if (resource) {
				logger.info(`${resourceName} retrieved: ${JSON.stringify(resource)}`);
				res.status(200).json({
					status: 'success',
					data: resource,
				});
			} else {
				logger.warn(`${resourceName} not found: ID ${id}`);
				res.status(404).json({
					status: 'error',
					message: `${resourceName} not found`,
				});
			}
		} catch (error) {
			logger.error(`Error retrieving ${resourceName}: ${error.message}`);
			res.status(500).json({
				status: 'error',
				message: 'Internal server error',
			});
		}
	},

	async update(req: Request, res: Response) {
		const { id } = req.params;
		try {
			const result = await serviceFunctions.update(Number(id), req.body);
			if (result && typeof result[0] === 'number' && result[0] > 0) {
				const [, updatedResources] = result;
				logger.info(`${resourceName} updated: ${JSON.stringify(updatedResources)}`);
				res.status(200).json({
					status: 'success',
					data: updatedResources,
				});
			} else {
				logger.warn(`${resourceName} not found for update: ID ${id}`);
				res.status(404).json({
					status: 'error',
					message: `${resourceName} not found`,
				});
			}
		} catch (error) {
			logger.error(`Error updating ${resourceName}: ${error.message}`);
			res.status(400).json({
				status: 'error',
				message: error.message,
			});
		}
	},

	async delete(req: Request, res: Response) {
		const { id } = req.params;
		try {
			const affectedRows = await serviceFunctions.delete(Number(id));
			if (typeof affectedRows === 'number' && affectedRows > 0) {
				logger.info(`${resourceName} deleted: ID ${id}`);
				res.status(204).end();
			} else {
				logger.warn(`${resourceName} not found for deletion: ID ${id}`);
				res.status(404).json({
					status: 'error',
					message: `${resourceName} not found`,
				});
			}
		} catch (error) {
			logger.error(`Error deleting ${resourceName}: ${error.message}`);
			res.status(500).json({
				status: 'error',
				message: 'Internal server error',
			});
		}
	},
});
