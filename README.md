# Meeting Voice to Text

A web MVP for real-time meeting voice-to-text transcription with a Next.js frontend and a Node.js WebSocket backend.

## Features

- Browser microphone capture
- Real-time audio streaming over WebSocket
- Live transcript UI with interim and final segments
- Start / stop transcription controls
- Connection and transcription status indicators
- Configurable speech-to-text provider integration
- Optional offline PCM pipeline for local Whisper / Vosk backends

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Node.js WebSocket server (`ws`)
- Deepgram real-time transcription SDK
- Optional Python offline backends for Faster-Whisper and Vosk

## Project Structure

- `app/` - Next.js app pages and layout
- `components/` - UI components
- `lib/` - shared client utilities and types
- `public/worklets/` - browser audio worklet for PCM capture
- `server/` - Node.js WebSocket + transcription bridge server
- `server_python/` - offline Python speech-to-text servers

## Prerequisites

- Node.js 18+
- npm 9+
- For online mode: a Deepgram API key
- For offline mode: a local Whisper or Vosk backend

## Environment Variables

Create a `.env.local` file in the project root:

```bash
DEEPGRAM_API_KEY=your_deepgram_api_key
NEXT_PUBLIC_TRANSCRIPTION_WS_URL=ws://localhost:8080
NEXT_PUBLIC_AUDIO_MODE=pcm
```

### `NEXT_PUBLIC_AUDIO_MODE`

- `mediarecorder` - use browser `MediaRecorder` (good for the existing `/server` backend)
- `pcm` - use Web Audio API PCM16 16k streaming (required for offline `server_python` backends)

Examples:

#### Existing online Node server

```bash
NEXT_PUBLIC_TRANSCRIPTION_WS_URL=ws://localhost:8080
NEXT_PUBLIC_AUDIO_MODE=mediarecorder
```

#### Offline Whisper backend

```bash
NEXT_PUBLIC_TRANSCRIPTION_WS_URL=ws://localhost:8090
NEXT_PUBLIC_AUDIO_MODE=pcm
```

#### Offline Vosk backend

```bash
NEXT_PUBLIC_TRANSCRIPTION_WS_URL=ws://localhost:8091
NEXT_PUBLIC_AUDIO_MODE=pcm
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

Then choose one backend:

### Option A: Existing online Node WebSocket server

```bash
npm run server
```

### Option B: Offline Whisper Python server

See `server_python/serverWhisper/README.md`

### Option C: Offline Vosk Python server

See `server_python/serverVosk/README.md`

Then open:

- Frontend: `http://localhost:3000`

## Audio pipeline modes

### MediaRecorder mode

- Sends browser audio chunks such as `webm/opus`
- Intended for the existing `/server` backend and cloud transcription integration

### PCM mode

- Captures microphone audio via Web Audio API
- Downmixes to mono
- Resamples to 16kHz
- Converts to PCM16
- Streams binary audio frames over WebSocket
- Intended for offline Whisper / Vosk backends

## Notes

- This MVP is optimized for microphone input from the browser.
- Capturing system audio from meeting apps is more constrained in browsers and may require a desktop app approach.
- PCM mode is the recommended path for fully offline local speech-to-text backends.
