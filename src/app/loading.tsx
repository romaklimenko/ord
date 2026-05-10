import styles from "./loading.module.css";

export default function Indlæser() {
  return (
    <main className={styles.side} aria-busy="true">
      <header className={styles.toplinje}>
        <span className={styles.logo}>Ord</span>
      </header>
      <div className={styles.midte} role="status" aria-live="polite">
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.tekst}>Henter dit næste kort…</p>
      </div>
    </main>
  );
}
