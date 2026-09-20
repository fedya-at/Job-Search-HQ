import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { DataLists } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface ListsSettingsViewProps {
  lists: DataLists;
  onUpdateLists: (lists: DataLists) => void;
}

export const ListsSettingsView: React.FC<ListsSettingsViewProps> = ({
  lists,
  onUpdateLists,
}) => {
  const [newOrigin, setNewOrigin] = useState('');
  const [newRoleCat, setNewRoleCat] = useState('');
  const [newResumeOption, setNewResumeOption] = useState('');

  // Editing state for list items
  const [editingItem, setEditingItem] = useState<{
    key: keyof DataLists;
    index: number;
    value: string;
  } | null>(null);

  // Deletion confirmation state
  const [itemToDelete, setItemToDelete] = useState<{
    key: keyof DataLists;
    index: number;
    name: string;
    listTitle: string;
  } | null>(null);

  const handleAddOrigin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrigin.trim()) return;
    onUpdateLists({
      ...lists,
      origins: [...lists.origins, newOrigin.trim() as any],
    });
    setNewOrigin('');
  };

  const handleAddRoleCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleCat.trim()) return;
    onUpdateLists({
      ...lists,
      roleCategories: [...lists.roleCategories, newRoleCat.trim()],
    });
    setNewRoleCat('');
  };

  const handleAddResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResumeOption.trim()) return;
    const item = newResumeOption.startsWith('📄 ') ? newResumeOption.trim() : `📄 ${newResumeOption.trim()}`;
    onUpdateLists({
      ...lists,
      resumes: [...lists.resumes, item],
    });
    setNewResumeOption('');
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editingItem.value.trim()) {
      setEditingItem(null);
      return;
    }

    const { key, index, value } = editingItem;
    const arr = [...(lists[key] as string[])];
    arr[index] = value.trim();

    onUpdateLists({
      ...lists,
      [key]: arr,
    });
    setEditingItem(null);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const { key, index } = itemToDelete;
    const arr = [...(lists[key] as string[])];
    arr.splice(index, 1);
    onUpdateLists({
      ...lists,
      [key]: arr,
    });
    setItemToDelete(null);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-[#F4EDE4] text-[#A36B58]">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2C2723]">
              DATA VALIDATION LISTS
            </h2>
          </div>
          <p className="text-xs text-[#7D736A]">
            The supporting dropdown lists that power all database form validation and Google Sheets dropdown cells. You can edit or delete custom items anytime.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#2E7D32] bg-[#EAF7EE] px-3.5 py-1.5 rounded-xl border border-[#C5E6CE]">
          <ShieldCheck className="w-4 h-4" />
          <span>Strict Validation Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Statuses */}
        <div className="bg-white rounded-2xl p-5 border border-[#ECE5DD] shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ECE5DD]">
            <h3 className="font-serif font-bold text-sm text-[#2C2723]">
              1. Application Statuses ({lists.statuses.length})
            </h3>
            <span className="text-[10px] text-[#8C8074]">System Pre-set</span>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {lists.statuses.map((st, idx) => (
              <div
                key={st}
                className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] text-xs text-[#3D352E] border border-[#F2ECE5]"
              >
                <span>{st}</span>
                <span className="text-[10px] text-[#A89E93]">#{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Resume Versions */}
        <div className="bg-white rounded-2xl p-5 border border-[#ECE5DD] shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ECE5DD]">
            <h3 className="font-serif font-bold text-sm text-[#2C2723]">
              2. Resume Profiles ({lists.resumes.length})
            </h3>
            <span className="text-[10px] text-[#8C8074]">Editable</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {lists.resumes.map((res, idx) => {
              const isEditing =
                editingItem?.key === 'resumes' && editingItem.index === idx;

              return (
                <div
                  key={res + idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] text-xs text-[#3D352E] border border-[#F2ECE5] group gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingItem.value}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, value: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingItem(null);
                        }}
                        className="flex-1 px-2 py-1 text-xs rounded-lg bg-white border border-[#A36B58] text-[#2C2723] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="p-1 text-[#2E7D32] hover:bg-[#EAF7EE] rounded-md transition-colors"
                        title="Save changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="p-1 text-[#8C8074] hover:bg-[#F2ECE5] rounded-md transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate flex-1">{res}</span>
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingItem({ key: 'resumes', index: idx, value: res })
                          }
                          className="p-1 text-[#8C8074] hover:text-[#A36B58] hover:bg-[#F2ECE5] rounded-md transition-colors cursor-pointer"
                          title="Edit option"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {lists.resumes.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setItemToDelete({
                                key: 'resumes',
                                index: idx,
                                name: res,
                                listTitle: 'Resume Profiles',
                              })
                            }
                            className="p-1 text-[#A89E93] hover:text-[#C13626] hover:bg-[#FDECEC] rounded-md transition-colors cursor-pointer"
                            title="Delete option"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <form onSubmit={handleAddResume} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="e.g. AI Prompt Engineer CV"
              value={newResumeOption}
              onChange={(e) => setNewResumeOption(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-[#A36B58] text-white rounded-xl font-medium cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>

        {/* 3. Origin Sources */}
        <div className="bg-white rounded-2xl p-5 border border-[#ECE5DD] shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ECE5DD]">
            <h3 className="font-serif font-bold text-sm text-[#2C2723]">
              3. Application Origins ({lists.origins.length})
            </h3>
            <span className="text-[10px] text-[#8C8074]">Editable</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {lists.origins.map((orig, idx) => {
              const isEditing =
                editingItem?.key === 'origins' && editingItem.index === idx;

              return (
                <div
                  key={orig + idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] text-xs text-[#3D352E] border border-[#F2ECE5] group gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingItem.value}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, value: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingItem(null);
                        }}
                        className="flex-1 px-2 py-1 text-xs rounded-lg bg-white border border-[#A36B58] text-[#2C2723] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="p-1 text-[#2E7D32] hover:bg-[#EAF7EE] rounded-md transition-colors"
                        title="Save changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="p-1 text-[#8C8074] hover:bg-[#F2ECE5] rounded-md transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate flex-1">{orig}</span>
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingItem({ key: 'origins', index: idx, value: orig })
                          }
                          className="p-1 text-[#8C8074] hover:text-[#A36B58] hover:bg-[#F2ECE5] rounded-md transition-colors cursor-pointer"
                          title="Edit option"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {lists.origins.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setItemToDelete({
                                key: 'origins',
                                index: idx,
                                name: orig,
                                listTitle: 'Application Origins',
                              })
                            }
                            className="p-1 text-[#A89E93] hover:text-[#C13626] hover:bg-[#FDECEC] rounded-md transition-colors cursor-pointer"
                            title="Delete option"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <form onSubmit={handleAddOrigin} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="e.g. Otta / AngelList"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-[#A36B58] text-white rounded-xl font-medium cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>

        {/* 4. Employment Types */}
        <div className="bg-white rounded-2xl p-5 border border-[#ECE5DD] shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ECE5DD]">
            <h3 className="font-serif font-bold text-sm text-[#2C2723]">
              4. Employment Types
            </h3>
            <span className="text-[10px] text-[#8C8074]">System Pre-set</span>
          </div>
          <div className="space-y-1.5">
            {lists.employmentTypes.map((type) => (
              <div
                key={type}
                className="p-2 rounded-xl bg-[#FAF8F5] text-xs text-[#3D352E] border border-[#F2ECE5]"
              >
                {type}
              </div>
            ))}
          </div>
        </div>

        {/* 5. Contact Methods */}
        <div className="bg-white rounded-2xl p-5 border border-[#ECE5DD] shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ECE5DD]">
            <h3 className="font-serif font-bold text-sm text-[#2C2723]">
              5. Contact Channels
            </h3>
            <span className="text-[10px] text-[#8C8074]">System Pre-set</span>
          </div>
          <div className="space-y-1.5">
            {lists.contactMethods.map((cm) => (
              <div
                key={cm}
                className="p-2 rounded-xl bg-[#FAF8F5] text-xs text-[#3D352E] border border-[#F2ECE5]"
              >
                {cm}
              </div>
            ))}
          </div>
        </div>

        {/* 6. Role Categories */}
        <div className="bg-white rounded-2xl p-5 border border-[#ECE5DD] shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ECE5DD]">
            <h3 className="font-serif font-bold text-sm text-[#2C2723]">
              6. Role Specializations ({lists.roleCategories.length})
            </h3>
            <span className="text-[10px] text-[#8C8074]">Editable</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {lists.roleCategories.map((cat, idx) => {
              const isEditing =
                editingItem?.key === 'roleCategories' && editingItem.index === idx;

              return (
                <div
                  key={cat + idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] text-xs text-[#3D352E] border border-[#F2ECE5] group gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingItem.value}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, value: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingItem(null);
                        }}
                        className="flex-1 px-2 py-1 text-xs rounded-lg bg-white border border-[#A36B58] text-[#2C2723] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="p-1 text-[#2E7D32] hover:bg-[#EAF7EE] rounded-md transition-colors"
                        title="Save changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="p-1 text-[#8C8074] hover:bg-[#F2ECE5] rounded-md transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate flex-1">{cat}</span>
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingItem({
                              key: 'roleCategories',
                              index: idx,
                              value: cat,
                            })
                          }
                          className="p-1 text-[#8C8074] hover:text-[#A36B58] hover:bg-[#F2ECE5] rounded-md transition-colors cursor-pointer"
                          title="Edit option"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {lists.roleCategories.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setItemToDelete({
                                key: 'roleCategories',
                                index: idx,
                                name: cat,
                                listTitle: 'Role Specializations',
                              })
                            }
                            className="p-1 text-[#A89E93] hover:text-[#C13626] hover:bg-[#FDECEC] rounded-md transition-colors cursor-pointer"
                            title="Delete option"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <form onSubmit={handleAddRoleCat} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="e.g. AI & ML Research"
              value={newRoleCat}
              onChange={(e) => setNewRoleCat(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-[#A36B58] text-white rounded-xl font-medium cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      {/* List Item Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title={`Remove from ${itemToDelete?.listTitle}?`}
        message={`Are you sure you want to remove "${itemToDelete?.name}"?`}
        confirmLabel="Remove Item"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
