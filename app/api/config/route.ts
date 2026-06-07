import { NextResponse } from 'next/server';
import { loadAppConfig } from '@/lib/shared';

export async function GET() {
  return NextResponse.json(loadAppConfig());
}
