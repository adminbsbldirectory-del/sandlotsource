export const MIN_FORM_SUBMIT_MS = 4000
export const HONEYPOT_FIELD = 'companyFax'

export function withSpamProtection(initialState) {
  return {
    ...initialState,
    [HONEYPOT_FIELD]: '',
  }
}

export function isSpamSubmission(form, startedAt) {
  const honeypotValue = String(form?.[HONEYPOT_FIELD] || '').trim()
  const elapsedMs = Date.now() - startedAt

  return honeypotValue !== '' || elapsedMs < MIN_FORM_SUBMIT_MS
}