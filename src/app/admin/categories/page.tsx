'use client';

import { useState, useEffect } from 'react';
import { fetchAllCategories, createCategory, updateCategory, deleteCategory } from '@/lib/supabase/queries';
import { Plus, Edit3, Trash2, X, Check, GripVertical } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => { fetchAllCategories().then(setCategories).catch(console.error); }, []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', emoji_icon: '📋', sort_order: categories.length + 1 });

  const handleToggleActive = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    await updateCategory(id, { is_active: !cat.is_active });
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这个分类吗？该分类下的打卡项目不会被删除，但会变成未分类状态。')) {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAdd = async () => {
    if (!newCat.name.trim()) return;
    const result = await createCategory({
      name: newCat.name,
      emoji_icon: newCat.emoji_icon,
      sort_order: newCat.sort_order,
    });
    setCategories(prev => [...prev, result]);
    setCategories(prev => [...prev, cat]);
    setNewCat({ name: '', emoji_icon: '📋', sort_order: categories.length + 2 });
    setIsAdding(false);
  };

  const handleSaveEdit = async (id: string, field: string, value: any) => {
    await updateCategory(id, { [field]: value }).catch(() => {});
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Sort by sort_order
  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">分类管理</h1>
          <p className="text-xs text-gray-400 mt-1">管理打卡分类，用户将在打卡页面按分类查看项目</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus size={14} />
          新增分类
        </button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newCat.emoji_icon}
              onChange={(e) => setNewCat({ ...newCat, emoji_icon: e.target.value })}
              className="w-12 text-center px-2 py-1.5 rounded-lg border border-amber-200 text-sm"
              placeholder="📋"
              maxLength={2}
            />
            <input
              type="text"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              placeholder="分类名称，如：运动"
              className="flex-1 px-3 py-1.5 rounded-lg border border-amber-200 text-sm focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <input
              type="number"
              value={newCat.sort_order}
              onChange={(e) => setNewCat({ ...newCat, sort_order: parseInt(e.target.value) || 1 })}
              className="w-16 text-center px-2 py-1.5 rounded-lg border border-amber-200 text-sm"
              placeholder="排序"
              min={1}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={!newCat.name.trim()}
              className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      )}

      {/* Category list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {sorted.map((cat) => {
            const isEditing = editingId === cat.id;
            return (
              <div key={cat.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                <GripVertical size={14} className="text-gray-300 shrink-0" />

                {/* Emoji */}
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={cat.emoji_icon}
                    onBlur={(e) => handleSaveEdit(cat.id, 'emoji_icon', e.target.value)}
                    className="w-10 text-center px-1 py-1 rounded border border-gray-200 text-sm"
                    maxLength={2}
                    autoFocus
                  />
                ) : (
                  <span className="text-lg w-8 text-center shrink-0">{cat.emoji_icon}</span>
                )}

                {/* Name */}
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={cat.name}
                    onBlur={(e) => handleSaveEdit(cat.id, 'name', e.target.value)}
                    className="flex-1 px-2 py-1 rounded border border-gray-200 text-sm"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                )}

                {/* Sort order */}
                {isEditing && (
                  <input
                    type="number"
                    defaultValue={cat.sort_order}
                    onBlur={(e) => handleSaveEdit(cat.id, 'sort_order', parseInt(e.target.value) || 1)}
                    className="w-14 text-center px-2 py-1 rounded border border-gray-200 text-xs"
                    min={1}
                  />
                )}

                {/* Status badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  cat.is_active
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {cat.is_active ? '启用' : '停用'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(cat.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title={cat.is_active ? '停用' : '启用'}
                  >
                    {cat.is_active ? <X size={13} /> : <Check size={13} />}
                  </button>
                  <button
                    onClick={() => setEditingId(isEditing ? null : cat.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="编辑"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <p className="text-[11px] text-gray-400">
          共 {categories.length} 个分类，{categories.filter(c => c.is_active).length} 个启用
        </p>
      </div>
    </div>
  );
}
