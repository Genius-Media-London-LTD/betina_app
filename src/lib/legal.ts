// Legal / company content for the in-app Privacy, Terms, Imprint and About
// pages. Content is in English (standard for these documents).
//
// ⚠️ FILL THESE IN — the {{...}} placeholders below are the only things that
// need real values. The body text already describes what the app actually
// does with data; have it reviewed before submission.

export const COMPANY = {
  legalName: 'Genius Media London Ltd',
  address: 'Unit 3, Cedar Court, 1 Royal Oak Yard, London, England SE1 3GA',
  companyNumber: '11133948',
  contactEmail: 'marketing@geniusbet.com',
  privacyEmail: 'marketing@geniusbet.com',
  effectiveDate: '9 July 2026',
  governingLaw: 'England and Wales',
  directors: 'Dejan Morawietz',
};

export type LegalSection = { heading: string; body: string };
export type LegalDoc = { title: string; updated: string; sections: LegalSection[] };

export type LegalDocKey = 'privacy' | 'terms' | 'imprint' | 'about';

export const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {
  privacy: {
    title: 'Privacy Policy',
    updated: COMPANY.effectiveDate,
    sections: [
      {
        heading: 'Who we are',
        body: `BETina is operated by ${COMPANY.legalName} ("we", "us"), ${COMPANY.address} (company no. ${COMPANY.companyNumber}). For any privacy question, contact ${COMPANY.privacyEmail}.`,
      },
      {
        heading: 'What we collect',
        body:
          'Account: depending on how you sign in, your phone number or email address (each verified with a one-time code), or your Google or Apple account (we receive your name and email address from them).\n' +
          'Profile: the name, birthday, country, favourite sports and team, and language you provide during onboarding.\n' +
          'Chat: the messages you exchange with BETina.\n' +
          'Device: a push notification token, if you allow notifications.\n' +
          'Usage: basic activity such as your XP, streak and tier within the app.',
      },
      {
        heading: 'How we use it',
        body:
          'To run the service, sign you in, personalise BETina around your team and sports, keep your progress, and send only the notifications you switch on in Settings. We do not sell your data.',
      },
      {
        heading: 'AI and third parties',
        body:
          'Your chat messages are sent to Anthropic (the Claude AI) to generate BETina\'s replies. Sports fixtures, results and news are retrieved from third-party sports data providers. Account and profile data are stored on our infrastructure provider (Supabase). These providers process data on our behalf under their own terms.',
      },
      {
        heading: 'Your rights',
        body: `You can request access to, correction of, or deletion of your data at any time by emailing ${COMPANY.privacyEmail}. You can also delete your account, which removes your profile and chat history.`,
      },
      {
        heading: 'Retention & age',
        body:
          'We keep your data for as long as your account is active. BETina is for adults only — you must be 18 or older to use it.',
      },
      {
        heading: 'Changes',
        body: 'We may update this policy; the effective date above will change when we do.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: COMPANY.effectiveDate,
    sections: [
      {
        heading: 'Acceptance',
        body: `By using BETina you agree to these terms, operated by ${COMPANY.legalName}. If you do not agree, please do not use the app.`,
      },
      {
        heading: 'What BETina is',
        body:
          'BETina is an AI companion and entertainment app for sports fans. It provides chat, sports information, personalised updates and progress tracking. BETina is NOT a gambling product: no real-money wagers are placed or held in the app, and no money moves through it.',
      },
      {
        heading: 'Eligibility',
        body: 'You must be at least 18 years old to use BETina.',
      },
      {
        heading: 'Acceptable use',
        body:
          'Use BETina lawfully and respectfully. Do not misuse the service, attempt to disrupt it, or use it to harm others. We may suspend accounts that break these terms.',
      },
      {
        heading: 'Information accuracy',
        body:
          'Sports data and AI-generated content are provided for information and entertainment only, may be delayed or inaccurate, and are not advice. Always verify important information independently.',
      },
      {
        heading: 'Liability',
        body:
          'The app is provided "as is". To the extent permitted by law, we are not liable for indirect or consequential loss arising from your use of the app.',
      },
      {
        heading: 'Governing law',
        body: `These terms are governed by the laws of ${COMPANY.governingLaw}. Questions: ${COMPANY.contactEmail}.`,
      },
    ],
  },
  imprint: {
    title: 'Imprint',
    updated: COMPANY.effectiveDate,
    sections: [
      {
        heading: 'Company',
        body: `${COMPANY.legalName}\n${COMPANY.address}\nRegistered in England and Wales, company no. ${COMPANY.companyNumber}`,
      },
      {
        heading: 'Directors',
        body: COMPANY.directors,
      },
      {
        heading: 'Contact',
        body: `Email: ${COMPANY.contactEmail}`,
      },
    ],
  },
  about: {
    title: 'About BETina',
    updated: COMPANY.effectiveDate,
    sections: [
      {
        heading: 'Your AI sports companion',
        body:
          'BETina is a personal AI companion for sports fans — she follows your team, knows every sport, keeps you posted and cheers you on. Built by the team at ' +
          COMPANY.legalName +
          '.',
      },
      {
        heading: 'Responsible gaming',
        body:
          'BETina is entertainment, not gambling. If you or someone you know needs support, see the Responsible Gaming page in Settings or reach our team in the app.',
      },
    ],
  },
};
