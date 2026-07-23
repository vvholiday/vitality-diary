'use client';

import { createClient } from '@/lib/supabase/client';
import { fetchCheckInsByDateRange } from '@/lib/supabase/queries';
import { useState, useMemo, useEffect } from 'react';
import { formatDate } from '@/lib/mock-data';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';

type TabType = 'radar' | 'trend';

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('radar');
  const [records, setRecords] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbItems, setDbItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const [cats, its] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('items').select('*').order('sort_order'),
      ]);
      if (cats.data) setDbCategories(cats.data);
      if (its.data) setDbItems(its.data);

      const end = new Date();
      const start = new Date(); start.setDate(start.getDate() - 60);
      const checkIns = await fetchCheckInsByDateRange(session.user.id, formatDate(start), formatDate(end));
      setRecords(checkIns);
    })();
  }, []);

  const activeCategories = useMemo(() => dbCategories.filter((c: any) => c.is_active), [dbCategories]);
  const activeItems = useMemo(() => dbItems.filter((i: any) => i.is_active), [dbItems]);


  // Radar chart data: completion rate per category
  const radarData = useMemo(() => {
    const uniqueDates = new Set(records.map(r => r.check_date));
    const dayCount = uniqueDates.size || 1;
    return activeCategories.map(cat => {
      const catItems = activeItems.filter(i => i.category_id === cat.id);
      const maxPerDay = catItems.reduce((s, i) => s + i.score, 0);
      const maxTotal = maxPerDay * dayCount;
      const actualScore = records
        .filter(r => catItems.some(i => i.id === r.item_id))
        .reduce((sum, r) => {
          const item = catItems.find(i => i.id === r.item_id);
          return sum + (item?.score ?? 0);
        }, 0);
      const rate = maxTotal > 0 ? Math.round((actualScore / maxTotal) * 100) : 0;
      return {
        category: cat.name,
        rate: Math.min(rate, 100),
        fullMark: 100,
      };
    });
  }, [activeCategories, activeItems, records]);

  // Trend chart data: daily total score
  const trendData = useMemo(() => {
    const today = new Date();
    const data: { date: string; score: number; rate: number }[] = [];
    const totalPossible = activeItems.reduce((s, i) => s + i.score, 0);

    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const dayRecords = records.filter(r => r.check_date === dateStr);
      const score = dayRecords.reduce((sum, r) => {
        const item = activeItems.find(it => it.id === r.item_id);
        return sum + (item?.score ?? 0);
      }, 0);
      const rate = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
      data.push({
        date: dateStr.slice(5),
        score,
        rate,
      });
    }
    return data;
  }, [records, activeItems]);

  // Streak: consecutive days
  const streak = useMemo(() => {
    let count = 0;
    const totalPossible = activeItems.reduce((s, i) => s + i.score, 0);
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const dayScore = records
        .filter(r => r.check_date === dateStr && !r.is_backfill)
        .reduce((sum, r) => {
          const item = activeItems.find(it => it.id === r.item_id);
          return sum + (item?.score ?? 0);
        }, 0);
      if (dayScore > 0) count++;
      else break;
    }
    return count;
  }, [records, activeItems]);

  // Average daily score
  const avgScore = useMemo(() => {
    const uniqueDates = new Set(records.map(r => r.check_date));
    if (uniqueDates.size === 0) return 0;
    const totalScore = records.reduce((sum, r) => {
      const item = activeItems.find(i => i.id === r.item_id);
      return sum + (item?.score ?? 0);
    }, 0);
    return Math.round(totalScore / uniqueDates.size);
  }, [records, activeItems]);

  return (
    <div className="space-y-5">
      {/* 统计概览卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-500">{streak}</div>
          <div className="text-[11px] text-gray-400 mt-1">连续打卡天数</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-500">{avgScore}</div>
          <div className="text-[11px] text-gray-400 mt-1">日均得分</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-500">{records.length}</div>
          <div className="text-[11px] text-gray-400 mt-1">总打卡次数</div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              activeTab === 'radar'
                ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            打卡数据
          </button>
          <button
            onClick={() => setActiveTab('trend')}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              activeTab === 'trend'
                ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            打卡趋势
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'radar' ? (
            // Radar chart
            <div>
              <div className="text-xs text-gray-400 mb-4 text-center">
                各分类打卡完成率分布（近30天）
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fontSize: 10, fill: '#d1d5db' }}
                  />
                  <Radar
                    name="完成率"
                    dataKey="rate"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            // Trend chart
            <div>
              <div className="text-xs text-gray-400 mb-4 text-center">
                近15天完成率趋势
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value: any) => [`${value}%`, '完成率']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorRate)"
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#059669', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
