import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface RoundSummary { s: number; t: number; tip: string; b: string }
interface GamePayload {
    playedAt: string;
    rank: number;
    playerCount: number;
    totalScore: number;
    avgSimilarity: number;
    rounds: number;
    summaries: RoundSummary[];
}
interface StatsPayload {
    gamesPlayed: number;
    gamesWon: number;
    bestScore: number;
    avgSimilarity: number;
    avgTokens: number;
}

function isStringArray(v: unknown): v is string[] {
    return Array.isArray(v) && v.length > 0 && v.every(x => typeof x === 'string' && x.trim().length > 0);
}

export async function POST(req: NextRequest) {
    try {
        const { stats, games } = (await req.json()) as { stats?: StatsPayload; games?: GamePayload[] };

        if (!stats || !Array.isArray(games) || games.length === 0) {
            return NextResponse.json({ error: 'stats and a non-empty games array are required' }, { status: 400 });
        }

        // Compact, token-efficient description of each recent game and its per-round tips.
        const gamesText = games.map((g, i) => {
            const tips = (g.summaries ?? [])
                .map(r => `    round: similarity ${r.s}%, ${r.t} tokens — tip: "${r.tip}"`)
                .join('\n');
            return `Game ${i + 1} (${g.playedAt}): rank ${g.rank}/${g.playerCount}, score ${g.totalScore}, avg similarity ${g.avgSimilarity}%, ${g.rounds} rounds\n${tips}`;
        }).join('\n\n');

        const statsText = `Lifetime: ${stats.gamesPlayed} games, ${stats.gamesWon} wins, best score ${stats.bestScore}, avg similarity ${stats.avgSimilarity}%, avg tokens/round ${stats.avgTokens}.`;

        const prompt = `You are a coach for "Promptinary", a game where players write AI image prompts to recreate a reference image. They are scored on visual similarity (60%), prompt efficiency / tokens saved (25%), and speed (15%). Each round we already gave the player a one-line tip; those tips are included below.

Analyze THIS player's recent performance and cumulative stats. Compare patterns against the player's OWN averages — find what they consistently do well, where they consistently fall short, and what concrete changes would help most.

${statsText}

Recent games (newest first):
${gamesText}

Respond with ONLY valid JSON in this exact shape — 2 to 4 short bullets per array, each under 20 words, specific and actionable (no generic filler):
{
  "strengths": [string],
  "weaknesses": [string],
  "improvements": [string]
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
                temperature: 0.4,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                ],
            },
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('No response from Gemini');

        const parsed = JSON.parse(text);
        if (!isStringArray(parsed.strengths) || !isStringArray(parsed.weaknesses) || !isStringArray(parsed.improvements)) {
            throw new Error('Malformed insights JSON from model');
        }

        return NextResponse.json({
            strengths: parsed.strengths.slice(0, 4),
            weaknesses: parsed.weaknesses.slice(0, 4),
            improvements: parsed.improvements.slice(0, 4),
        });

    } catch (error: unknown) {
        console.error('[insights] Error:', error);
        return NextResponse.json({ error: 'Failed to generate insights. Please try again.' }, { status: 500 });
    }
}
