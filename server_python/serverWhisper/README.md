# Faster-Whisper offline server

High-accuracy offline speech-to-text backend using `faster-whisper`.

## Features

- Fully offline
- Better recognition quality than lightweight engines
- Supports Chinese (`zh`) by default
- Sends interim-style updates for the latest chunk and final transcript segments

## Recommended use

This server is best when you want higher transcript quality and can accept chunk-based near-real-time updates.

## Setup

```bash
cd server_python/serverWhisper
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

The server starts by default at:

- `ws://localhost:8090`

## Environment variables

- `WHISPER_MODEL` - default `small`
- `WHISPER_DEVICE` - default `cpu`
- `WHISPER_COMPUTE_TYPE` - default `int8`
- `WHISPER_LANGUAGE` - default `zh`
- `WHISPER_PORT` - default `8090`
- `WHISPER_CHUNK_SECONDS` - default `3`

Example:

```bash
WHISPER_MODEL=medium
WHISPER_LANGUAGE=zh
WHISPER_PORT=8090
python app.py
```

## Notes

- For better accuracy, use `small`, `medium`, or larger models if your machine can handle them.
- First run will download the selected model unless you have it cached locally already.
- This is fully offline after the model is present locally.
