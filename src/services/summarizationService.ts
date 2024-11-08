// services/summarizationService.ts
import { config } from '../config';
import axios from 'axios';
import { ApiException } from '../middleware/errorHandler';

export async function summarizeText(text: string): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional video summarizer. Create concise, engaging summaries.',
          },
          {
            role: 'user',
            content: `Please summarize the following video transcript in a clear and concise way:\n\n${text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const summary = response.data.choices[0]?.message?.content;
    if (!summary) {
      throw new ApiException(
        'SUMMARIZATION_FAILED',
        'Failed to generate summary',
        500
      );
    }

    return summary.trim();
  } catch (error) {
    throw new ApiException(
      'SUMMARIZATION_ERROR',
      'Error summarizing text',
      500,
      error
    );
  }
}
