import { ReactNode } from 'react';

type LayoutProps = {
  title?: string;
  children: ReactNode;
};

export default function Layout({ title = 'My App', children }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#111' }}>
      <header
        style={{
          borderBottom: '1px solid #eaeaea',
          padding: '0.75rem 1rem',
          position: 'sticky',
          top: 0,
          background: '#fafafa',
          zIndex: 10,
        }}
        aria-label="Site header"
      >
        <strong>{title}</strong>
      </header>
      <main style={{ padding: '1rem', maxWidth: 960, margin: '0 auto' }}>{children}</main>
    </div>
  );
}
