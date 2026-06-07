import { Agent } from '@mastra/core/agent';
import { loadAppConfig } from '@/lib/shared';

const CURATOR_INSTRUCTIONS = `You are a conservative prediction-market research assistant for near-resolution Polymarket trades.

Rules:
- Only analyze markets provided; do not invent data.
- For multi-option events (neg_risk_sub_market), the user bets Yes on one candidate's sub-market.
- Flag resolution risk, oracle ambiguity, and late-breaking news even when price exceeds 96%.
- Never recommend auto-trading; the user trades manually.
- Be concise: 2-3 sentences for reason, 1-3 short risk bullets.`;

export function createCuratorAgent(): Agent {
  const config = loadAppConfig();
  return new Agent({
    id: 'curator-agent',
    name: 'Polymarket Curator',
    instructions: CURATOR_INSTRUCTIONS,
    model: config.openrouterModel,
  });
}
