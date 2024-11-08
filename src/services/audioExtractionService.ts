import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { ApiException } from '../middleware/errorHandler';

export async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = path.join(path.dirname(videoPath), 'audio.wav');

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('wav')
        .on('end', (stdout: string | null, stderr: string | null) => {
          resolve();
        })
        .on('error', (err: Error) => {
          reject(new ApiException(
            'AUDIO_EXTRACTION_ERROR',
            'Error extracting audio: ' + err.message,
            500,
            err
          ));
        })
        .save(audioPath);
    });

    const exists = await fs.access(audioPath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      throw new ApiException(
        'AUDIO_EXTRACTION_FAILED',
        'Failed to extract audio - output file not found',
        500
      );
    }

    return audioPath;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(
      'AUDIO_EXTRACTION_ERROR',
      'Error extracting audio from video',
      500,
      error
    );
  }
}