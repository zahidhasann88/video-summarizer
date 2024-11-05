const ffmpeg = require('fluent-ffmpeg');
import path from 'path';
import fs from 'fs';

export async function renderSummaryOnVideo(
  videoPath: string,
  summary: string
): Promise<string> {
  const outputPath = path.join(__dirname, '../../uploads/summary_video.mp4');
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf drawtext=text='${summary}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2`,
      ])
      .output(outputPath)
      .on('end', () => {
        // Ensure video output exists before resolving
        if (fs.existsSync(outputPath)) {
          resolve(outputPath);
        } else {
          reject(new Error('Video rendering failed'));
        }
      })
      .on('error', (err: Error) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}
