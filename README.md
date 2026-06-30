# Meeting Voice to Text

A web MVP for real-time meeting voice-to-text transcription with a Next.js frontend and a Node.js WebSocket backend.

## Features

- Browser microphone capture
- Real-time audio streaming over WebSocket
- Live transcript UI with interim and final segments
- Start / stop transcription controls
- Connection and transcription status indicators
- Configurable speech-to-text provider integration

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Node.js WebSocket server (`ws`)
- Deepgram real-time transcription SDK

## Project Structure

- `app/` - Next.js app pages and layout
- `components/` - UI components
- `lib/` - shared client utilities and types
- `server/` - Node.js WebSocket + transcription bridge server

## Prerequisites

- Node.js 18+
- npm 9+
- A Deepgram API key

## Environment Variables

Create a `.env.local` file in the project root:

```bash
DEEPGRAM_API_KEY=your_deepgram_api_key
NEXT_PUBLIC_TRANSCRIPTION_WS_URL=ws://localhost:8080
```

## Install

```bash
npm install
```

## Run the app

Run the Next.js frontend:

```bash
npm run dev
```

In another terminal, run the WebSocket transcription server:

```bash
npm run server
```

Then open:

- Frontend: `http://localhost:3000`
- WebSocket server: `ws://localhost:8080`

## How it works

1. The browser requests microphone access.
2. Audio is captured with `MediaRecorder` and chunked periodically.
3. Audio chunks are sent to the Node.js WebSocket server.
4. The server forwards audio to Deepgram's live transcription API.
5. Transcript events are pushed back to the browser in real time.
6. The UI renders interim and final transcript segments live.

## Notes

- This MVP is optimized for microphone input from the browser.
- Capturing system audio from meeting apps is more constrained in browsers and may require a desktop app approach.
- If the browser or environment does not support `MediaRecorder` with the preferred MIME type, the app will fall back to a supported type when available.

## Error Handling

The app handles:

- microphone permission denial
- WebSocket connection failures
- backend transcription errors
- unsupported browser recording capabilities

## Future Improvements

- Save transcript history to a database
- Export transcripts as TXT / PDF / DOCX
- Speaker diarization
- Multi-language switching
- Authentication and meeting/session management
