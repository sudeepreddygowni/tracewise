/**
 * Tracewise Assistant Architecture — Proposal Validation Layer
 * Ensures AI or deterministic suggestions comply with circuit safety rules before presentation.
 */

export function validateProposedChange(proposal, currentContext) {
  if (!proposal || !proposal.id) {
    return { valid: false, reason: 'Invalid proposal structure' };
  }

  // Check code syntax sanity
  if (proposal.type === 'code' && proposal.code) {
    // Basic bracket and parentheses balance
    const openBraces = (proposal.code.match(/{/g) || []).length;
    const closeBraces = (proposal.code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      return { valid: false, reason: 'Syntax error: Mismatched curly braces in proposed C++ firmware.' };
    }
  }

  // Check circuit connection sanity
  if (proposal.type === 'circuit' && proposal.connections) {
    for (const conn of proposal.connections) {
      if (conn.from === conn.to) {
        return { valid: false, reason: 'Illegal self-connection detected.' };
      }
    }
  }

  return { valid: true };
}
