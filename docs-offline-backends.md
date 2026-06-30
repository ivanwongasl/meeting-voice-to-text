## Offline backend options

The repository now includes additional offline Python speech-to-text backends without changing the existing `/server` implementation:

- `server_python/serverWhisper` - offline high-accuracy Whisper-based backend
- `server_python/serverVosk` - offline low-latency Vosk backend

### Important audio format note

The current browser frontend uses `MediaRecorder`, which typically sends `webm/opus` chunks.
The offline Python examples in `server_python/` currently expect **PCM16 mono 16k audio** input.

So to use them end-to-end, you will likely want one of these follow-up options:

1. update the frontend to capture raw PCM audio with Web Audio API, or
2. add a local transcoding bridge that converts browser audio chunks to PCM before feeding the offline servers.

### Offline server ports

- Whisper offline server: `ws://localhost:8090`
- Vosk offline server: `ws://localhost:8091`
