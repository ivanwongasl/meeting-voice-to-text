import asyncio
import json
import os

from vosk import KaldiRecognizer, Model
from websockets.server import serve

MODEL_PATH = os.getenv('VOSK_MODEL_PATH')
PORT = int(os.getenv('VOSK_PORT', '8091'))
SAMPLE_RATE = float(os.getenv('VOSK_SAMPLE_RATE', '16000'))

if not MODEL_PATH:
    raise RuntimeError('VOSK_MODEL_PATH is required')

model = Model(MODEL_PATH)


def json_message(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False)


async def handler(websocket):
    recognizer = KaldiRecognizer(model, SAMPLE_RATE)
    recognizer.SetWords(True)

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
                final_result = json.loads(recognizer.FinalResult())
                text = final_result.get('text', '').strip()
                if text:
                    await websocket.send(
                        json_message(
                            {
                                'type': 'transcript',
                                'id': 'final-stop',
                                'text': text,
                                'isFinal': True,
                            }
                        )
                    )
                await websocket.send(json_message({'type': 'status', 'status': 'stopped'}))
                break
            continue

        if recognizer.AcceptWaveform(message):
            result = json.loads(recognizer.Result())
            text = result.get('text', '').strip()
            if text:
                await websocket.send(
                    json_message(
                        {
                            'type': 'transcript',
                            'id': f'final-{hash(text)}',
                            'text': text,
                            'isFinal': True,
                        }
                    )
                )
        else:
            partial = json.loads(recognizer.PartialResult())
            text = partial.get('partial', '').strip()
            if text:
                await websocket.send(
                    json_message(
                        {
                            'type': 'transcript',
                            'id': f'interim-{hash(text)}',
                            'text': text,
                            'isFinal': False,
                        }
                    )
                )


async def main():
    async with serve(handler, '0.0.0.0', PORT, max_size=10 * 1024 * 1024):
        print(f'Vosk offline WebSocket server listening on ws://localhost:{PORT}')
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())
