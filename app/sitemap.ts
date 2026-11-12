import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: new URL('/', env.SITE_URL).toString(), changeFrequency: 'yearly', priority: 1 },
    { url: new URL('/lanternas', env.SITE_URL).toString(), changeFrequency: 'weekly', priority: 0.8 },
    { url: new URL('/sobre', env.SITE_URL).toString(), changeFrequency: 'yearly', priority: 0.5 },
  ]
}
