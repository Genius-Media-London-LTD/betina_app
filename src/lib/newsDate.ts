const NEWS_LOCALES: Record<string, string> = {
  de: 'de-DE',
  en: 'en-GB',
  es: 'es-ES',
  fr: 'fr-FR',
  pt: 'pt-BR',
};

export function formatPublishedMonth(value: string | undefined, lang: string): string {
  if (!value || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value)) return '';
  const [year, month] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
    NEWS_LOCALES[lang] ?? NEWS_LOCALES.en,
    { month: 'long', year: 'numeric', timeZone: 'UTC' },
  );
}
