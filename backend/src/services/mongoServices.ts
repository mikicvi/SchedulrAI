import { MongoClient } from 'mongodb';

export const getMongoStatus = async () => {
	const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
	const client = new MongoClient(mongoUri);
	await client.connect();
	const db = client.db(process.env.MONGO_INITDB_DATABASE);
	const info = await db.command({ ping: 1 });
	await client.close();
	return info;
};
