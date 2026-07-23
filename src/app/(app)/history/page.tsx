'use client';

import { useState, useMemo, useEffect } from 'react';
import { formatDate, formatDateCN } from '@/lib/mock-data';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchCheckInsByDateRange } from '@/lib/supabase/queries';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

export default function HistoryPage() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
      const end = formatDate(new Date());
      const startDate = new Date(); startDate.setDate(startDate.getDate() - 60);
      const recs = await fetchCheckInsByDateRange(session.user.id, formatDate(startDate), end);
      setRecords(recs);
    })();
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Records from DB
const recordsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    const activeItems = dbItems.filter((i: any) => i.is_active);
    records.forEach(r => {
      if (!map[r.check_date]) map[r.check_date] = 0;
      const item = activeItems.find(i => i.id === r.item_id);
      if (item) map[r.check_date] += item.score;
    });
    return map;
  }, [records, dbItems]);

  const totalPossibleScore = useMemo(() =>
    dbItems.filter((i: any) => i.is_active).reduce((s: number, i: any) => s + i.score, 0),
  []);

  const getDayScore = (dateStr: string) => recordsByDate[dateStr] || 0;
  const getDayPercent = (dateStr: string) =>
    totalPossibleScore > 0 ? Math.round((getDayScore(dateStr) / totalPossibleScore) * 100) : 0;

  const getDayColor = (dateStr: string) => {
    const pct = getDayPercent(dateStr);
    if (pct >= 80) return 'bg-emerald-500 text-white';
    if (pct >= 50) return 'bg-emerald-300 text-white';
    if (pct > 0) return 'bg-emerald-100 text-emerald-700';
    return '';
  };

  // Radar chart data: completion rate per category for selected date
  const radarData = useMemo(() => {
    const activeCats = dbCategories.length > 0 ? dbCategories.filter((c: any) => c.is_active) : [];
    const activeItms = dbItems.length > 0 ? dbItems.filter((i: any) => i.is_active) : [];
    const targetDate = selectedDate || formatDate(today);
    const dateRecs = records.filter(r => r.check_date === targetDate);
    return activeCats.map(cat => {
      const catItems = activeItms.filter(i => i.category_id === cat.id);
      const maxScore = catItems.reduce((s, i) => s + i.score, 0);
      const actualScore = dateRecs
        .filter(r => catItems.some(i => i.id === r.item_id))
        .reduce((sum, r) => {
          const item = catItems.find(i => i.id === r.item_id);
          return sum + (item?.score ?? 0);
        }, 0);
      return {
        category: cat.name,
        rate: maxScore > 0 ? Math.round((actualScore / maxScore) * 100) : 0,
      };
    });
  }, [selectedDate, records, today]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectedRecords = useMemo(() => {
    if (!selectedDate) return [];
    return records.filter(r => r.check_date === selectedDate);
  }, [selectedDate, records]);

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  return (
    <div className="space-y-5">
      {/* 日历卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Month header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            {year}年{month + 1}月
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-4 py-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
            <div key={i} className="text-center text-[11px] text-gray-400 font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-4 pb-4 gap-1">
          {calendarCells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateObj = new Date(year, month, day);
            const dateStr = formatDate(dateObj);
            const isToday = dateStr === formatDate(today);
            const isSelected = dateStr === selectedDate;
            const dayScore = getDayScore(dateStr);
            const colorClass = getDayColor(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex flex-col items-center py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'ring-2 ring-emerald-400 bg-emerald-50'
                    : 'hover:bg-gray-50'
                } ${isToday ? 'bg-amber-50 ring-1 ring-amber-300' : ''}`}
              >
                <span className={`text-xs font-medium ${isToday ? 'text-amber-600' : 'text-gray-700'}`}>
                  {day}
                </span>
                {dayScore > 0 && (
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${colorClass}`}>
                    {getDayPercent(dateStr) >= 80 ? '✓' : getDayPercent(dateStr) >= 50 ? '−' : '·'}
                  </div>
                )}
                {dayScore === 0 && (
                  <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-gray-300">·</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 雷达图：每日分类完成率 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {selectedDate ? formatDateCN(selectedDate) : formatDateCN(formatDate(today))} 分类完成率
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
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

      {/* Selected date detail */}
      {selectedDate && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {formatDateCN(selectedDate)} 打卡详情
            </h3>
            <span className="text-xs text-gray-400">
              得分：{getDayScore(selectedDate)} / {totalPossibleScore}
            </span>
          </div>

          {selectedRecords.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              <p className="mb-1">📭 这天还没有打卡记录</p>
              <Link href={`/dashboard`} className="text-emerald-500 hover:text-emerald-600 font-medium">
                去打卡 &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedRecords.map((rec) => {
                const item = dbItems.find((i: any) => i.id === rec.item_id);
                if (!item) return null;
                return (
                  <div key={rec.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{item.name}</span>
                      {rec.is_backfill && (
                        <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">补打卡</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.type === 'numeric' && (
                        <span className="text-xs text-gray-500">{rec.value}{item.unit}</span>
                      )}
                      <span className="text-xs text-emerald-600 font-medium">+{item.score}分</span>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 text-right text-xs text-gray-500 font-medium">
                合计得分：{getDayScore(selectedDate)} 分
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
