import { getEnvConfig } from './env';

export const API_BASE_URL = getEnvConfig().VITE_API_URL;
