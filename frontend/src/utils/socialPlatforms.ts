const SOCIAL_DOMAINS = [
  'instagram.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'linkedin.com',
  'youtube.com',
  'tiktok.com',
  'facebook.com',
  'threads.net',
  'pinterest.com',
]

export function isSocialPlatform(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/^www\./, '')
  return SOCIAL_DOMAINS.some((social) => normalized.includes(social))
}

export function socialPlatformsInResults(domains: string[]): string[] {
  const found = new Set<string>()
  for (const domain of domains) {
    for (const social of SOCIAL_DOMAINS) {
      if (domain.toLowerCase().includes(social)) {
        found.add(social.replace('.com', '').replace('.net', ''))
      }
    }
  }
  return Array.from(found)
}
