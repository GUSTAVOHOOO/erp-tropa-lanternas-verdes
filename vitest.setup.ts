import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Desmonta o que cada teste renderizou, para um teste não enxergar a tela do outro.
afterEach(() => cleanup())
