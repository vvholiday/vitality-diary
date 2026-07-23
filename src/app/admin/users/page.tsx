'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Shield, User } from 'lucide-react';
import { fetchAllUsers } from '@/lib/supabase/queries';

type SortField = 'created_at' | 'checkin_count' | 'last_active';
type SortDir = 'asc' | 'desc';

export default function AdminUsersPage() {
  const [mockUsers, setMockUsers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAllUsers();
        setMockUsers(data);
      } catch (e) {
        console.error('加载用户失败', e);
      }
    })();
  }, []);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let list = [...mockUsers];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.nickname?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'created_at') return (a.created_at < b.created_at ? -1 : 1) * dir;
      if (sortField === 'checkin_count') return ((a.checkin_count || 0) - (b.checkin_count || 0)) * dir;
      if (sortField === 'last_active') return ((a.last_active || '') < (b.last_active || '') ? -1 : 1) * dir;
      return 0;
    });
    return list;
  }, [search, sortField, sortDir, mockUsers]);

  const activeUsers = mockUsers.filter((u: any) => {
    const today = new Date().toISOString().slice(0, 10);
    return u.last_active === today;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <ChevronDown size={12} className={`transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
    );
  };

  const avgCheckins = mockUsers.length > 0
    ? Math.round(mockUsers.reduce((s: number, u: any) => s + (u.checkin_count || 0), 0) / mockUsers.length)
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900">用户管理</h1>
        <p className="text-xs text-gray-400 mt-1">查看注册用户列表</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-gray-900">{mockUsers.length}</div>
          <div className="text-xs text-gray-400 mt-1">注册用户</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-emerald-500">{activeUsers.length}</div>
          <div className="text-xs text-gray-400 mt-1">今日活跃</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-emerald-500">{avgCheckins}</div>
          <div className="text-xs text-gray-400 mt-1">人均打卡次数</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户昵称或邮箱..."
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
        />
      </div>

      {/* User table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">用户</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">邮箱</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">角色</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort('created_at')}>
                  <span className="inline-flex items-center gap-1">注册时间 <SortIcon field="created_at" /></span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort('last_active')}>
                  <span className="inline-flex items-center gap-1">最近活跃 <SortIcon field="last_active" /></span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort('checkin_count')}>
                  <span className="inline-flex items-center gap-1 justify-end">打卡次数 <SortIcon field="checkin_count" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u: any, i: number) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-gray-300">{i + 1}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {(u.nickname || '?').charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{u.nickname || '未知'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{u.email || '-'}</td>
                  <td className="px-4 py-3.5">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Shield size={10} />
                        管理员
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        <User size={10} />
                        用户
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {u.created_at ? u.created_at.slice(0, 10) : '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs ${u.last_active === new Date().toISOString().slice(0, 10) ? 'text-emerald-500 font-medium' : 'text-gray-400'}`}>
                      {u.last_active || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-xs font-medium text-gray-700">{u.checkin_count || 0}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">暂无注册用户</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
