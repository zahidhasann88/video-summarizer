import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Validate environment variables
const envSchema = z.object({
  OPENAI_API_KEY: z.string({
    required_error: "OPENAI_API_KEY is required. Please add it to your .env file",
    invalid_type_error: "OPENAI_API_KEY must be a string",
  }).min(1, "OPENAI_API_KEY cannot be empty"),
  
  PORT: z.string().optional(),
  UPLOAD_DIR: z.string().optional(),
  MAX_FILE_SIZE: z.string().optional(),
});

// Function to validate and get config
function validateConfig() {
  try {
    const env = envSchema.parse(process.env);
    
    return {
      openai: {
        apiKey: env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
        whisperModel: 'whisper-1',
      },
      server: {
        port: parseInt(env.PORT || '5000'),
        uploadDir: env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
        maxFileSize: parseInt(env.MAX_FILE_SIZE || '52428800'), // 50MB default
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\nEnvironment Configuration Error:');
      error.errors.forEach((err) => {
        console.error(`- ${err.message}`);
      });
      console.error('\nPlease check your .env file configuration.\n');
    }
    throw error;
  }
}

export const config = validateConfig();

// Type definitions for the config
export type Config = typeof config;