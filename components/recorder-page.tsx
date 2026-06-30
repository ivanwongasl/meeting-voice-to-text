'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RecorderControls } from '@/components/recorder-controls';
import { StatusBar } from '@/components/status-bar';
import { TranscriptPanel } from '@/components/transcript-panel';
import { getSupportedMimeType, WS_URL } from '@/lib/config';
import type { ServerEvent, TranscriptSegment } from '@/lib/types';

export function RecorderPage() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'recording' | 'transcribing' | 'stopped'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState('');

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const cleanupMedia = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const cleanupSocket = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'stop' }));
      socketRef.current.close();
    }
    socketRef.current = null;
  }, []);

  const stopTranscription = useCallback(() => {
    cleanupMedia();
    cleanupSocket();
    setStatus('stopped');
    setInterimText('');
  }, [cleanupMedia, cleanupSocket]);

  const startTranscription = useCallback(async () => {
    try {
      setError(null);
      setSegments([]);
      setInterimText('');
      setStatus('connecting');

      if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
        throw new Error('当前浏览器不支持 MediaRecorder。');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const socket = new WebSocket(WS_URL);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus('connected');
        socket.send(JSON.stringify({ type: 'start', mimeType: mimeType ?? 'audio/webm' }));

        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            const buffer = await event.data.arrayBuffer();
            socket.send(buffer);
            setStatus('transcribing');
          }
        };

        recorder.onerror = () => {
          setError('录音过程中发生错误。');
          stopTranscription();
        };

        recorder.start(250);
        setStatus('recording');
      };

      socket.onmessage = (event) => {
        try {
          const payload: ServerEvent = JSON.parse(event.data as string);
          if (payload.type === 'status') {
            if (payload.status === 'transcribing') setStatus('transcribing');
            return;
          }

          if (payload.type === 'transcript') {
            if (payload.isFinal) {
              setSegments((prev) => [
                ...prev,
                {
                  id: payload.id,
                  text: payload.text,
                  isFinal: true,
                  createdAt: Date.now(),
                },
              ]);
              setInterimText('');
            } else {
              setInterimText(payload.text);
            }
          }

          if (payload.type === 'error') {
            setError(payload.message);
            stopTranscription();
          }
        } catch {
          setError('无法解析服务器消息。');
        }
      };

      socket.onerror = () => {
        setError('WebSocket 连接失败。');
        stopTranscription();
      };

      socket.onclose = () => {
        cleanupMedia();
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '启动转写失败。';
      setError(message);
      cleanupMedia();
      cleanupSocket();
      setStatus('idle');
    }
  }, [cleanupMedia, cleanupSocket, stopTranscription]);

  useEffect(() => {
    return () => {
      cleanupMedia();
      cleanupSocket();
    };
  }, [cleanupMedia, cleanupSocket]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">实时会议语音转文字</h1>
        <p className="max-w-3xl text-sm leading-7 text-zinc-400">
          这是一个 Web MVP：浏览器采集麦克风音频，通过 Node.js WebSocket 后端连接实时语音识别服务，并将字幕实时展示给用户。
        </p>
      </section>

      <StatusBar status={status} error={error} />

      <RecorderControls
        onStart={startTranscription}
        onStop={stopTranscription}
        disabledStart={status === 'connecting' || status === 'recording' || status === 'transcribing'}
        disabledStop={status === 'idle' || status === 'stopped'}
      />

      <TranscriptPanel segments={segments} interimText={interimText} />
    </main>
  );
}
