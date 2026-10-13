import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      speaker = 'simran',
      languageCode = 'en-IN',
      pace = 1.0,
      pitch = 0,
      model = 'bulbul:v3',
      apiKey: clientApiKey,
    } = body;

    const apiKey = clientApiKey || process.env.SARVAM_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        {
          error: 'SARVAM_API_KEY is not configured. Please add your Sarvam API key in System Settings or .env',
          code: 'KEY_MISSING',
        },
        { status: 400 }
      );
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text prompt is required' }, { status: 400 });
    }

    // Limit text chunk size to Sarvam's recommended limits (under 500 characters per request)
    const trimmedText = text.trim().slice(0, 500);

    const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey.trim(),
      },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        inputs: [trimmedText],
        target_language_code: languageCode,
        speaker: speaker,
        pitch: pitch,
        pace: pace,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: model,
      }),
    });

    if (!sarvamRes.ok) {
      const errText = await sarvamRes.text();
      return NextResponse.json(
        {
          error: `Sarvam TTS API Error (${sarvamRes.status}): ${errText}`,
          statusCode: sarvamRes.status,
        },
        { status: sarvamRes.status }
      );
    }

    const data = await sarvamRes.json();
    const base64Audio = data?.audios?.[0];

    if (!base64Audio) {
      return NextResponse.json({ error: 'No audio returned by Sarvam TTS' }, { status: 502 });
    }

    return NextResponse.json({
      audio: `data:audio/wav;base64,${base64Audio}`,
      rawBase64: base64Audio,
      model: model,
      speaker: speaker,
    });
  } catch (error: any) {
    console.error('Sarvam TTS error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error in Sarvam TTS route' },
      { status: 500 }
    );
  }
}
