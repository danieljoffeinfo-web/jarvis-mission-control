import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    reminders: store.reminders,
    recommendations: store.recommendations,
    archive: {
      reminders: store.reminders.filter((item) => item.status !== 'open'),
      recommendations: store.recommendations.filter((item) => item.status !== 'open')
    }
  });
}
