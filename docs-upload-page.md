## Upload audio page

A new page is available at:

- `/upload`

This page lets the user upload an audio file and receive transcription text.

### Current implementation

- Frontend page: `app/upload/page.tsx`
- API route: `app/api/transcribe-upload/route.ts`
- Current backend provider: Deepgram

### Important note

The upload page currently uses the server-side `DEEPGRAM_API_KEY` to transcribe uploaded audio files.
If you want this page to work fully offline, the next step would be to add:

- a local file-upload endpoint for Whisper, or
- a Python batch transcription endpoint under `server_python/serverWhisper`
