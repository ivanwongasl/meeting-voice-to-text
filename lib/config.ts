export const WS_URL =
  process.env.NEXT_PUBLIC_TRANSCRIPTION_WS_URL ?? 'ws://localhost:8080';

export const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
];

export function getSupportedMimeType() {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return undefined;
  }

  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}
