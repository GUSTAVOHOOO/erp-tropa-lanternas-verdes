import { redirect } from 'next/navigation'

/** Redireciona a rota legada para o laboratório visual oficial OANET (D28). */
export default function DesignSystemPage() {
  redirect('/laboratorio')
}
