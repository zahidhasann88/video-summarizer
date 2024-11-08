import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { ApiException } from '../middleware/errorHandler';

export async function renderSummaryOnVideo(
  videoPath: string,
  summary: string
): Promise<string> {
  const outputPath = path.join(
    path.dirname(videoPath),
    'summary_' + path.basename(videoPath)
  );

  // Split summary into lines of maximum 50 characters
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

  const drawTextFilters = lines.map((line, index) => 
    `drawtext=text='${line}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-(${lines.length - index}*30)-30`
  ).join(',');

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .videoFilters(drawTextFilters)
        .on('end', (stdout: string | null, stderr: string | null) => {
          resolve();
        })
        .on('error', (err: Error) => {
          reject(new ApiException(
            'VIDEO_RENDERING_ERROR',
            'Error rendering video: ' + err.message,
            500,
            err
          ));
        })
        .save(outputPath);
    });

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
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(
      'VIDEO_RENDERING_ERROR',
      'Error rendering summary on video',
      500,
      error
    );
  }
}