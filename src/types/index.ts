// types/index.ts
export interface VideoSummary {
    originalVideo: string;
    transcription: string;
    summary: string;
    summaryVideo: string;
  }
  
  export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
  }