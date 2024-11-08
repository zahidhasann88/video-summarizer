// controllers/summarizeController.ts
import { Request, Response, NextFunction } from 'express';
import { extractAudio } from '../services/audioExtractionService';
import { transcribeAudio } from '../services/sttService';
import { summarizeText } from '../services/summarizationService';
import { renderSummaryOnVideo } from '../services/videoRenderingService';
import { ApiException } from '../middleware/errorHandler';
import fs from 'fs/promises';
import path from 'path';

export async function summarizeVideo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const videoFile = req.file;
  if (!videoFile) {
    throw new ApiException('NO_VIDEO_FILE', 'No video file provided', 400);
  }

  const filePaths: string[] = [videoFile.path];
  try {
    // Extract audio
    const audioPath = await extractAudio(videoFile.path);
    filePaths.push(audioPath);

    // Transcribe audio to text
    const transcription = await transcribeAudio(audioPath);

    // Generate summary
    const summary = await summarizeText(transcription);

    // Render summary on video
    const summaryVideoPath = await renderSummaryOnVideo(videoFile.path, summary);
    filePaths.push(summaryVideoPath);

    res.json({
      success: true,
      data: {
        transcription,
        summary,
        videoPath: summaryVideoPath,
      },
    });
  } catch (error) {
    next(error);
  } finally {
    // Clean up files
    await Promise.all(
      filePaths.map((filePath) =>
        fs.unlink(filePath).catch((err) => 
          console.error(`Failed to delete file ${filePath}:`, err)
        )
      )
    );
  }
}