export type View = 'signin' | 'signup' | 'forgot' | 'reset' | 'verify' | 'handoff' | 'success';
export type Provider = 'email' | 'google' | 'github' | 'saml';

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailError(v: string): string | null {
	if (!v.trim()) return 'Enter your email address.';
	if (!EMAIL_RE.test(v.trim())) return 'That email doesn\u2019t look right. Check it and try again.';
	return null;
}

export type Check = { label: string; ok: boolean; optional?: boolean };

export function passwordChecks(p: string): Check[] {
	return [
		{ label: '8+ characters', ok: p.length >= 8 },
		{ label: 'Mixed case', ok: /[a-z]/.test(p) && /[A-Z]/.test(p) },
		{ label: 'A number', ok: /\d/.test(p) },
		{ label: 'A symbol', ok: /[^A-Za-z0-9]/.test(p), optional: true }
	];
}

export function newPwOk(p: string): boolean {
	const c = passwordChecks(p);
	return c[0].ok && c[1].ok && c[2].ok;
}

export function passwordStrength(p: string): { score: number; label: string } {
	if (!p) return { score: 0, label: '' };
	let score = 0;
	if (p.length >= 8) score++;
	if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
	if (/\d/.test(p)) score++;
	if (/[^A-Za-z0-9]/.test(p) || p.length >= 16) score++;
	const labels = ['Weak', 'Fair', 'Good', 'Strong'];
	return { score, label: labels[Math.max(0, score - 1)] };
}

/** Seeded "already registered" account, so the sign-up conflict path is demonstrable. */
export const TAKEN_EMAIL = 'maya@studionorth.co';

const WORKSPACES: Record<string, string> = {
	studionorth: 'Studio North',
	northwind: 'Northwind',
	brillphoto: 'Brill Photo'
};

export function workspaceFromEmail(email: string): string {
	const base = (email.split('@')[1] ?? '').split('.')[0].toLowerCase();
	return WORKSPACES[base] ?? base.charAt(0).toUpperCase() + base.slice(1);
}

/** SSO domains the mock identity lookup knows about. */
export const SSO_DOMAINS: Record<string, { name: string; kind: string }> = {
	'studionorth.co': { name: 'Okta', kind: 'SAML' },
	'northwind.co.uk': { name: 'Microsoft Entra ID', kind: 'OIDC' },
	'brillphoto.com': { name: 'Google Workspace', kind: 'OIDC' }
};

export const PROVIDER_LABEL: Record<Provider, string> = {
	email: 'Email',
	google: 'Google',
	github: 'GitHub',
	saml: 'SSO'
};

/** Passwords that simulate a failed credential check (validation passes, API fails). */
export const BAD_PW = /^(password|incorrect|letmein)$/i;
