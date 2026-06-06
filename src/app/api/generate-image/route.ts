import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
        return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ role: 'user', parts: [{ text: `Generate a high-quality image: ${prompt}` }] }],
            config: { responseModalities: ['IMAGE', 'TEXT'] },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (!imagePart?.inlineData) throw new Error('No image in response');

        return NextResponse.json({
            imageData: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
            success: true,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[generate-image] Error:', msg);
        return NextResponse.json({ error: 'Image generation failed', details: msg }, { status: 500 });
    }
}
