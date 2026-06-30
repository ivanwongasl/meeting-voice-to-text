import asyncio
import io
import json
import os
import tempfile
import wave
from dataclasses import dataclass
from typing import List

import numpy as np
from faster_whisper import WhisperModel
from websockets.server import serve

PORT = int(os.getenv('WHISPER_PORT', '8090'))
MODEL_NAME = os.getenv('WHISPER_MODEL', 'small')
DEVICE = os.getenv('WHISPER_DEVICE', 'cpu')
COMPUTE_TYPE = os.getenv('WHISPER_COMPUTE_TYPE', 'int8')
LANGUAGE = os.getenv('WHISPER_LANGUAGE', 'zh')
CHUNK_SECONDS = float(os.getenv('WHISPER_CHUNK_SECONDS', '3'))
SAMPLE_RATE = 16000
CHANNELS = 1
SAMPLE_WIDTH = 2

model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE_TYPE)


@dataclass
class SessionState:
    pcm_chunks: List[bytes]
    final_segments: List[str]


def json_message(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False)


def decode_audio_bytes(raw: bytes) -> np.ndarray:
    # Browser MediaRecorder usually sends webm/opus, which Whisper cannot read directly as PCM.
    # This offline Python example expects the client or a local bridge to send PCM16 mono 16k audio bytes.
    audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return audio


def write_wav_file(pcm_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
        with wave.open(tmp, 'wb') as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(SAMPLE_WIDTH)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(pcm_bytes)
        return tmp.name


async def process_chunk(websocket, state: SessionState):
    pcm_bytes = b''.join(state.pcm_chunks)
    if len(pcm_bytes) < SAMPLE_RATE * SAMPLE_WIDTH * CHUNK_SECONDS:
        return

    wav_path = write_wav_file(pcm_bytes)
    try:
        segments, _info = model.transcribe(
            wav_path,
            language=LANGUAGE,
            vad_filter=True,
            condition_on_previous_text=True,
        )

        texts = [segment.text.strip() for segment in segments if segment.text.strip()]
        if not texts:
            return

        combined = ' '.join(texts).strip()
        await websocket.send(
            json_message(
                {
                    'type': 'transcript',
                    'id': f'interim-{len(state.final_segments) + 1}',
                    'text': combined,
                    'isFinal': False,
                }
            )
        )

        if combined and (not state.final_segments or state.final_segments[-1] != combined):
            state.final_segments.append(combined)
            await websocket.send(
                json_message(
                    {
                        'type': 'transcript',
                        'id': f'final-{len(state.final_segments)}',
                        'text': combined,
                        'isFinal': True,
                    }
                )
            )

        state.pcm_chunks.clear()
    finally:
        try:
            os.remove(wav_path)
        except OSError:
            pass


async def handler(websocket):
    state = SessionState(pcm_chunks=[], final_segments=[])
    await websocket.send(json_message({'type': 'status', 'status': 'connected'}))

    async for message in websocket:
        if isinstance(message, str):
            try:
                payload = json.loads(message)
            except json.JSONDecodeError:
                await websocket.send(json_message({'type': 'error', 'message': 'Invalid control message'}))
                continue

            if payload.get('type') == 'start':
                await websocket.send(json_message({'type': 'status', 'status': 'transcribing'}))
            elif payload.get('type') == 'stop':
                await process_chunk(websocket, state)
                await websocket.send(json_message({'type': 'status', 'status': 'stopped'}))
                break
            continue

        state.pcm_chunks.append(message)
        if sum(len(chunk) for chunk in state.pcm_chunks) >= int(SAMPLE_RATE * SAMPLE_WIDTH * CHUNK_SECONDS):
            await process_chunk(websocket, state)


async def main():
    async with serve(handler, '0.0.0.0', PORT, max_size=10 * 1024 * 1024):
        print(f'Whisper offline WebSocket server listening on ws://localhost:{PORT}')
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())
