'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    alert('密码修改成功！');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Profile section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">个人资料</h2>
        </div>

        <div className="p-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-xl text-emerald-600 font-bold">
                {user?.nickname?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{user?.nickname}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
              {isAdmin && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-medium rounded">
                  管理员
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">邮箱</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 rounded-xl border border-gray-100 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400 mt-1">邮箱暂不支持修改</p>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-xs font-medium hover:bg-emerald-600 transition-colors"
            >
              {saved ? '已保存 ✓' : '保存修改'}
            </button>
          </form>
        </div>
      </div>

      {/* Password section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">修改密码</h2>
        </div>
        <div className="p-5">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">新密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6位"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={!password || password.length < 6}
              className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              修改密码
            </button>
          </form>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-sm text-red-500 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        退出登录
      </button>
    </div>
  );
}
