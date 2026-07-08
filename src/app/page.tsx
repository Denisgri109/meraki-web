import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RootPortal } from '@/components/RootPortal';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isOwner = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    isOwner = profile?.role === 'owner';

    if (!isOwner) {
      redirect('/beauty/dashboard');
    }
  }

  return <RootPortal isOwner={isOwner} />;
}
