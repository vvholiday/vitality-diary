'use client';

import { useState, useEffect } from 'react';
import { fetchAllItems, fetchAllCategories, createItem, updateItem, deleteItem } from '@/lib/supabase/queries';
import { Plus, Edit3, Trash2, X, Check, GripVertical } from 'lucide-react';

export default function AdminItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchAllItems().then(setItems).catch(console.error);
    fetchAllCategories().then(setDbCategories).catch(console.error);
  }, []);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    category_id: dbCategories[0]?.id || '',
    name: '',
    type: 'toggle' as 'toggle' | 'numeric',
    unit: '',
    score: 10,
    description: '',
    sort_order: items.length + 1,
  });

  const activeCategories = dbCategories.filter((c: any) => c.is_active);

  const filtered = filterCategory === 'all'
    ? items
    : items.filter(i => i.category_id === filterCategory);

  const sorted = [...filtered].sort((a, b) => {
    if (a.category_id !== b.category_id) {
      const aCat = dbCategories.find(c => c.id === a.category_id);
      const bCat = dbCategories.find(c => c.id === b.category_id);
      return (aCat?.sort_order || 0) - (bCat?.sort_order || 0);
    }
    return a.sort_order - b.sort_order;
  });

  const handleToggleActive = async (id: string) => {
    const item = items.find((i: any) => i.id === id);
    if (!item) return;
    await updateItem(id, { is_active: !item.is_active });
    setItems(prev => prev.map((i: any) => i.id === id ? { ...i, is_active: !i.is_active } : i));
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这个打卡项目吗？')) {
      await deleteItem(id);
      setItems(prev => prev.filter((i: any) => i.id !== id));
    }
  };

  const handleAdd = async () => {
    if (!newItem.category_id) {
      alert('请先选择所属分类');
      return;
    }
    if (!newItem.name.trim()) {
      alert('请输入项目名称');
      return;
    }
    try {
    const result = await createItem({
      category_id: newItem.category_id,
      name: newItem.name,
      type: newItem.type,
      unit: newItem.type === 'numeric' ? newItem.unit || '次' : null,
      score: newItem.score,
      description: newItem.description,
      sort_order: newItem.sort_order,
    });
    setItems(prev => [...prev, result]);
    setNewItem({
      category_id: dbCategories[0]?.id || '',
      name: '',
      type: 'toggle',
      unit: '',
      score: 10,
      description: '',
      sort_order: items.length + 2,
    });
    setIsAdding(false);
    } catch (e: any) {
      alert('保存失败：' + (e?.message || '未知错误'));
    }
  };

  const handleSaveEdit = async (id: string, field: string, value: any) => {
    await updateItem(id, { [field]: value }).catch(() => {});
    setItems(prev => prev.map((i: any) => i.id === id ? { ...i, [field]: value } : i));
  };

  const getCategoryName = (catId: string) => {
    return dbCategories.find((c: any) => c.id === catId)?.name || '未分类';
  };

  const getCategoryEmoji = (catId: string) => {
    return dbCategories.find((c: any) => c.id === catId)?.emoji_icon || '📋';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">项目管理</h1>
          <p className="text-xs text-gray-400 mt-1">管理打卡项目，配置项目类型、分值和单位</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus size={14} />
          新增项目
        </button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">按分类筛选：</span>
        <div className="flex gap-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCategory === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterCategory === cat.id
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{cat.emoji_icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-amber-700 font-medium mb-1">所属分类 <span className="text-red-500">*必填</span></label>
              <select
                value={newItem.category_id}
                onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border border-amber-200 text-xs"
              >
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.emoji_icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-amber-700 font-medium mb-1">项目名称</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="如：有氧运动"
                className="w-full px-2 py-1.5 rounded-lg border border-amber-200 text-xs"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] text-amber-700 font-medium mb-1">项目类型</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewItem({ ...newItem, type: 'toggle', unit: '' })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    newItem.type === 'toggle'
                      ? 'bg-amber-100 border-amber-400 text-amber-800'
                      : 'bg-white border-amber-200 text-amber-700'
                  }`}
                >
                  开关型
                </button>
                <button
                  onClick={() => setNewItem({ ...newItem, type: 'numeric' })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    newItem.type === 'numeric'
                      ? 'bg-amber-100 border-amber-400 text-amber-800'
                      : 'bg-white border-amber-200 text-amber-700'
                  }`}
                >
                  数值型
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-amber-700 font-medium mb-1">单次分值</label>
                <input
                  type="number"
                  value={newItem.score}
                  onChange={(e) => setNewItem({ ...newItem, score: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 rounded-lg border border-amber-200 text-xs"
                  min={0}
                />
              </div>
              {newItem.type === 'numeric' && (
                <div className="flex-1">
                  <label className="block text-[10px] text-amber-700 font-medium mb-1">单位</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="分钟/次/公里"
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-200 text-xs"
                  />
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] text-amber-700 font-medium mb-1">说明（选填）</label>
              <input
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="如：建议每周3-5次，每次30分钟"
                className="w-full px-2 py-1.5 rounded-lg border border-amber-200 text-xs"
              />
            </div>
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
              disabled={!newItem.name.trim() || !newItem.category_id}
              className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {sorted.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              暂无打卡项目
            </div>
          ) : (
            sorted.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div key={item.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <GripVertical size={14} className="text-gray-300 shrink-0" />

                  {/* Category badge / edit */}
                  {isEditing ? (
                    <select
                      defaultValue={item.category_id}
                      onChange={(e) => handleSaveEdit(item.id, 'category_id', e.target.value)}
                      className="text-xs px-1 py-0.5 rounded border border-gray-200 bg-white shrink-0"
                    >
                      {dbCategories.filter((c: any) => c.is_active).map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.emoji_icon} {cat.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs shrink-0">{getCategoryEmoji(item.category_id)}</span>
                  )}

                  {/* Name */}
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={item.name}
                      onBlur={(e) => handleSaveEdit(item.id, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 rounded border border-gray-200 text-sm"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      <span className="text-[10px] text-gray-400 ml-2">{getCategoryName(item.category_id)}</span>
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isEditing ? (
                      <>
                        <select
                          defaultValue={item.type}
                          onChange={(e) => handleSaveEdit(item.id, 'type', e.target.value)}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 bg-white"
                        >
                          <option value="toggle">✓/✗</option>
                          <option value="numeric">数值</option>
                        </select>
                        {item.type === 'numeric' && (
                          <input
                            type="text"
                            defaultValue={item.unit || ''}
                            onBlur={(e) => handleSaveEdit(item.id, 'unit', e.target.value || null)}
                            className="w-12 text-[10px] px-1.5 py-0.5 rounded border border-gray-200"
                            placeholder="单位"
                          />
                        )}
                        <input
                          type="number"
                          defaultValue={item.score}
                          onBlur={(e) => handleSaveEdit(item.id, 'score', parseInt(e.target.value) || 0)}
                          className="w-14 text-xs px-1.5 py-0.5 rounded border border-gray-200"
                          min={0}
                        />
                        <span className="text-[10px] text-gray-400">分</span>
                      </>
                    ) : (
                      <>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          item.type === 'numeric'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {item.type === 'numeric' ? `${item.unit || '次'}` : '✓/✗'}
                        </span>
                        <span className="text-xs text-emerald-600 font-medium">+{item.score}分</span>
                      </>
                    )}
                  </div>

                  {/* Status */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    item.is_active
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {item.is_active ? '启用' : '停用'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {item.is_active ? <X size={13} /> : <Check size={13} />}
                    </button>
                    <button
                      onClick={() => setEditingId(isEditing ? null : item.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-[11px] text-gray-400">
          共 {items.length} 个项目，{items.filter(i => i.is_active).length} 个启用
        </p>
      </div>
    </div>
  );
}
