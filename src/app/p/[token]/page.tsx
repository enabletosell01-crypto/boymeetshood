import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { decodePassToken, passFromHash } from '@/lib/pass';

export const runtime = 'nodejs';

type Props = { params: Promise<{ token: string }> };

/**
 * The landing page behind a shared pass. Its real job is the metadata: X reads
 * these tags off the URL in the tweet and renders the card image. Anyone who
 * actually clicks through gets the pass plus a way to join.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const decoded = decodePassToken(token);

  // og:image has to be absolute, and it has to be a URL the crawler can
  // actually reach. Taking the host off the request means the card works on
  // the vercel.app URL, on a preview deployment and on the custom domain,
  // without an env var having to be correct first.
  const head = await headers();
  const host = head.get('x-forwarded-host') ?? head.get('host') ?? 'localhost:3000';
  const proto = head.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const metadataBase = new URL(`${proto}://${host}`);

  if (!decoded) return { metadataBase, title: 'Hood Pass', robots: { index: false, follow: true } };

  const pass = passFromHash(decoded.hash, decoded.shortWallet);
  const title = `Hood Pass ${pass.number} · ${pass.mood.key}`;

  return {
    metadataBase,
    title,
    description: `${pass.shortWallet} claimed a spot in the Hood. 4,444 Boys. One Hood. Real Financial Utility.`,
    openGraph: { title, type: 'article' },
    twitter: { card: 'summary_large_image', title },
    // One page per wallet is nothing a search engine needs in its index.
    robots: { index: false, follow: true },
  };
}

export default async function PassPage({ params }: Props) {
  const { token } = await params;
  const decoded = decodePassToken(token);
  const pass = decoded ? passFromHash(decoded.hash, decoded.shortWallet) : null;

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 26,
        padding: '48px 24px',
        textAlign: 'center',
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: '#fff',
        background: 'linear-gradient(180deg,#131f38 0%,#121428 48%,#0d0f1c 100%)',
      }}
    >
      {pass ? (
        <>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: '.28em', color: '#c6f511' }}>
            HOOD PASS {pass.number} · {pass.mood.key}
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Baloo 2', cursive",
              fontWeight: 800,
              fontSize: 'clamp(30px,7vw,58px)',
              letterSpacing: '-.02em',
            }}
          >
            {pass.shortWallet} is in the Hood.
          </h1>
          <p style={{ margin: 0, maxWidth: '32ch', fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,.7)' }}>
            {pass.mood.line}
          </p>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: '.2em', color: 'rgba(255,255,255,.4)' }}>
            {pass.code} · {pass.issued}
          </div>
        </>
      ) : (
        <h1 style={{ margin: 0, fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: 'clamp(28px,6vw,48px)' }}>
          That pass link is not readable.
        </h1>
      )}

      <Link
        href="/"
        style={{
          marginTop: 8,
          background: '#c6f511',
          color: '#0d0f12',
          fontFamily: "'Baloo 2', cursive",
          fontWeight: 800,
          fontSize: 18,
          padding: '16px 30px',
          borderRadius: 999,
          textDecoration: 'none',
        }}
      >
        CLAIM YOUR OWN SPOT
      </Link>

      <p style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '.14em', color: 'rgba(255,255,255,.3)', maxWidth: '46ch', lineHeight: 1.8 }}>
        THE PASS RECORDS INTEREST ONLY — IT IS NOT AN ALLOWLIST SPOT, A TOKEN, OR A RIGHT TO MINT.
      </p>
    </main>
  );
}
