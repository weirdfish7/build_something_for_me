import { useEffect, useState } from 'react';
import Head from 'next/head';

type HealthState = {
  ok: boolean;
  status?: number;
  message?: string;
  latencyMs?: number;
};

type HomeProps = {
  serverTime: string;
  nodeEnv: string;
  nodeVersion: string;
  platform: string;
};

export default function Home(props: HomeProps) {
  const [health, setHealth] = useState<HealthState | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientTime, setClientTime] = useState<string>('');

  useEffect(() => {
    setClientTime(new Date().toISOString());
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkHealth() {
    setLoading(true);
    const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const res = await fetch('/api/health', { headers: { 'Accept': 'application/json' } });
      const latency = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
      let message: string | undefined = undefined;
      try {
        const data = await res.json();
        message = typeof data?.message === 'string' ? data.message : JSON.stringify(data);
      } catch {
        message = res.ok ? 'healthy' : 'unhealthy';
      }
      setHealth({ ok: res.ok, status: res.status, message, latencyMs: Math.round(latency) });
    } catch (err: any) {
      const latency = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
      setHealth({ ok: false, status: undefined, message: err?.message || 'network error', latencyMs: Math.round(latency) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Home</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={styles.main}>
        <h1 style={styles.title}>Welcome</h1>
        <p style={styles.subtitle}>Minimal Next.js page with basic info and a health check fetch.</p>

        <section style={styles.section}>
          <h2 style={styles.h2}>Basic Info</h2>
          <ul style={styles.list}>
            <li><strong>Server time (ISO):</strong> {props.serverTime}</li>
            <li><strong>Client time (ISO):</strong> {clientTime || 'loading...'}</li>
            <li><strong>NODE_ENV:</strong> {props.nodeEnv}</li>
            <li><strong>Node.js:</strong> {props.nodeVersion}</li>
            <li><strong>Platform:</strong> {props.platform}</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Health Check</h2>
          <p style={{ marginBottom: 8 }}>Calls GET /api/health on the client.</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={checkHealth} disabled={loading} style={styles.button}>
              {loading ? 'Checking…' : 'Check health'}
            </button>
            {health && (
              <span aria-live="polite">
                Status: {health.ok ? 'OK' : 'FAIL'}
                {typeof health.status === 'number' ? ` (${health.status})` : ''}
                {typeof health.latencyMs === 'number' ? ` • ${health.latencyMs} ms` : ''}
              </span>
            )}
          </div>
          <pre style={styles.pre}>
            {health ? JSON.stringify(health, null, 2) : 'No result yet.'}
          </pre>
          <p style={{ color: '#666', fontSize: 12 }}>
            Note: If /api/health is not implemented, you may see 404. This page still compiles and runs.
          </p>
        </section>

        <footer style={styles.footer}>
          <a href="/api/health" style={{ color: '#0070f3' }}>Open /api/health</a>
        </footer>
      </main>
    </>
  );
}

export async function getServerSideProps() {
  const serverTime = new Date().toISOString();
  const nodeEnv = process.env.NODE_ENV || 'development';
  const nodeVersion = process.version || 'unknown';
  const platform = process.platform || 'unknown';

  return { props: { serverTime, nodeEnv, nodeVersion, platform } };
}

const styles: { [k: string]: React.CSSProperties } = {
  main: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '32px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
    lineHeight: 1.6,
  },
  title: { fontSize: 28, margin: 0 },
  subtitle: { margin: '8px 0 24px', color: '#555' },
  section: { marginBottom: 32 },
  h2: { fontSize: 18, margin: '0 0 8px' },
  list: { margin: 0, paddingLeft: 18 },
  button: { padding: '8px 12px', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', background: '#fff' },
  pre: { background: '#f6f8fa', padding: 12, borderRadius: 6, overflowX: 'auto' },
  footer: { marginTop: 24, fontSize: 14 },
};
