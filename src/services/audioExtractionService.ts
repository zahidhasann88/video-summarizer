const ffmpeg = require('fluent-ffmpeg');
import path from 'path';
import fs from 'fs';

export async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = path.join(__dirname, '../../uploads/audio.wav');
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .on('end', () => {
        if (fs.existsSync(audioPath)) {
          resolve(audioPath);
        } else {
          reject(new Error('Audio extraction failed'));
        }
      })
      .on('error', (err: Error) => {
        console.error('FFmpeg error in extractAudio:', err);
        reject(err);
      })
      .run();
  });
}
