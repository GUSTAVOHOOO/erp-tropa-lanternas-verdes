import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// [CSS-13] três famílias, cada uma com um papel: interface, títulos e dados
const barlow = Barlow({ variable: '--font-barlow', subsets: ['latin'], weight: ['400', '500', '600'] })
const barlowCondensed = Barlow_Condensed({ variable: '--font-barlow-condensed', subsets: ['latin'], weight: ['600', '700'] })
const plexMono = IBM_Plex_Mono({ variable: '--font-plex-mono', subsets: ['latin'], weight: ['500'] })

export const metadata: Metadata = {
  title: 'Central de Oa | Tropa dos Lanternas Verdes',
  description: 'Registro e acompanhamento de ocorrências intergalácticas da Tropa dos Lanternas Verdes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" /* [ROTA-05] */ className={`${barlow.variable} ${barlowCondensed.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
