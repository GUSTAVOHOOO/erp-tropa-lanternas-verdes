import Link from 'next/link'
import { Emblema } from '@/components/Emblema'

/** Marca "Central de Oa" do header público e da sidebar do painel. [CSS-10] */
export function Marca({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5"> {/* [ROTA-16] */}
      <Emblema className="size-7 text-primary-texto drop-shadow-anel" /> {/* [CSS-14] */}
      <span className="font-heading text-xl leading-none font-bold">Central de Oa</span> {/* [CSS-13] */}
    </Link>
  )
}
