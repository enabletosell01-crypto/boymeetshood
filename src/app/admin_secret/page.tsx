import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isValidSession } from '@/lib/admin-auth';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const signedIn = await isValidSession(token).catch(() => false);
  return signedIn ? <AdminPanel /> : <AdminLogin />;
}
