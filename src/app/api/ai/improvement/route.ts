import { NextRequest, NextResponse } from 'next/server';
import { generateImprovementSummary } from '@/lib/ai/gemini';
import { ImprovementComparison } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const comparison: ImprovementComparison = await req.json();

    if (!comparison || !comparison.baselineSnapshot || !comparison.latestSnapshot) {
      return NextResponse.json(
        { error: 'Missing comparison snapshots' },
        { status: 400 }
      );
    }

    const summary = await generateImprovementSummary(comparison);
    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error('Error generating improvement comparison summary:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error in comparison analysis' },
      { status: 500 }
    );
  }
}
