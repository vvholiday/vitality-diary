'use client';

import { useMemo } from 'react';
import { generateMockRecords, mockItems } from '@/lib/mock-data';

export default function AdminDashboardPage() {
  const records = useMemo(() => generateMockRecords(), []);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayCheckins = records.filter(r => r.check_date === todayStr).length;

  const uniqueUsers = 12;
  const totalCheckins = records.length;
  const activeDays = new Set(records.map(r => r.check_date)).size;

  const stats = [
    { label: '注册用户', value: uniqueUsers, icon: '👥' },
    { label: '今日打卡', value: todayCheckins, icon: '📝' },
    { label: '总打卡次数', value: totalCheckins, icon: '📊' },
    { label: '活跃天数', value: `${activeDays}天`, icon: '📅' },
  ];

  const getItemName = (itemId: string) => {
    return mockItems.find(i => i.id === itemId)?.name || '未知项目';
  };

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
            {records.slice(0, 8).map((rec, i) => (
              <div key={rec.id || i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-gray-600">{getItemName(rec.item_id)}</span>
                  <span className="text-[10px] text-gray-400">{rec.check_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  {rec.value && <span className="text-xs text-gray-500">{rec.value}</span>}
                  {rec.is_backfill && (
                    <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">补打卡</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
