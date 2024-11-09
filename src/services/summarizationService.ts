import { config } from '../config';
import axios, { AxiosError } from 'axios';
import { ApiException } from '../middleware/errorHandler';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function summarizeText(text: string, maxRetries = 3): Promise<string> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await axios.post<ChatCompletionResponse>(
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
          timeout: 30000, // 30 second timeout
        }
      );

      const summary = response.data.choices[0]?.message?.content;
      if (!summary) {
        throw new ApiException(
          'SUMMARIZATION_FAILED',
          'Failed to generate summary from OpenAI response',
          500
        );
      }

      return summary.trim();
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 429) {
        attempt++;
        if (attempt === maxRetries) {
          throw new ApiException(
            'RATE_LIMIT_EXCEEDED',
            'OpenAI API rate limit exceeded. Please try again later.',
            429
          );
        }
        
        const backoffTime = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        console.log(`Rate limited. Retrying in ${backoffTime}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await sleep(backoffTime);
        continue;
      }

      if (axiosError.code === 'ECONNABORTED') {
        throw new ApiException(
          'TIMEOUT',
          'Request timed out while generating summary',
          408
        );
      }

      throw new ApiException(
        'SUMMARIZATION_ERROR',
        `Error summarizing text: ${axiosError.message}`,
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