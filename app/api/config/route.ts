import { NextResponse } from 'next/server';

export async function GET() {
  const fallbackEnabled = process.env.ENABLE_FALLBACK_LLM === 'true';
  const fallbackConfigured = !!(
    process.env.FALLBACK_LLM_ENDPOINT &&
    process.env.FALLBACK_LLM_KEY
  );

  return NextResponse.json({
    fallbackAvailable: fallbackEnabled && fallbackConfigured,
    rateLimit: parseInt(process.env.RATE_LIMIT_PER_HOUR || '10', 10),
  });
}
