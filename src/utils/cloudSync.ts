import { createClient } from '@supabase/supabase-js';
import { db } from '../db/db';
import { JewelryItem } from '../types/jewelry';

interface JewelryCloudRow {
  id: string;
  item: JewelryItem;
  updated_at: string;
}

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://bisnkqvvtpkqbxucxxwx.supabase.co') as string | undefined;
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_6H3C3AEJjjxTDHEaeTnuWw_eLBikORs') as string | undefined;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function newerThan(a?: string, b?: string) {
  if (!a) return false;
  if (!b) return true;
  return new Date(a).getTime() > new Date(b).getTime();
}

export function isCloudSyncEnabled() {
  return Boolean(supabase);
}

export async function saveJewelryToCloud(item: JewelryItem) {
  if (!supabase) return;
  const { error } = await supabase.from('jewelry_items').upsert({
    id: item.id,
    item,
    updated_at: item.updatedAt || new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteJewelryFromCloud(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('jewelry_items').delete().eq('id', id);
  if (error) throw error;
}

export async function syncJewelryWithCloud() {
  if (!supabase) return;

  const [localItems, remoteResult] = await Promise.all([
    db.jewelry.toArray(),
    supabase.from('jewelry_items').select('id,item,updated_at'),
  ]);

  if (remoteResult.error) throw remoteResult.error;

  const remoteRows = (remoteResult.data || []) as JewelryCloudRow[];
  const localById = new Map(localItems.map(item => [item.id, item]));
  const remoteById = new Map(remoteRows.map(row => [row.id, row.item]));
  const localUpdates: JewelryItem[] = [];
  const cloudUpdates: JewelryItem[] = [];

  remoteRows.forEach(row => {
    const local = localById.get(row.id);
    const remote = row.item;
    if (!local || newerThan(remote.updatedAt, local.updatedAt)) {
      localUpdates.push(remote);
    }
  });

  localItems.forEach(local => {
    const remote = remoteById.get(local.id);
    if (!remote || newerThan(local.updatedAt, remote.updatedAt)) {
      cloudUpdates.push(local);
    }
  });

  if (localUpdates.length) {
    await db.jewelry.bulkPut(localUpdates);
  }

  if (cloudUpdates.length) {
    const { error } = await supabase.from('jewelry_items').upsert(
      cloudUpdates.map(item => ({
        id: item.id,
        item,
        updated_at: item.updatedAt || new Date().toISOString(),
      }))
    );
    if (error) throw error;
  }
}
