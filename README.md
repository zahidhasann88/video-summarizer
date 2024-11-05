```markdown
# Video Summarizer API

A Node.js API for summarizing videos by extracting audio and generating summaries based on the audio content. This API leverages FFmpeg for media processing.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [License](#license)

## Features
- Upload videos for summarization
- Extract audio from video files
- Generate summaries from the audio content

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/video-summarizer-api.git
   cd video-summarizer-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install FFmpeg:**
   - Download FFmpeg from [FFmpeg official site](https://ffmpeg.org/download.html).
   - Follow the installation instructions for your operating system.
   - Ensure that the `bin` directory of FFmpeg is added to your system's PATH.

4. **Configure environment variables:**
   Create a `.env` file in the root directory and add your environment variables (if applicable).

## Usage

To start the API server in development mode, run:

```bash
npm run dev
```

The server will start on port 5000 (default). You can change the port in the configuration if needed.

## API Endpoints

### 1. Upload Video
- **Endpoint:** `/api/upload`
- **Method:** `POST`
- **Description:** Uploads a video file for summarization.
- **Request Body:**
  - `video`: (file) The video file to be processed.
- **Response:**
  - `200 OK`: Returns a summary of the video.
  - `400 Bad Request`: If the upload fails.

### 2. Summarize Video
- **Endpoint:** `/api/summarize`
- **Method:** `POST`
- **Description:** Summarizes the uploaded video based on extracted audio.
- **Request Body:**
  - `videoId`: (string) The ID of the video to summarize.
- **Response:**
  - `200 OK`: Returns the summary text.
  - `404 Not Found`: If the video ID does not exist.

## Environment Variables
| Variable       | Description                             |
|----------------|-----------------------------------------|
| `PORT`         | Port on which the server will run      |
| `OPENAI_API_KEY`  | your_openai_api_key           |