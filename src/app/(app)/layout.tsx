'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const navLinks = [
  { href: '/dashboard', label: '今日打卡', icon: '📝' },
  { href: '/history', label: '历史记录', icon: '📅' },
  { href: '/stats', label: '数据统计', icon: '📊' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-xl">🌱</span>
            <span className="font-bold text-gray-900 text-sm hidden sm:inline">元气日记</span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">生活有元气，岁月不败你</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                管理后台
              </Link>
            )}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs text-emerald-600 font-medium">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-gray-700 hidden sm:inline">{user.nickname}</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      个人设置
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 sm:hidden"
                        onClick={() => setMenuOpen(false)}
                      >
                        管理后台
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={async () => { await logout(); router.push('/'); }}
                      className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-gray-50"
                    >
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
