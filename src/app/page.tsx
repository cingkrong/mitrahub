import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const sessionUser = verifySessionToken(token);

  if (sessionUser?.role === 'MITRA') {
    redirect('/dashboard/mitra');
  }

  redirect('/dashboard');
}
