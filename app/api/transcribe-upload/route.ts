export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return Response.json({ error: 'Missing audio file.' }, { status: 400 });
    }

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramApiKey) {
      return Response.json(
        {
          error:
            'DEEPGRAM_API_KEY is not configured. This upload endpoint currently uses Deepgram for transcription.',
        },
        { status: 500 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=zh-CN&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `Deepgram transcription failed: ${errorText}` },
        { status: response.status },
      );
    }

    const result = await response.json();
    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? '';

    return Response.json({ transcript, raw: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload transcription failed.';
    return Response.json({ error: message }, { status: 500 });
  }
}
