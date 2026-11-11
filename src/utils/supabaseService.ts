/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

export async function supabaseRequest<T = any>(
  table: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  data?: any,
  queryParams: string = ''
): Promise<T | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials are not configured in environment variables.');
    return null;
  }

  const cleanUrl = SUPABASE_URL.replace(/\/+$/, '');
  const url = `${cleanUrl}/rest/v1/${table}${queryParams ? '?' + queryParams : ''}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation',
    },
    body: data ? JSON.stringify(data) : undefined,
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Supabase API error (${table}):`, errText);
      throw new Error(errText || 'فشل الاتصال بقاعدة البيانات');
    }

    if (method === 'GET') {
      return (await response.json()) as T;
    }
    
    // For POST/PATCH/DELETE with return=representation
    try {
      const result = await response.json();
      return result as T;
    } catch {
      return null;
    }
  } catch (err: any) {
    console.warn(`Supabase fetch failed for ${table}:`, err?.message || err);
    throw err;
  }
}
