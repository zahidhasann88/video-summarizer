import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import { ApiException } from '../middleware/errorHandler';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

const execAsync = promisify(exec);

export async function renderSummaryOnVideo(
  videoPath: string,
  summary: string
): Promise<string> {
  const outputPath = path.join(
    path.dirname(videoPath),
    'summary_' + path.basename(videoPath)
  );
  const ffmpegPath = ffmpeg.path;

  try {
    const lines = summary.split(' ').reduce((acc: string[], word: string) => {
      if (!acc.length) return [word];
      const lastLine = acc[acc.length - 1];
      if (lastLine.length + word.length + 1 <= 50) {
        acc[acc.length - 1] = `${lastLine} ${word}`;
      } else {
        acc.push(word);
      }
      return acc;
    }, []);

    const drawTextFilters = lines
      .map((line, index) => {
        const escapedText = line.replace(/['"]/g, '\\"');
        return `drawtext=text='${escapedText}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-(${lines.length - index}*30)-30`;
      })
      .join(',');

    const command = `"${ffmpegPath}" -i "${videoPath}" -vf "${drawTextFilters}" -c:a copy "${outputPath}"`;

    const { stderr } = await execAsync(command);

    if (stderr && !stderr.toLowerCase().includes('video:')) {
      console.warn('FFmpeg stderr:', stderr);
    }

    const exists = await fs.access(outputPath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      throw new ApiException(
        'VIDEO_RENDERING_FAILED',
        'Failed to render summary on video - output file not found',
        500
      );
    }

    return outputPath;
  } catch (error: any) {
    throw new ApiException(
      'VIDEO_RENDERING_ERROR',
      `Error rendering summary on video: ${error.message}`,
      500,
      error
    );
  }
}