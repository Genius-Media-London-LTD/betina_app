export function safeGenius2PlayCanonical(value: unknown): string {
  if (typeof value !== 'string' || value.includes('%')) return '';
  try {
    const parsed = new URL(value);
    const trustedHost = parsed.hostname === 'genius2play.com' || parsed.hostname === 'www.genius2play.com';
    const canonicalPath = /^\/(?:global|en|de|es|fr|pt|pt-BR)\/[a-z0-9-]+\/news\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (
      parsed.protocol !== 'https:' || !trustedHost || parsed.port || parsed.username || parsed.password
      || parsed.search || parsed.hash || !canonicalPath.test(parsed.pathname)
    ) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}
