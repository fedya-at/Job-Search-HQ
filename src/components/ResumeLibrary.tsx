import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  Plus,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  Briefcase,
  Check,
  Tag,
} from 'lucide-react';
import { Application, ResumeItem } from '../types';
import { formatDateDisplay } from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface ResumeLibraryProps {
  resumes: ResumeItem[];
  applications: Application[];
  onAddResume: (resume: ResumeItem) => void;
  onUpdateResume: (resume: ResumeItem) => void;
  onDeleteResume: (id: string) => void;
  onFilterByResume: (resumeName: string) => void;
}

export const ResumeLibrary: React.FC<ResumeLibraryProps> = ({
  resumes,
  applications,
  onAddResume,
  onUpdateResume,
  onDeleteResume,
  onFilterByResume,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResume, setEditingResume] = useState<ResumeItem | null>(null);
  const [resumeToDelete, setResumeToDelete] = useState<ResumeItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [dateCreated, setDateCreated] = useState(new Date().toISOString().split('T')[0]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString().split('T')[0]);
  const [usedFor, setUsedFor] = useState('');
  const [fileLink, setFileLink] = useState('');
  const [skills, setSkills] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingResume(null);
    setName('');
    setTargetRole('');
    setVersion('v1.0');
    setDateCreated(new Date().toISOString().split('T')[0]);
    setLastUpdated(new Date().toISOString().split('T')[0]);
    setUsedFor('');
    setFileLink('');
    setSkills('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (res: ResumeItem) => {
    setEditingResume(res);
    setName(res.name);
    setTargetRole(res.targetRole);
    setVersion(res.version);
    setDateCreated(res.dateCreated);
    setLastUpdated(res.lastUpdated);
    setUsedFor(res.usedFor);
    setFileLink(res.fileLink);
    setSkills(res.skills.join(', '));
    setNotes(res.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (editingResume) {
      onUpdateResume({
        ...editingResume,
        name: name.startsWith('📄 ') ? name : `📄 ${name}`,
        targetRole,
        version,
        dateCreated,
        lastUpdated,
        usedFor,
        fileLink,
        skills: skillsArray,
        notes,
      });
    } else {
      const newResume: ResumeItem = {
        id: `res-${Date.now()}`,
        name: name.startsWith('📄 ') ? name : `📄 ${name}`,
        targetRole,
        version,
        dateCreated,
        lastUpdated,
        usedFor,
        fileLink,
        skills: skillsArray,
        notes,
      };
      onAddResume(newResume);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#ECE5DD] shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-[#F4EDE4] text-[#A36B58]">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2C2723]">
              RESUME LIBRARY
            </h2>
          </div>
          <p className="text-xs text-[#7D736A]">
            Curated version-controlled CV library. Track which tailored CV yields the highest response rate.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#A36B58] hover:bg-[#8F5744] rounded-xl transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Resume
        </button>
      </div>

      {/* Aesthetic Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {resumes.map((res) => {
          // Count how many applications in the database used this resume
          const cleanName = res.name.replace('📄 ', '').trim();
          const linkedApps = applications.filter(
            (a) =>
              a.resumeUsed &&
              (a.resumeUsed.includes(cleanName) || cleanName.includes(a.resumeUsed))
          );

          return (
            <div
              key={res.id}
              className="bg-white rounded-2xl p-5 border border-[#ECE5DD] shadow-2xs hover:shadow-xs hover:border-[#D5C7B8] transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                {/* Header: Icon, Version, and Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F6EFE9] flex items-center justify-center text-[#8C6D53] shrink-0 font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#2C2723] group-hover:text-[#A36B58] transition-colors">
                        {res.name}
                      </h3>
                      <p className="text-xs text-[#8C8074]">{res.targetRole}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#F4EFEA] text-[#6E6359] border border-[#E8DFD5]">
                    {res.version}
                  </span>
                </div>

                {/* Used For description */}
                {res.usedFor && (
                  <p className="text-xs text-[#5E554B] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#F0EAE1] leading-relaxed">
                    {res.usedFor}
                  </p>
                )}

                {/* Skills tags */}
                {res.skills && res.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {res.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#F2EDE7] text-[#665B51] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {res.notes && (
                  <p className="text-[11px] text-[#8C8074] italic">
                    "{res.notes}"
                  </p>
                )}
              </div>

              {/* Card Footer: Usage Count & Link Button */}
              <div className="pt-3 border-t border-[#F2ECE5] flex items-center justify-between text-xs">
                <button
                  onClick={() => onFilterByResume(cleanName)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A36B58] hover:text-[#7A4B3A] hover:underline"
                  title="View applications using this CV"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {linkedApps.length} Applications linked
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(res)}
                    className="p-1.5 rounded-lg text-[#8C8074] hover:text-[#2C2723] hover:bg-[#F2ECE5] transition-colors"
                    title="Edit details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeToDelete(res)}
                    className="p-1.5 rounded-lg text-[#A89E93] hover:text-[#C13626] hover:bg-[#FDECEC] transition-colors cursor-pointer"
                    title="Delete resume"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {res.fileLink && (
                    <a
                      href={res.fileLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-[#A36B58] hover:text-[#834E3C] hover:bg-[#F7EFE9] transition-colors"
                      title="Open Google Drive document"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Resume Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#ECE5DD] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE5DD]">
              <h3 className="font-serif font-bold text-lg text-[#2C2723]">
                {editingResume ? 'Edit Resume Item' : 'Add Resume to Library'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8C8074] hover:text-[#2C2723] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Resume Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 📄 Full-Stack Developer CV"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Version Tag
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. v2.4 (2026)"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Used For (Context & Focus)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tailored for tech scale-ups and modern web stacks"
                  value={usedFor}
                  onChange={(e) => setUsedFor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Skills Highlighted (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Google Drive / Document Link
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={fileLink}
                  onChange={(e) => setFileLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Internal notes regarding layout or bullet points..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div className="pt-3 flex items-center justify-between gap-2.5">
                <div>
                  {editingResume && (
                    <button
                      type="button"
                      onClick={() => setResumeToDelete(editingResume)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#C13626] bg-[#FDECEC] hover:bg-[#FCD8D8] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Resume
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E3D9CD] text-[#665D54] hover:bg-[#F5EFE9] text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#A36B58] hover:bg-[#8F5744] text-white font-semibold text-xs shadow-xs cursor-pointer"
                  >
                    {editingResume ? 'Save Changes' : 'Create Resume'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(resumeToDelete)}
        title="Delete Resume Version?"
        message={`Are you sure you want to permanently delete "${resumeToDelete?.name}" (${resumeToDelete?.version})? Any linked applications will retain their historical reference.`}
        confirmLabel="Delete Resume"
        onConfirm={() => {
          if (resumeToDelete) {
            onDeleteResume(resumeToDelete.id);
            if (editingResume && editingResume.id === resumeToDelete.id) {
              setIsModalOpen(false);
            }
            setResumeToDelete(null);
          }
        }}
        onCancel={() => setResumeToDelete(null)}
      />
    </div>
  );
};
