import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import { ApiException } from '../middleware/errorHandler';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

const execAsync = promisify(exec);

export async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = path.join(path.dirname(videoPath), 'audio.wav');
  const ffmpegPath = ffmpeg.path;

  try {
    // Use the full path to ffmpeg from the package
    const command = `"${ffmpegPath}" -i "${videoPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${audioPath}"`;
    
    const { stderr } = await execAsync(command);
    
    if (stderr && !stderr.toLowerCase().includes('video:0kb')) {
      console.warn('FFmpeg stderr:', stderr);
    }

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
  } catch (error: any) {
    throw new ApiException(
      'AUDIO_EXTRACTION_ERROR',
      `Error extracting audio: ${error.message}`,
      500,
      error
    );
  }
}