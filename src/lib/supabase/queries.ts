import { createClient } from './client';

// ========== 分类 & 项目 ==========

export async function fetchActiveCategories() {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function fetchActiveItems() {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function fetchAllCategories() {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function fetchAllItems() {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('items')
    .select('*, categories(name)')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function createCategory(data: { name: string; emoji_icon?: string; sort_order?: number }) {
  const supabase = createClient() as any;
  const { data: result, error } = await supabase.from('categories').insert(data).select().single();
  if (error) throw error;
  return result;
}

export async function updateCategory(id: string, data: { name?: string; emoji_icon?: string; sort_order?: number; is_active?: boolean }) {
  const supabase = createClient() as any;
  const { error } = await supabase.from('categories').update(data).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const supabase = createClient() as any;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function createItem(data: {
  category_id: string; name: string; type?: string; unit?: string | null;
  score?: number; description?: string; sort_order?: number;
}) {
  const supabase = createClient() as any;
  const { data: result, error } = await supabase.from('items').insert(data).select().single();
  if (error) throw error;
  return result;
}

export async function updateItem(id: string, data: {
  name?: string; type?: string; unit?: string | null;
  score?: number; description?: string; sort_order?: number; is_active?: boolean;
}) {
  const supabase = createClient() as any;
  const { error } = await supabase.from('items').update(data).eq('id', id);
  if (error) throw error;
}

export async function deleteItem(id: string) {
  const supabase = createClient() as any;
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

// ========== 打卡记录 ==========

export async function fetchCheckInsByDate(userId: string, date: string) {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('check_date', date);
  if (error) throw error;
  return data;
}

export async function fetchCheckInsByDateRange(userId: string, startDate: string, endDate: string) {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .gte('check_date', startDate)
    .lte('check_date', endDate);
  if (error) throw error;
  return data;
}

type CheckInInput = {
  user_id: string;
  item_id: string;
  check_date: string;
  value: number | null;
  note?: string;
  is_backfill?: boolean;
};

export async function upsertCheckIn(input: CheckInInput) {
  const supabase = createClient() as any;
  const { error } = await supabase.from('check_ins').upsert(input, {
    onConflict: 'user_id,item_id,check_date',
  });
  if (error) throw error;
}

export async function deleteCheckIn(userId: string, itemId: string, date: string) {
  const supabase = createClient() as any;
  const { error } = await supabase
    .from('check_ins')
    .delete()
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .eq('check_date', date);
  if (error) throw error;
}

export async function fetchAllUsers() {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
