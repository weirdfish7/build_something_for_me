import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)

    const ping = async () => {
      try {
        const res = await fetch('/api/health', { signal: controller.signal })
        const text = await res.text().catch(() => '')
        console.log('[health] /api/health', res.status, text || '')
        if (!res.ok) throw new Error('non-2xx')
      } catch (_err) {
        try {
          const res2 = await fetch('/health', { signal: controller.signal })
          const text2 = await res2.text().catch(() => '')
          console.log('[health] /health', res2.status, text2 || '')
        } catch (err) {
          if ((err as any)?.name === 'AbortError') {
            console.warn('[health] request aborted')
          } else {
            console.warn('[health] failed', err)
          }
        }
      } finally {
        clearTimeout(timeout)
      }
    }

    ping()

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Next App</title>
      </Head>
      <Component {...pageProps} />
      <style jsx global>{`
        html, body, #__next { height: 100%; }
        html, body {
          padding: 0;
          margin: 0;
          background: #fafafa;
          color: #111;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }
        * { box-sizing: border-box; }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>
    </>
  )
}

export default MyApp
