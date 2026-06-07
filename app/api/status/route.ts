import { NextResponse } from 'next/server';
import { getLastRunStatus } from '@/lib/services/run-status';

export async function GET() {
  return NextResponse.json({ message: getLastRunStatus() });
}
