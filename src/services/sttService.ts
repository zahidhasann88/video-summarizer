// services/sttService.ts
import { config } from '../config';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { ApiException } from '../middleware/errorHandler';

export async function transcribeAudio(audioPath: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(audioPath));
  formData.append('model', config.openai.whisperModel);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${config.openai.apiKey}`,
          ...formData.getHeaders(),
        },
      }
    );

    if (!response.data.text) {
      throw new ApiException(
        'TRANSCRIPTION_FAILED',
        'Failed to get transcription from OpenAI',
        500
      );
    }

    return response.data.text;
  } catch (error) {
    throw new ApiException(
      'TRANSCRIPTION_ERROR',
      'Error transcribing audio',
      500,
      error
    );
  }
}