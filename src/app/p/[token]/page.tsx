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
      className="bmh-viewport-min"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '28px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)',
        boxSizing: 'border-box',
        textAlign: 'center',
        fontFamily: "'Outfit', system-ui, sans-serif",
        color: '#fff',
        background: 'linear-gradient(180deg,#131f38 0%,#121428 48%,#0d0f1c 100%)',
      }}
    >
      {pass ? (
        <>
          {/* The same render X puts in the timeline — so the page a click lands
              on shows the thing that was clicked, not a text summary of it. */}
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              aspectRatio: '1200 / 630',
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,.14)',
              boxShadow: '0 30px 70px -30px rgba(0,0,0,.9)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/p/${token}/opengraph-image`}
              alt={`Hood Pass ${pass.number} · ${pass.mood.key}`}
              width={1200}
              height={630}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>

          <h1
            style={{
              margin: 0,
              maxWidth: '20ch',
              fontFamily: "'Baloo 2', cursive",
              fontWeight: 800,
              fontSize: 'clamp(26px,6.4vw,40px)',
              lineHeight: 1.1,
              letterSpacing: '-.02em',
              textWrap: 'balance',
            }}
          >
            {pass.shortWallet} is in the Hood.
          </h1>

          <Link href="/" style={ctaStyle}>
            CLAIM YOUR OWN SPOT
          </Link>
        </>
      ) : (
        <>
          <h1 style={{ margin: 0, fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: 'clamp(26px,6vw,42px)' }}>
            That pass link is not readable.
          </h1>
          <Link href="/" style={ctaStyle}>
            CLAIM YOUR OWN SPOT
          </Link>
        </>
      )}

      <p
        style={{
          margin: 0,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9.5,
          letterSpacing: '.12em',
          lineHeight: 1.8,
          color: 'rgba(255,255,255,.32)',
          maxWidth: '44ch',
        }}
      >
        THE PASS RECORDS INTEREST ONLY — IT IS NOT AN ALLOWLIST SPOT, A TOKEN, OR A
        RIGHT TO MINT.
      </p>
    </main>
  );
}

const ctaStyle = {
  background: '#c6f511',
  color: '#0d0f12',
  fontFamily: "'Baloo 2', cursive",
  fontWeight: 800,
  fontSize: 17,
  padding: '15px 30px',
  borderRadius: 999,
  textDecoration: 'none',
  boxShadow: '0 14px 40px -14px rgba(198,245,17,.8)',
} as const;
