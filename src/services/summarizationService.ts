import axios from 'axios';
import { OPENAI_API_KEY } from '../config';

export async function summarizeText(text: string): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt: `Summarize the following text:\n\n${text}`,
        max_tokens: 150,
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error in summarizeText:', error);
    throw new Error('Text summarization failed');
  }
}
