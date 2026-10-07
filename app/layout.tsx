import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Central de Oa | Tropa dos Lanternas Verdes',
  description: 'Registro e acompanhamento de ocorrências intergalácticas da Tropa dos Lanternas Verdes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}> {/* [ROTA-05] */}
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
