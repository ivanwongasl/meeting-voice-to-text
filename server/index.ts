import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { WebSocketServer, type WebSocket } from 'ws';

const port = Number(process.env.PORT ?? 8080);
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

if (!deepgramApiKey) {
  console.error('Missing DEEPGRAM_API_KEY environment variable.');
  process.exit(1);
}

const deepgram = createClient(deepgramApiKey);
const wss = new WebSocketServer({ port });

function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

wss.on('connection', (ws) => {
  sendJson(ws, { type: 'status', status: 'connected' });

  const dgConnection = deepgram.listen.live({
    model: 'nova-2',
    language: 'zh-CN',
    smart_format: true,
    interim_results: true,
    punctuate: true,
    endpointing: 300,
  });

  dgConnection.on(LiveTranscriptionEvents.Open, () => {
    sendJson(ws, { type: 'status', status: 'transcribing' });
  });

  dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const alternative = data.channel?.alternatives?.[0];
    const text = alternative?.transcript?.trim();
    if (!text) return;

    sendJson(ws, {
      type: 'transcript',
      id: crypto.randomUUID(),
      text,
      isFinal: Boolean(data.is_final),
    });
  });

  dgConnection.on(LiveTranscriptionEvents.Error, (error) => {
    console.error('Deepgram error', error);
    sendJson(ws, {
      type: 'error',
      message: '实时转写服务发生错误。',
    });
  });

  dgConnection.on(LiveTranscriptionEvents.Close, () => {
    sendJson(ws, { type: 'status', status: 'stopped' });
  });

  ws.on('message', (message, isBinary) => {
    if (!isBinary) {
      try {
        const payload = JSON.parse(message.toString()) as { type?: string };
        if (payload.type === 'stop') {
          dgConnection.requestClose();
          return;
        }
      } catch {
        sendJson(ws, { type: 'error', message: '无效的控制消息。' });
      }
      return;
    }

    dgConnection.send(message as Buffer);
  });

  ws.on('close', () => {
    dgConnection.requestClose();
  });

  ws.on('error', (error) => {
    console.error('Client websocket error', error);
    dgConnection.requestClose();
  });
});

console.log(`Transcription WebSocket server listening on ws://localhost:${port}`);
