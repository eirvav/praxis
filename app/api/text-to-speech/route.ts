import { NextRequest, NextResponse } from 'next/server';

// Define the type for the request body
interface RequestBody {
  text: string;
  model_id: string;
  voice_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.ELEVENLABS_API_KEY;
    // Get voice ID from environment variable or use a fallback
    const defaultVoiceId = process.env.ELEVENLABS_VOICE_ID;
    
    if (!apiKey) {
      return NextResponse.json(
        { message: 'ElevenLabs API key is not configured' },
        { status: 500 }
      );
    }

    if (!defaultVoiceId) {
      console.warn('ELEVENLABS_VOICE_ID is not configured in environment variables');
    }

    // Parse request body
    const body: RequestBody = await request.json();
    const { text, model_id, voice_id = defaultVoiceId || 'pNInz6obpgDQGcFmaJgB' } = body;

    if (!text) {
      return NextResponse.json(
        { message: 'Text is required' },
        { status: 400 }
      );
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API error:', errorData);
      return NextResponse.json(
        { message: 'Error generating speech', details: errorData },
        { status: response.status }
      );
    }

    // Get audio buffer from response
    const audioBuffer = await response.arrayBuffer();

    // Return the audio as MP3
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json(
      { message: 'Failed to generate speech' },
      { status: 500 }
    );
  }
} 