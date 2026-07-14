// app/portal/page.tsx
import Link from 'next/link'
import styles from './portal.module.css'

export default function Portal() {
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.header}>CONNECTION SECURE</div>

        <h1 className={styles.title}>NEO·PROXY</h1>
        <p className={styles.subtitle}>Systems & Fabrication Architect</p>

        <div className={styles.actions}>
          <Link href="/modules" className={styles.button}>
            MODULES
          </Link>

          <Link href="/core" className={styles.button}>
            CORE
          </Link>

          <Link href="/shop/drop01" className={styles.button}>
            SHOP
          </Link>

          <Link href="/artifacts" className={styles.button}>
            RELICS
          </Link>

          <Link href="/manifesto" className={styles.button}>
            MANIFESTO
          </Link>

          <Link href="/npos" className={`${styles.button} ${styles.primary}`}>
            [ ACCESS NPOS ]
          </Link>

          <a href="https://signal.group/#CjQKIO8..." target="_blank" className={styles.button}>
            SIGNAL GROUP
          </a>

          <Link href="/dashboard" className={styles.button}>
            USER DASHBOARD
          </Link>
        </div>

        <div className={styles.footer}>
          ID: 884-291-X // ENCRYPTED
        </div>
      </div>
    </main>
  )
}
