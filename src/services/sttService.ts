import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { OPENAI_API_KEY } from '../config';

export async function transcribeAudio(audioPath: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(audioPath));
  formData.append('model', 'whisper-1');

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );
    return response.data.text;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw new Error('Audio transcription failed');
  }
}
