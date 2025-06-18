import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  GITHUB_URL: string;
  GITHUB_TOKEN?: string;
  LOG_LEVEL: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

export const env: EnvConfig = {
  NODE_ENV: getEnvVar("NODE_ENV", "development"),
  PORT: parseInt(getEnvVar("PORT", "3000"), 10),
  MONGODB_URI: getEnvVar("MONGODB_URI"),
  MONGODB_DB_NAME: getEnvVar("MONGODB_DB_NAME"),
  GITHUB_URL: getEnvVar("GITHUB_URL"),
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  LOG_LEVEL: getEnvVar("LOG_LEVEL", "info"),
};
