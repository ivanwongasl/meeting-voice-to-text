export type TranscriptSegment = {
  id: string;
  text: string;
  isFinal: boolean;
  createdAt: number;
};

export type ServerEvent =
  | { type: 'status'; status: string; message?: string }
  | { type: 'transcript'; id: string; text: string; isFinal: boolean }
  | { type: 'error'; message: string };
