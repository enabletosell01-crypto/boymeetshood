import { readFileSync } from 'node:fs';
import { ImageResponse } from 'next/og';
import { ART, decodePassToken, passFromHash } from '@/lib/pass';

export const alt = 'BoyMeetsHood Hood Pass';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * X will not let a page attach an image to a tweet — the only way a picture
 * appears is if the tweet carries a URL whose page advertises one. This is that
 * image: the visitor's own pass, rendered server-side from the share token.
 *
 * Every asset is referenced through `new URL(…, import.meta.url)` so the
 * bundler can see it and pack exactly these files. Reading them through
 * `process.cwd()` instead makes the tracer give up and drag the whole project —
 * 44MB of collection art — into the function.
 */
const FONTS = {
  baloo: new URL('../../../assets/fonts/baloo2-800.ttf', import.meta.url),
  mono: new URL('../../../assets/fonts/spacemono-700.ttf', import.meta.url),
  body: new URL('../../../assets/fonts/outfit-500.ttf', import.meta.url),
};

const LOGO = new URL('../../../../public/assets/logo.png', import.meta.url);

/** One static entry per trait, for the same reason the fonts are static. */
const ART_FILES: Record<(typeof ART)[number], URL> = {
  ice: new URL('../../../../public/assets/nft/ice-sm.png', import.meta.url),
  flame: new URL('../../../../public/assets/nft/flame-sm.png', import.meta.url),
  cosmic: new URL('../../../../public/assets/nft/cosmic-sm.png', import.meta.url),
  gold: new URL('../../../../public/assets/nft/gold-sm.png', import.meta.url),
  king: new URL('../../../../public/assets/nft/king-sm.png', import.meta.url),
  bear: new URL('../../../../public/assets/nft/bear-sm.png', import.meta.url),
  devil: new URL('../../../../public/assets/nft/devil-sm.png', import.meta.url),
  jungle: new URL('../../../../public/assets/nft/jungle-sm.png', import.meta.url),
  skull: new URL('../../../../public/assets/nft/skull-sm.png', import.meta.url),
  astro: new URL('../../../../public/assets/nft/astro-sm.png', import.meta.url),
  alien: new URL('../../../../public/assets/nft/alien-sm.png', import.meta.url),
  pirate: new URL('../../../../public/assets/nft/pirate-sm.png', import.meta.url),
  snow: new URL('../../../../public/assets/nft/snow-sm.png', import.meta.url),
  truck: new URL('../../../../public/assets/nft/truck-sm.png', import.meta.url),
  scooter: new URL('../../../../public/assets/nft/scooter-sm.png', import.meta.url),
  hood: new URL('../../../../public/assets/nft/hood-sm.png', import.meta.url),
  umbrella: new URL('../../../../public/assets/nft/umbrella-sm.png', import.meta.url),
  vamp: new URL('../../../../public/assets/nft/vamp-sm.png', import.meta.url),
  kid: new URL('../../../../public/assets/nft/kid-sm.png', import.meta.url),
  dunk: new URL('../../../../public/assets/nft/dunk-sm.png', import.meta.url),
  soda: new URL('../../../../public/assets/nft/soda-sm.png', import.meta.url),
  beam: new URL('../../../../public/assets/nft/beam-sm.png', import.meta.url),
  doodle: new URL('../../../../public/assets/nft/doodle-sm.png', import.meta.url),
  wall: new URL('../../../../public/assets/nft/wall-sm.png', import.meta.url),
  winter: new URL('../../../../public/assets/nft/winter-sm.png', import.meta.url),
};

// `fetch` cannot read a file: URL in Node, but fs can — and reading through a
// statically-built URL keeps the bundler able to see which files are needed.
const bytes = (url: URL) => readFileSync(url);
const dataUri = (url: URL) => `data:image/png;base64,${bytes(url).toString('base64')}`;

/** Loaded once per warm instance rather than on every card. */
let fontCache: [Buffer, Buffer, Buffer] | null = null;
const loadFonts = () => {
  fontCache ??= [bytes(FONTS.baloo), bytes(FONTS.mono), bytes(FONTS.body)];
  return fontCache;
};

export async function renderPassCard({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const decoded = decodePassToken(token);

  // An unreadable token still has to produce an image — a broken card in a
  // timeline is worse than a generic one.
  const pass = decoded
    ? passFromHash(decoded.hash, decoded.shortWallet)
    : passFromHash(0, 'BOYMEETSHOOD');

  const [baloo, mono, body] = loadFonts();
  const logo = dataUri(LOGO);
  const art = dataUri(ART_FILES[pass.art]);

  const [skyTop, skyBottom] = pass.mood.sky;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          backgroundColor: skyBottom,
          backgroundImage: `linear-gradient(140deg, ${skyTop} 0%, ${skyBottom} 55%, #0b0d11 100%)`,
          fontFamily: 'Outfit',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} width={72} height={72} style={{ borderRadius: 22 }} />
          <div style={{ display: 'flex', fontFamily: 'Baloo', fontSize: 40, marginLeft: 20 }}>
            <span>Boy</span>
            <span style={{ color: '#c6f511' }}>Meets</span>
            <span>Hood</span>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              fontFamily: 'Mono',
              fontSize: 20,
              letterSpacing: 4,
              color: 'rgba(255,255,255,.55)',
            }}
          >
            HOOD PASS
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={art}
            width={248}
            height={248}
            style={{ borderRadius: 40, border: '2px solid rgba(255,255,255,.22)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 44 }}>
            <div style={{ fontFamily: 'Baloo', fontSize: 88, lineHeight: 1 }}>{pass.shortWallet}</div>
            <div
              style={{
                fontFamily: 'Mono',
                fontSize: 26,
                letterSpacing: 5,
                marginTop: 18,
                color: pass.mood.color,
              }}
            >
              {`MOOD · ${pass.mood.key}`}
            </div>
            <div style={{ fontSize: 30, marginTop: 14, color: 'rgba(255,255,255,.82)' }}>
              {pass.mood.line}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            borderTop: '2px dashed rgba(255,255,255,.22)',
            paddingTop: 26,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Mono', letterSpacing: 3 }}>
            <div style={{ fontSize: 26, color: 'rgba(255,255,255,.9)' }}>
              {`PASS ${pass.number} · ${pass.issued}`}
            </div>
            <div style={{ fontSize: 22, marginTop: 10, color: 'rgba(255,255,255,.5)' }}>{pass.code}</div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              fontFamily: 'Mono',
              fontSize: 20,
              letterSpacing: 3,
              color: '#c6f511',
            }}
          >
            4,444 BOYS · ONE HOOD
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Baloo', data: baloo, style: 'normal', weight: 800 },
        { name: 'Mono', data: mono, style: 'normal', weight: 700 },
        { name: 'Outfit', data: body, style: 'normal', weight: 500 },
      ],
    }
  );
}
