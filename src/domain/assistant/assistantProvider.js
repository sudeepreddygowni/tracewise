/**
 * Tracewise Assistant Architecture — Provider Interface & Gateway
 * Decouples the UI from any external or local model provider.
 * 
 * NOTE ON EXTERNAL AI PROVIDERS (e.g. Google Gemini API):
 * In accordance with Google API Terms of Service, services must not be accessed
 * by children or applications directed to children under 18 without appropriate parental
 * consent or enterprise educational agreements. For student safety and compliance,
 * Tracewise operates a grounded, deterministic engineering assistant and does not expose
 * client-side API keys or unverified cloud LLM proxies.
 */

import { buildAssistantContext } from './assistantContextBuilder';
import { generateDeterministicProposals, answerAssistantQuery } from './deterministicAssistantEngine';
import { validateProposedChange } from './proposalValidator';

export const ASSISTANT_PROVIDER_MODE = {
  DETERMINISTIC: 'deterministic',
  SERVER_GATEWAY: 'server_gateway'
};

function getClientSessionId() {
  try {
    let sid = sessionStorage.getItem('tw_client_session_id');
    if (!sid) {
      sid = 'cls_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      sessionStorage.setItem('tw_client_session_id', sid);
    }
    return sid;
  } catch {
    return 'anon_session';
  }
}

class AssistantProvider {
  constructor(mode = ASSISTANT_PROVIDER_MODE.SERVER_GATEWAY) {
    this.mode = mode;
  }

  async getProposals({ project, validation, onApplyFix }) {
    const rawProposals = generateDeterministicProposals({ project, validation, onApplyFix });
    const context = buildAssistantContext(project, validation);

    // Filter through safety validation layer
    return rawProposals.filter(p => {
      const check = validateProposedChange(p, context);
      return check.valid;
    });
  }

  async getResponse({ queryText, project, validation, history = [], task = 'general' }) {
    // 1. Try server-side Assistant Gateway (/api/assistant)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': getClientSessionId()
        },
        body: JSON.stringify({
          queryText,
          task,
          projectContext: {
            id: project?.id,
            title: project?.title,
            components: project?.components || [],
            connections: project?.connections || [],
            firmwareCode: project?.firmware?.files?.[0]?.content || project?.code || '',
            validation
          },
          history: history.slice(-6).map(m => ({ role: m.role, text: m.text }))
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          text: data.text,
          provider: data.provider || 'Tracewise Serverless Assistant Gateway',
          sourceTag: data.sourceTag || 'Deterministic Rule Engine',
          verifiedFacts: data.verifiedFacts || [],
          suggestions: data.suggestions || [],
          proposals: data.proposals || [],
          confidence: null // Explicitly un-fabricated per student accuracy standards
        };
      }
    } catch {
      // Gracefully fall back to local client-side deterministic engine (offline/dev fallback)
    }

    // 2. Client-side deterministic reasoning fallback
    const answer = answerAssistantQuery({ queryText, project, validation });
    return {
      text: answer,
      provider: 'Tracewise Deterministic Rule Engine',
      sourceTag: 'Deterministic Rule Engine',
      verifiedFacts: [
        `Components: ${(project?.components || []).length}`,
        `Connections: ${(project?.connections || []).length}`
      ],
      suggestions: [
        'Check if my firmware pins match hardware',
        'Explain why I need a resistor for the LED'
      ],
      confidence: null
    };
  }
}

export const assistantProvider = new AssistantProvider();
