'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-lg text-gray-900">元气日记</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="text-sm bg-emerald-500 text-white px-5 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              免费注册
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero 区域 */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full mb-6">
          你的抗衰老日常记录工具
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          生活有元气，<br className="md:hidden" />
          <span className="text-emerald-500">岁月不败你</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          记录每天的抗衰老行为——运动、饮食、睡眠、护肤等。
          用数据见证坚持的力量，让每一天都算数。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="bg-emerald-500 text-white px-8 py-3 rounded-xl text-base font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
          >
            开始记录
          </Link>
          <Link
            href="/login"
            className="text-gray-600 px-8 py-3 rounded-xl text-base font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            我已注册
          </Link>
        </div>
      </section>

      {/* 预览卡片 */}
      <section className="max-5xl mx-auto px-6 pb-20">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span className="text-sm">📅</span>
              <span className="text-sm font-medium text-gray-700">2026年7月22日 周三</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs text-emerald-600 font-medium">M</div>
              <span className="text-sm text-gray-500">未登录</span>
            </div>
          </div>
          <div className="p-6 space-y-6 opacity-60">
            {[
              { emoji: '🏃', name: '运动', items: ['有氧运动', '抗阻运动', '拉伸放松'], color: 'bg-rose-50 text-rose-600 border-rose-200' },
              { emoji: '🥗', name: '饮食', items: ['喝够2升水', '少糖饮食', '蔬果摄入'], color: 'bg-amber-50 text-amber-600 border-amber-200' },
              { emoji: '💤', name: '睡眠', items: ['11点前入睡', '睡眠时长'], color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
            ].map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                </div>
                <div className="space-y-2 pl-1">
                  {cat.items.map((item) => (
                    <div key={item} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="w-4 h-4 rounded border-2 border-gray-300" />
                      <span className="text-sm text-gray-500">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-center">
            <span className="text-sm text-gray-400">登录后即可开始打卡记录</span>
          </div>
        </div>
      </section>

      {/* 特色介绍 */}
      <section className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">为什么用元气日记</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '📝', title: '简单打卡', desc: '按分类记录每日抗衰老行为，开关+数值，灵活方便' },
              { icon: '📊', title: '数据可视', desc: '雷达图看短板，趋势图看进步，日历一目了然' },
              { icon: '⏰', title: '自由补卡', desc: '忘记打卡没关系，7天内随时可以补记' },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6 rounded-xl bg-gray-50">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        元气日记 &copy; 2026
      </footer>
    </div>
  );
}
