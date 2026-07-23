'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState([
    { label: '注册用户', value: '...', icon: '👥' },
    { label: '今日打卡', value: '...', icon: '📝' },
    { label: '总打卡次数', value: '...', icon: '📊' },
    { label: '活跃天数', value: '...', icon: '📅' },
  ]);
  const [recent, setRecent] = useState<any[]>([]);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const supabase = createClient() as any;
      const today = new Date().toISOString().slice(0, 10);

      const [itemsRes, usersRes, todayRes, totalRes, daysRes, recentRes] = await Promise.all([
        supabase.from('items').select('id, name'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('check_ins').select('*', { count: 'exact', head: true }).eq('check_date', today),
        supabase.from('check_ins').select('*', { count: 'exact', head: true }),
        supabase.from('check_ins').select('check_date'),
        supabase.from('check_ins').select('*').order('created_at', { ascending: false }).limit(8),
      ]);

      const map: Record<string, string> = {};
      (itemsRes.data || []).forEach((i: any) => { map[i.id] = i.name; });
      setItemNames(map);

      const activeDays = new Set((daysRes.data || []).map((r: any) => r.check_date)).size;

      setStats([
        { label: '注册用户', value: String(usersRes.count ?? 0), icon: '👥' },
        { label: '今日打卡', value: String(todayRes.count ?? 0), icon: '📝' },
        { label: '总打卡次数', value: String(totalRes.count ?? 0), icon: '📊' },
        { label: '活跃天数', value: `${activeDays}天`, icon: '📅' },
      ]);

      setRecent(recentRes.data || []);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">数据概览</h1>
        <p className="text-xs text-gray-400 mt-1">查看元气日记的整体运行数据</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">最近打卡动态</h2>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {recent.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">还没有打卡记录</div>
            ) : (
              recent.map((rec: any, i: number) => (
                <div key={rec.id || i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-gray-600">{itemNames[rec.item_id] || rec.item_id?.slice(0, 8)}</span>
                    <span className="text-[10px] text-gray-400">{rec.check_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.value && <span className="text-xs text-gray-500">{rec.value}</span>}
                    {rec.is_backfill && (
                      <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">补打卡</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
