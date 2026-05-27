import { NextResponse } from 'next/server';
import { listRecommendations } from '@/lib/backend';
import type { Recommendation, Reminder } from '@/lib/store';

export async function GET() {
  const { reminders, recommendations } = await listRecommendations();
  return NextResponse.json({
    reminders,
    recommendations,
    archive: {
      reminders: reminders.filter((item: Reminder) => item.status !== 'open'),
      recommendations: recommendations.filter((item: Recommendation) => item.status !== 'open')
    }
  });
}
