'use client';

import { AUDIO_MODE, getSupportedMimeType, WS_URL } from '@/lib/config';
import type { AudioMode, ServerEvent, TranscriptSegment } from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RecorderControls } from '@/components/recorder-controls';
import { StatusBar } from '@/components/status-bar';
import { TranscriptPanel } from '@/components/transcript-panel';

type RecorderStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'recording'
  | 'transcribing'
  | 'stopped';

type WorkletAudioMessage = {
  type: 'pcm';
  payload: ArrayBuffer;
};

export function RecorderPage() {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState('');

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const audioMode = (AUDIO_MODE === 'pcm' ? 'pcm' : 'mediarecorder') as AudioMode;

  const cleanupMediaRecorder = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }, []);

  const cleanupAudioGraph = useCallback(async () => {
    workletNodeRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    sourceNodeRef.current = null;

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const cleanupTracks = useCallback(() => {
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

  const stopTranscription = useCallback(async () => {
    cleanupMediaRecorder();
    await cleanupAudioGraph();
    cleanupTracks();
    cleanupSocket();
    setStatus('stopped');
    setInterimText('');
  }, [cleanupAudioGraph, cleanupMediaRecorder, cleanupSocket, cleanupTracks]);

  const attachSocketHandlers = useCallback(
    (socket: WebSocket) => {
      socket.onmessage = (event) => {
        try {
          const payload: ServerEvent = JSON.parse(event.data as string);
          if (payload.type === 'status') {
            if (payload.status === 'transcribing') setStatus('transcribing');
            if (payload.status === 'connected') setStatus('connected');
            if (payload.status === 'stopped') setStatus('stopped');
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
            void stopTranscription();
          }
        } catch {
          setError('无法解析服务器消息。');
        }
      };

      socket.onerror = () => {
        setError('WebSocket 连接失败。');
        void stopTranscription();
      };

      socket.onclose = () => {
        cleanupTracks();
      };
    },
    [cleanupTracks, stopTranscription],
  );

  const startWithMediaRecorder = useCallback(
    async (stream: MediaStream, socket: WebSocket) => {
      const mimeType = getSupportedMimeType();
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
        void stopTranscription();
      };

      recorder.start(250);
      setStatus('recording');
    },
    [stopTranscription],
  );

  const startWithPcm = useCallback(
    async (stream: MediaStream, socket: WebSocket) => {
      socket.send(
        JSON.stringify({
          type: 'start',
          audioFormat: 'pcm16',
          sampleRate: 16000,
          channels: 1,
        }),
      );

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      await audioContext.audioWorklet.addModule('/worklets/pcm-recorder-worklet.js');

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const workletNode = new AudioWorkletNode(audioContext, 'pcm-recorder-worklet');
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event: MessageEvent<WorkletAudioMessage>) => {
        if (socket.readyState !== WebSocket.OPEN) {
          return;
        }

        if (event.data?.type === 'pcm') {
          socket.send(event.data.payload);
          setStatus('transcribing');
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
      setStatus('recording');
    },
    [],
  );

  const startTranscription = useCallback(async () => {
    try {
      setError(null);
      setSegments([]);
      setInterimText('');
      setStatus('connecting');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const socket = new WebSocket(WS_URL);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;
      attachSocketHandlers(socket);

      socket.onopen = async () => {
        setStatus('connected');

        if (audioMode === 'pcm') {
          await startWithPcm(stream, socket);
          return;
        }

        await startWithMediaRecorder(stream, socket);
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '启动转写失败。';
      setError(message);
      cleanupMediaRecorder();
      await cleanupAudioGraph();
      cleanupTracks();
      cleanupSocket();
      setStatus('idle');
    }
  }, [attachSocketHandlers, audioMode, cleanupAudioGraph, cleanupMediaRecorder, cleanupSocket, cleanupTracks, startWithMediaRecorder, startWithPcm]);

  useEffect(() => {
    return () => {
      void cleanupAudioGraph();
      cleanupMediaRecorder();
      cleanupTracks();
      cleanupSocket();
    };
  }, [cleanupAudioGraph, cleanupMediaRecorder, cleanupSocket, cleanupTracks]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">实时会议语音转文字</h1>
        <p className="max-w-3xl text-sm leading-7 text-zinc-400">
          这是一个 Web MVP：浏览器采集麦克风音频，通过 WebSocket 发送到转写后端，并将字幕实时展示给用户。当前支持 MediaRecorder 模式和离线后端所需的 PCM 模式。
        </p>
      </section>

      <StatusBar status={status} error={error} audioMode={audioMode} wsUrl={WS_URL} />

      <RecorderControls
        onStart={() => void startTranscription()}
        onStop={() => void stopTranscription()}
        disabledStart={status === 'connecting' || status === 'recording' || status === 'transcribing'}
        disabledStop={status === 'idle' || status === 'stopped'}
      />

      <TranscriptPanel segments={segments} interimText={interimText} />
    </main>
  );
}
