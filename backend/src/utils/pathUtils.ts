import path from 'path';
import { fileURLToPath } from 'url';

export function getDirname(metaUrl: string): string {
	const __filename = fileURLToPath(metaUrl);
	return path.dirname(__filename);
}
