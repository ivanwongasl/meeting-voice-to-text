# Vosk offline real-time server

Low-latency offline speech-to-text backend using Vosk.

## Features

- Fully offline
- Better suited to streaming / low-latency updates
- Supports partial and final recognition updates
- Good MVP option for real-time subtitles

## Setup

```bash
cd server_python/serverVosk
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

## Download a Vosk model

Download a Chinese model from the official Vosk models page and extract it locally.
Then set `VOSK_MODEL_PATH` to that folder.

Example:

```bash
export VOSK_MODEL_PATH=/absolute/path/to/vosk-model-small-cn-0.22
```

## Run

```bash
python app.py
```

The server starts by default at:

- `ws://localhost:8091`

## Environment variables

- `VOSK_MODEL_PATH` - required
- `VOSK_SAMPLE_RATE` - default `16000`
- `VOSK_PORT` - default `8091`

## Notes

- This example expects PCM16 mono 16k audio bytes from the client or a local bridge.
- For browser `MediaRecorder` WebM/Opus input, you will need a small local transcoding bridge if you want direct browser compatibility.
