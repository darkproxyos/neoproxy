'use client'

import dynamic from 'next/dynamic'

const ARCombatSystem = dynamic(() => import('@/components/ARCombatSystem'), {
  ssr: false,
  loading: () => <div style={{color: '#cc0000', fontFamily: 'monospace'}}>Loading AR Combat System...</div>
})

export default function ARPage() {
  return (
    <main className="ar-main">
      <ARCombatSystem />
    </main>
  )
}
