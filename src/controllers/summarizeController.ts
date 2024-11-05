import { Request, Response } from 'express';
import { extractAudio } from '../services/audioExtractionService';
import { transcribeAudio } from '../services/sttService';
import { summarizeText } from '../services/summarizationService';
import { renderSummaryOnVideo } from '../services/videoRenderingService';
import path from 'path';
import fs from 'fs';

export async function summarizeVideo(req: Request, res: Response): Promise<void> {
  const videoPath = req.file?.path;
  if (!videoPath) {
    res.status(400).json({ error: 'No video file provided' });
    return;
  }

  try {
    const audioPath = await extractAudio(videoPath);
    const transcription = await transcribeAudio(audioPath);
    const summary = await summarizeText(transcription);
    const summarizedVideoPath = await renderSummaryOnVideo(videoPath, summary);

    // Clean up the audio file
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    res.json({ summary, summarizedVideoPath });
  } catch (error) {
    console.error('Error in summarizeVideo:', error);
    res.status(500).json({ error: 'An error occurred while summarizing the video' });
  } finally {
    // Clean up the uploaded video file
    if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
  }
}
