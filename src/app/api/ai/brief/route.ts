import { NextRequest, NextResponse } from 'next/server';
import { generateAICounsellingBrief } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student, academic, risk, behaviour, history, previousSessions } = body;

    if (!student || !academic || !risk) {
      return NextResponse.json(
        { error: 'Missing required student, academic, or risk assessment payload' },
        { status: 400 }
      );
    }

    const brief = await generateAICounsellingBrief({
      student,
      academic,
      risk,
      behaviour,
      history,
      previousSessions,
    });

    return NextResponse.json(brief);
  } catch (err: any) {
    console.error('Error generating AI counselling brief:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error in AI brief generation' },
      { status: 500 }
    );
  }
}
