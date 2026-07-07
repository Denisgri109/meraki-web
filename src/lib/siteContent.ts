import { createClient } from '@/lib/supabase/server';

export interface SiteContentEntry {
  key: string;
  value: string;
  description: string | null;
}

export async function getSiteContent(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('global_settings')
    .select('key, value');

  if (error) {
    console.error('[siteContent] Error fetching site content:', error);
    return {};
  }

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return map;
}

export async function getSiteContentWithDescriptions(): Promise<SiteContentEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('global_settings')
    .select('key, value, description')
    .order('key');

  if (error) {
    console.error('[siteContent] Error fetching site content:', error);
    return [];
  }

  return data ?? [];
}
