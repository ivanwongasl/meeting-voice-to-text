# Offline STT Python servers

This directory contains alternative fully offline speech-to-text backends.

## Folders

- `server_python/serverWhisper` - high-accuracy offline transcription using Faster-Whisper
- `server_python/serverVosk` - low-latency offline streaming transcription using Vosk

These do not modify the existing `/server` Node.js backend.

## Shared notes

- Create a Python virtual environment before installing dependencies.
- The frontend can point to one of these servers by changing `NEXT_PUBLIC_TRANSCRIPTION_WS_URL`.
- Default examples in these folders use WebSocket servers on different ports to avoid conflicts.
