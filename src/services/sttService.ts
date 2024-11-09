import { config } from '../config';
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { ApiException } from '../middleware/errorHandler';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TranscriptionResponse {
  text: string;
}

async function splitAudio(audioPath: string, segmentDuration: number = 300): Promise<string[]> {
  const outputDir = path.dirname(audioPath);
  const basename = path.basename(audioPath, path.extname(audioPath));
  const segmentPattern = path.join(outputDir, `${basename}_segment_%03d.wav`);
  
  try {
    const command = `"${ffmpeg.path}" -i "${audioPath}" -f segment -segment_time ${segmentDuration} -c copy "${segmentPattern}"`;
    await execAsync(command);
    
    // Get list of generated segments
    const files = await fs.promises.readdir(outputDir);
    const segments = files
      .filter(file => file.startsWith(`${basename}_segment_`))
      .sort()
      .map(file => path.join(outputDir, file));
    
    return segments;
  } catch (error) {
    throw new ApiException(
      'AUDIO_SPLIT_ERROR',
      'Failed to split audio file into segments',
      500,
      error
    );
  }
}

async function transcribeSegment(
  audioPath: string, 
  maxRetries = 3, 
  baseDelay = 1000
): Promise<string> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioPath));
      formData.append('model', config.openai.whisperModel);

      const response = await axios.post<TranscriptionResponse>(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${config.openai.apiKey}`,
            ...formData.getHeaders(),
          },
          timeout: 30000,
        }
      );

      if (!response.data?.text) {
        throw new ApiException(
          'TRANSCRIPTION_FAILED',
          'Failed to get transcription from OpenAI',
          500
        );
      }

      return response.data.text;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 429) {
        attempt++;
        if (attempt === maxRetries) {
          // Instead of failing, wait longer and try one more time
          console.log('Maximum retries reached, waiting 30 seconds before final attempt...');
          await sleep(30000); // Wait 30 seconds
          try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(audioPath));
            formData.append('model', config.openai.whisperModel);
            const response = await axios.post<TranscriptionResponse>(
              'https://api.openai.com/v1/audio/transcriptions',
              formData,
              {
                headers: {
                  Authorization: `Bearer ${config.openai.apiKey}`,
                  ...formData.getHeaders(),
                },
                timeout: 30000,
              }
            );
            return response.data.text;
          } catch (finalError) {
            throw new ApiException(
              'RATE_LIMIT_EXCEEDED',
              'OpenAI API rate limit exceeded. Please try again later.',
              429
            );
          }
        }
        
        const backoffTime = Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 1000, 15000);
        console.log(`Rate limited. Retrying in ${backoffTime}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await sleep(backoffTime);
        continue;
      }

      throw new ApiException(
        'TRANSCRIPTION_ERROR',
        `Error transcribing audio: ${axiosError.message}`,
        axiosError.response?.status || 500,
        {
          error: axiosError.message,
          status: axiosError.response?.status,
          data: axiosError.response?.data
        }
      );
    }
  }

  throw new ApiException(
    'MAX_RETRIES_EXCEEDED',
    'Maximum retry attempts exceeded',
    500
  );
}

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    // Split audio into 5-minute segments
    const segments = await splitAudio(audioPath);
    
    // Process segments with delay between each
    let fullTranscription = '';
    for (let i = 0; i < segments.length; i++) {
      // Add delay between segments to avoid rate limits
      if (i > 0) {
        await sleep(2000); // 2 second delay between segments
      }
      
      const segmentText = await transcribeSegment(segments[i]);
      fullTranscription += ' ' + segmentText;

      // Clean up segment file
      try {
        await fs.promises.unlink(segments[i]);
      } catch (error) {
        console.warn(`Failed to delete segment file ${segments[i]}:`, error);
      }
    }

    return fullTranscription.trim();
  } catch (error) {
    // Clean up any remaining segment files
    try {
      const dir = path.dirname(audioPath);
      const basename = path.basename(audioPath, path.extname(audioPath));
      const files = await fs.promises.readdir(dir);
      const segments = files.filter(file => file.startsWith(`${basename}_segment_`));
      await Promise.all(segments.map(file => 
        fs.promises.unlink(path.join(dir, file)).catch(console.warn)
      ));
    } catch (cleanupError) {
      console.warn('Failed to clean up segment files:', cleanupError);
    }

    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(
      'TRANSCRIPTION_ERROR',
      'Error during transcription process',
      500,
      error
    );
  }
}