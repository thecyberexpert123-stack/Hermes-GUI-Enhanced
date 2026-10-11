import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const model = (formData.get('model') as string) || 'saaras:v3';
    const rawLang = formData.get('language_code') as string;
    const languageCode = rawLang && rawLang !== 'unknown' ? rawLang : 'en-IN';
    const clientApiKey = formData.get('apiKey') as string | null;

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

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Audio file is required in formData' }, { status: 400 });
    }

    const fileName = (file instanceof File && file.name) ? file.name : (file.type?.includes('webm') ? 'audio.webm' : 'audio.wav');
    const sarvamFormData = new FormData();
    sarvamFormData.append('file', file, fileName);
    sarvamFormData.append('model', model);
    if (languageCode) {
      sarvamFormData.append('language_code', languageCode);
    }

    const sarvamRes = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey.trim(),
      },
      body: sarvamFormData,
    });

    if (!sarvamRes.ok) {
      const errText = await sarvamRes.text();
      return NextResponse.json(
        {
          error: `Sarvam STT API Error (${sarvamRes.status}): ${errText}`,
          statusCode: sarvamRes.status,
        },
        { status: sarvamRes.status }
      );
    }

    const data = await sarvamRes.json();
    return NextResponse.json({
      transcript: data.transcript || '',
      languageCode: data.language_code || languageCode,
      model: model,
    });
  } catch (error: any) {
    console.error('Sarvam STT error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error in Sarvam STT route' },
      { status: 500 }
    );
  }
}
