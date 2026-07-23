export interface Category {
  id: string;
  name: string;
  emoji_icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface CheckInItem {
  id: string;
  category_id: string;
  name: string;
  unit: string | null;
  score: number;
  type: 'toggle' | 'numeric';
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface CheckInRecord {
  id: string;
  item_id: string;
  check_date: string;
  value: number | null;
  done: boolean;
  is_backfill: boolean;
  note: string;
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  role: 'admin' | 'user';
}

export const mockCategories: Category[] = [
  { id: 'cat-1', name: '运动', emoji_icon: '🏃', sort_order: 1, is_active: true },
  { id: 'cat-2', name: '饮食', emoji_icon: '🥗', sort_order: 2, is_active: true },
  { id: 'cat-3', name: '睡眠', emoji_icon: '💤', sort_order: 3, is_active: true },
  { id: 'cat-4', name: '护肤', emoji_icon: '🧴', sort_order: 4, is_active: true },
  { id: 'cat-5', name: '补剂', emoji_icon: '💊', sort_order: 5, is_active: true },
];

export const mockItems: CheckInItem[] = [
  { id: 'item-1', category_id: 'cat-1', name: '有氧运动', unit: '分钟', score: 10, type: 'numeric', description: '建议每周3-5次，每次30分钟以上', sort_order: 1, is_active: true },
  { id: 'item-2', category_id: 'cat-1', name: '抗阻运动', unit: '分钟', score: 15, type: 'numeric', description: '力量训练，增肌有助于提高基础代谢', sort_order: 2, is_active: true },
  { id: 'item-3', category_id: 'cat-1', name: '拉伸放松', unit: null, score: 5, type: 'toggle', description: '运动后拉伸10分钟', sort_order: 3, is_active: true },
  { id: 'item-4', category_id: 'cat-2', name: '喝够2升水', unit: null, score: 8, type: 'toggle', description: '每天饮水量达到2L', sort_order: 1, is_active: true },
  { id: 'item-5', category_id: 'cat-2', name: '少糖饮食', unit: null, score: 10, type: 'toggle', description: '减少添加糖摄入', sort_order: 2, is_active: true },
  { id: 'item-6', category_id: 'cat-2', name: '蔬果摄入', unit: '份', score: 8, type: 'numeric', description: '每天5份不同颜色的蔬果', sort_order: 3, is_active: true },
  { id: 'item-7', category_id: 'cat-3', name: '11点前入睡', unit: null, score: 20, type: 'toggle', description: '黄金美容觉时间', sort_order: 1, is_active: true },
  { id: 'item-8', category_id: 'cat-3', name: '睡眠时长', unit: '小时', score: 15, type: 'numeric', description: '建议7-9小时', sort_order: 2, is_active: true },
  { id: 'item-9', category_id: 'cat-4', name: '早晚护肤', unit: null, score: 6, type: 'toggle', description: '清洁+保湿+防晒', sort_order: 1, is_active: true },
  { id: 'item-10', category_id: 'cat-4', name: '面部防晒', unit: null, score: 10, type: 'toggle', description: '防晒是抗老的第一步', sort_order: 2, is_active: true },
  { id: 'item-11', category_id: 'cat-5', name: '维生素D', unit: null, score: 5, type: 'toggle', description: '建议每日补充', sort_order: 1, is_active: true },
  { id: 'item-12', category_id: 'cat-5', name: 'Omega-3', unit: null, score: 5, type: 'toggle', description: '鱼油或藻油', sort_order: 2, is_active: true },
];

export const adminUser: User = {
  id: 'admin-1',
  email: 'admin@yuanqi.com',
  nickname: '管理员',
  role: 'admin',
};

export const normalUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  nickname: '小明',
  role: 'user',
};

export function getItemsByCategory(categoryId: string): CheckInItem[] {
  return mockItems.filter(item => item.category_id === categoryId && item.is_active);
}

export function getTodayScore(records: CheckInRecord[]): number {
  return records
    .filter(r => r.done)
    .reduce((sum, r) => {
      const item = mockItems.find(i => i.id === r.item_id);
      return sum + (item?.score ?? 0);
    }, 0);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateCN(date: string): string {
  const [y, m, d] = date.split('-');
  return `${y}年${m}月${d}日`;
}

export function getWeekDay(date: Date): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `周${days[date.getDay()]}`;
}

// Generate mock check-in records for the past few days
export function generateMockRecords(): CheckInRecord[] {
  const records: CheckInRecord[] = [];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = formatDate(date);

    // Skip some days randomly to show incomplete days
    if (dayOffset > 0 && Math.random() > 0.7) continue;

    mockItems.forEach(item => {
      const done = Math.random() > 0.4;
      if (!done) return;
      records.push({
        id: `rec-${dateStr}-${item.id}`,
        item_id: item.id,
        check_date: dateStr,
        value: item.type === 'numeric' ? Math.floor(Math.random() * 60) + 10 : null,
        done: true,
        is_backfill: dayOffset > 0 && Math.random() > 0.8,
        note: '',
      });
    });
  }

  return records;
}
