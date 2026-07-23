'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { fetchActiveCategories, fetchActiveItems, fetchCheckInsByDate, upsertCheckIn, deleteCheckIn } from '@/lib/supabase/queries';
import Link from 'next/link';
import {
  formatDate, formatDateCN, getWeekDay,
} from '@/lib/mock-data';
import { ChevronLeft, ChevronRight, Check, RotateCcw } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(today);
  const dateStr = formatDate(currentDate);
  const isToday = dateStr === formatDate(today);
  const supabase = createClient();

  const [records, setRecords] = useState<Record<string, { done: boolean; value: number | null }>>({});
  const [activeCategories, setActiveCategories] = useState<any[]>([]);
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [loadedRecords, setLoadedRecords] = useState<Record<string, any>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load categories & items on mount
  useEffect(() => {
    async function load() {
      try {
        const [cats, its] = await Promise.all([fetchActiveCategories(), fetchActiveItems()]);
        setActiveCategories(cats);
        setActiveItems(its);
      } catch (e) {
        console.error('加载数据失败', e);
      }
    }
    load();
  }, []);

  // Load check-ins when date or user changes
  useEffect(() => {
    const currentUserId = user?.id;
    if (!currentUserId) return;
    async function loadCheckIns() {
      setPageLoading(true);
      try {
        const checkIns = await fetchCheckInsByDate(currentUserId, dateStr);
        const loaded: Record<string, any> = {};
        const ui: Record<string, { done: boolean; value: number | null }> = {};
        checkIns.forEach((ci: any) => {
          loaded[ci.item_id] = ci;
          ui[ci.item_id] = { done: true, value: ci.value };
        });
        setRecords(ui);
        setLoadedRecords(loaded);
      } catch (e) {
        console.error('加载打卡记录失败', e);
      }
      setPageLoading(false);
    }
    loadCheckIns();
  }, [dateStr, user]);

  const getItemRecord = useCallback((itemId: string) => {
    return records[itemId] || { done: false, value: null };
  }, [records]);

  const toggleItem = useCallback((itemId: string) => {
    setRecords(prev => {
      const current = prev[itemId] || { done: false, value: null };
      return { ...prev, [itemId]: { ...current, done: !current.done } };
    });
  }, []);

  const setItemValue = useCallback((itemId: string, value: number | null) => {
    setRecords(prev => {
      const current = prev[itemId] || { done: false, value: null };
      return { ...prev, [itemId]: { ...current, value, done: true } };
    });
  }, []);

  // Calculate progress
  const totalItems = activeItems.length;
  const doneCount = activeItems.filter(i => getItemRecord(i.id).done).length;
  const progress = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

  // Calculate score
  const todayScore = useMemo(() => {
    return activeItems
      .filter(i => getItemRecord(i.id).done)
      .reduce((sum, i) => sum + i.score, 0);
  }, [activeItems, getItemRecord]);

  // Total possible score
  const totalPossibleScore = useMemo(() =>
    activeItems.reduce((sum, i) => sum + i.score, 0),
  [activeItems]);

  const canGoNext = useMemo(() => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return formatDate(nextDate) <= formatDate(today);
  }, [currentDate, today]);

  const goPrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
    setRecords({});
  };

  const goNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    if (formatDate(nextDate) > formatDate(today)) return;
    setCurrentDate(nextDate);
    setRecords({});
  };

  const goToday = () => {
    setCurrentDate(today);
    setRecords({});
  };

  const handleSave = async () => {
    const u = user?.id;
    if (!u || saving) return;
    setSaving(true);
    try {
      const promises: Promise<any>[] = [];
      for (const [itemId, rec] of Object.entries(records)) {
        if (rec.done) {
          promises.push(upsertCheckIn({
            user_id: u,
            item_id: itemId,
            check_date: dateStr,
            value: rec.value,
            is_backfill: !isToday && canBackfill(),
          }));
        } else if (loadedRecords[itemId]) {
          // Was previously saved but now unchecked → delete
          promises.push(deleteCheckIn(u, itemId, dateStr));
        }
      }
      await Promise.all(promises);
    } catch (e) {
      console.error('保存失败', e);
    }
    setSaving(false);
  };

  const canBackfill = () => {
    const diff = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 && diff <= 7;
  };

  return (
    <div className="space-y-5">
      {/* 日期导航 + 得分 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={goPrevDay} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">
                {formatDateCN(dateStr)}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {getWeekDay(currentDate)}
                {isToday && <span className="ml-1.5 text-emerald-500 font-medium">· 今天</span>}
                {!isToday && canBackfill() && <span className="ml-1.5 text-amber-500 font-medium">· 补打卡</span>}
                {!isToday && !canBackfill() && <span className="ml-1.5 text-gray-300 font-medium">· 查看</span>}
              </div>
            </div>
            <button onClick={goNextDay} disabled={!canGoNext} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {!isToday && (
              <button
                onClick={goToday}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <RotateCcw size={14} />
                回到今天
              </button>
            )}
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-500">{todayScore}</div>
              <div className="text-[10px] text-gray-400">今日得分 / {totalPossibleScore}</div>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">完成进度</span>
            <span className="text-gray-700 font-medium">{doneCount}/{totalItems} 项</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 按分类展示打卡项目 */}
      <div className="space-y-4">
        {activeCategories.map((category) => {
          const catItems = activeItems.filter(i => i.category_id === category.id);
          if (catItems.length === 0) return null;
          return (
            <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Category header */}
              <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
                <span className="text-lg">{category.emoji_icon}</span>
                <span className="font-semibold text-sm text-gray-800">{category.name}</span>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-50">
                {catItems.map((item) => {
                  const rec = getItemRecord(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`px-5 py-3 flex items-center justify-between transition-colors ${
                        rec.done ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleItem(item.id)}
                          className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            rec.done
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-300 hover:border-emerald-400'
                          }`}
                        >
                          {rec.done && <Check size={12} strokeWidth={3} />}
                        </button>

                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-gray-400 truncate mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Score badge */}
                        <span className="text-[11px] text-gray-400 font-medium">
                          +{item.score}分
                        </span>

                        {/* Numeric input */}
                        {item.type === 'numeric' && (
                          <input
                            type="number"
                            min={0}
                            value={rec.value ?? ''}
                            onChange={(e) => setItemValue(item.id, e.target.value ? Number(e.target.value) : null)}
                            placeholder="0"
                            className={`w-16 px-2 py-1 text-xs text-center rounded-lg border transition-all ${
                              rec.done
                                ? 'border-emerald-200 bg-emerald-50/50 text-gray-700'
                                : 'border-gray-200 bg-white text-gray-400'
                            } focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100`}
                          />
                        )}

                        {/* Unit label */}
                        {item.type === 'numeric' && item.unit && (
                          <span className="text-[11px] text-gray-400 w-6">{item.unit}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 保存按钮 */}
      <div className="sticky bottom-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60 transition-colors shadow-lg shadow-emerald-200"
        >
          保存打卡
        </button>
      </div>
    </div>
  );
}
