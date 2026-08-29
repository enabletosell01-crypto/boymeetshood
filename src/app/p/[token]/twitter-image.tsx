import { renderPassCard, alt, size, contentType } from './pass-card';

export const runtime = 'nodejs';
export { alt, size, contentType };

export default async function Image(props: { params: Promise<{ token: string }> }) {
  return renderPassCard(props);
}
