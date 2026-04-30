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
          {/* Simulated VCard Download */}
          <a href="/contact.vcf" download className={`${styles.button} ${styles.primary}`}>
            [ SAVE CONTACT ]
          </a>

          {/* Placeholder for WhatsApp/Signal */}
          <a href="#" className={styles.button}>
            WHATSAPP
          </a>

          <Link href="/" className={styles.button}>
            ACCESS SYSTEM
          </Link>
        </div>

        <div className={styles.footer}>
          ID: 884-291-X // ENCRYPTED
        </div>
      </div>
    </main>
  )
}
