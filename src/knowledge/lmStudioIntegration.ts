/**
 * LM Studio integration — connects to a local OpenAI-compatible API
 * for generating natural language assessment summaries.
 */

import type { AssessmentFinding, Recommendation } from '../types';

const LM_STUDIO_URL = 'http://localhost:1234/v1/chat/completions';
const MODEL_NAME = 'openai/gpt-oss-20b';

let isAvailable: boolean | null = null;

/**
 * Check if LM Studio is running and reachable.
 */
export async function checkLMStudioAvailability(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:1234/v1/models', {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    isAvailable = res.ok;
    return isAvailable;
  } catch {
    isAvailable = false;
    return false;
  }
}

/**
 * Generate a friendly natural language summary from assessment findings.
 */
export async function generateLLMSummary(
  findings: AssessmentFinding[],
  recommendations: Recommendation[],
  overallScore: number,
  symmetryScore: number
): Promise<string | null> {
  // Check availability on first call
  if (isAvailable === null) {
    await checkLMStudioAvailability();
  }
  if (!isAvailable) return null;

  const findingsText = findings.length > 0
    ? findings.map((f) => `- ${f.message} (${f.severity})`).join('\n')
    : '- No significant findings. Posture appears within normal ranges.';

  const exerciseText = recommendations.length > 0
    ? recommendations.flatMap((r) =>
        r.exercises.map((e) => `- ${e.name}: ${e.description} (${e.dosage})`)
      ).join('\n')
    : '- No specific exercises needed at this time.';

  const prompt = `You are a friendly movement coach. Explain the following posture assessment results in plain, encouraging language. Keep it under 150 words.

Overall Score: ${overallScore}/100
Symmetry Score: ${symmetryScore}/100

Observed findings:
${findingsText}

Suggested exercises:
${exerciseText}

Rules:
- Do NOT diagnose any disease or medical condition.
- Do NOT claim certainty about causes.
- Use encouraging, supportive language.
- Mention that these are movement observations, not medical assessments.
- Encourage professional evaluation if pain persists.
- Be concise.`;

  try {
    console.log('[LM Studio] Sending request to local model...', { url: LM_STUDIO_URL, model: MODEL_NAME });
    
    const res = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: 'You are a supportive movement and posture coach. You provide friendly, non-medical observations.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      console.error('[LM Studio] HTTP Error:', res.status, res.statusText);
      return `⚠️ LM Studio responded with an error (${res.status}). Check the server logs.`;
    }

    const data = await res.json();
    console.log('[LM Studio] Response received successfully.');
    return data.choices?.[0]?.message?.content?.trim() || 'No summary generated.';
  } catch (error) {
    console.error('[LM Studio] Connection failed:', error);
    return `⚠️ Could not reach local LM Studio server.\n\nPlease ensure:\n1. LM Studio is running.\n2. The local server is started on port 1234.\n3. CORS is enabled in LM Studio settings.`;
  }
}
