/**
 * Tracewise Assistant Architecture — Provider Interface & Gateway
 * Decouples the UI from any external or local model provider.
 * 
 * NOTE ON EXTERNAL AI PROVIDERS (e.g. Google Gemini API):
 * In accordance with Google API Terms of Service, services must not be accessed
 * by children or applications directed to children under 18 without appropriate parental
 * consent or enterprise educational agreements. For student safety and compliance,
 * Tracewise operates a local, deterministic engineering assistant and does not expose
 * client-side API keys or unverified cloud LLM proxies.
 */

import { buildAssistantContext } from './assistantContextBuilder';
import { generateDeterministicProposals, answerAssistantQuery } from './deterministicAssistantEngine';
import { validateProposedChange } from './proposalValidator';

export const ASSISTANT_PROVIDER_MODE = {
  DETERMINISTIC: 'deterministic',
  SERVER_GATEWAY: 'server_gateway' // Prepared for eligible future backend
};

class AssistantProvider {
  constructor(mode = ASSISTANT_PROVIDER_MODE.DETERMINISTIC) {
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

  async getResponse({ queryText, project, validation, history = [] }) {
    // Delegates to our deterministic assistant engine
    const answer = answerAssistantQuery({ queryText, project, validation });
    return {
      text: answer,
      provider: 'Tracewise Deterministic Rule Engine',
      confidence: 1.0
    };
  }
}

export const assistantProvider = new AssistantProvider();
