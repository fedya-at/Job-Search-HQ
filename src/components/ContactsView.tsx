import React, { useState } from 'react';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Linkedin,
  Calendar,
  Building2,
  ExternalLink,
  Edit2,
  Trash2,
  Briefcase,
} from 'lucide-react';
import { Application, ContactItem } from '../types';
import { formatDateDisplay } from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface ContactsViewProps {
  contacts: ContactItem[];
  applications: Application[];
  onAddContact: (contact: ContactItem) => void;
  onUpdateContact: (contact: ContactItem) => void;
  onDeleteContact: (id: string) => void;
  onSelectApplication: (app: Application) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  applications,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onSelectApplication,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [contactToDelete, setContactToDelete] = useState<ContactItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [relationship, setRelationship] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lastContact, setLastContact] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingContact(null);
    setName('');
    setCompany('');
    setRole('');
    setRelationship('');
    setLinkedIn('');
    setEmail('');
    setPhone('');
    setLastContact('');
    setNextFollowUp('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (contact: ContactItem) => {
    setEditingContact(contact);
    setName(contact.name);
    setCompany(contact.company);
    setRole(contact.role);
    setRelationship(contact.relationship);
    setLinkedIn(contact.linkedIn || '');
    setEmail(contact.email || '');
    setPhone(contact.phone || '');
    setLastContact(contact.lastContact || '');
    setNextFollowUp(contact.nextFollowUp || '');
    setNotes(contact.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      onUpdateContact({
        ...editingContact,
        name,
        company,
        role,
        relationship,
        linkedIn,
        email,
        phone,
        lastContact,
        nextFollowUp,
        notes,
      });
    } else {
      const newContact: ContactItem = {
        id: `cont-${Date.now()}`,
        name,
        company,
        role,
        relationship,
        linkedIn,
        email,
        phone,
        lastContact,
        nextFollowUp,
        notes,
        associatedApps: [],
      };
      onAddContact(newContact);
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
              <Users className="w-4 h-4" />
            </span>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2C2723]">
              NETWORKING & CONTACTS
            </h2>
          </div>
          <p className="text-xs text-[#7D736A]">
            Career connections directory. Associate recruiters and hiring managers with your applications.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#A36B58] hover:bg-[#8F5744] rounded-xl transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Contacts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {contacts.map((contact) => {
          // Find linked applications
          const linkedApps = applications.filter(
            (a) =>
              (contact.associatedApps && contact.associatedApps.includes(a.id)) ||
              (a.contactName && a.contactName.toLowerCase().includes(contact.name.toLowerCase())) ||
              a.company.toLowerCase() === contact.company.toLowerCase()
          );

          return (
            <div
              key={contact.id}
              className="bg-white rounded-2xl p-5 border border-[#ECE5DD] shadow-2xs hover:shadow-xs hover:border-[#D5C7B8] transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F4ECE3] text-[#8C6D53] flex items-center justify-center font-serif font-bold text-sm shrink-0">
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#2C2723] group-hover:text-[#A36B58] transition-colors">
                        {contact.name}
                      </h3>
                      <p className="text-xs text-[#7D736A] flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-[#A89E93]" />
                        {contact.role} at <strong className="text-[#3D352E]">{contact.company}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(contact)}
                      className="p-1.5 text-[#8C8074] hover:text-[#2C2723] hover:bg-[#F2ECE5] rounded-lg transition-colors cursor-pointer"
                      title="Edit contact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setContactToDelete(contact)}
                      className="p-1.5 text-[#A89E93] hover:text-[#C13626] hover:bg-[#FDECEC] rounded-lg transition-colors cursor-pointer"
                      title="Delete contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Relationship description */}
                {contact.relationship && (
                  <div className="text-[11px] text-[#6E6359] bg-[#FAF8F5] px-2.5 py-1.5 rounded-lg border border-[#F0EAE1]">
                    <span className="font-semibold text-[#8C6D53]">Connection:</span> {contact.relationship}
                  </div>
                )}

                {/* Contact Methods */}
                <div className="space-y-1.5 text-xs">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-[#4A423B] hover:text-[#A36B58] transition-colors truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#A89E93] shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-[#4A423B] hover:text-[#A36B58] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#A89E93] shrink-0" />
                      <span>{contact.phone}</span>
                    </a>
                  )}
                  {contact.linkedIn && (
                    <a
                      href={contact.linkedIn}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-[#2D5F85] hover:underline transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-[#2D5F85] shrink-0" />
                      <span>LinkedIn Profile ↗</span>
                    </a>
                  )}
                </div>

                {/* Notes */}
                {contact.notes && (
                  <p className="text-[11px] text-[#8C8074] italic bg-[#FCFAF7] p-2 rounded-lg border border-[#F2EDE6]">
                    "{contact.notes}"
                  </p>
                )}

                {/* Associated Applications */}
                {linkedApps.length > 0 && (
                  <div className="pt-2 border-t border-[#F2ECE5]">
                    <span className="text-[10px] uppercase font-bold text-[#A89E93] tracking-wider block mb-1">
                      Linked Roles:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {linkedApps.map((app) => (
                        <button
                          key={app.id}
                          onClick={() => onSelectApplication(app)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#F4EFEA] hover:bg-[#EAE2D8] text-[#4A423B] transition-colors"
                        >
                          <Briefcase className="w-3 h-3 text-[#A36B58]" />
                          {app.company} ({app.status})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: Touchpoints */}
              <div className="pt-3 border-t border-[#F2ECE5] flex items-center justify-between text-[11px] text-[#8C8074]">
                <div>
                  Last: <span className="font-semibold text-[#3D352E]">{formatDateDisplay(contact.lastContact)}</span>
                </div>
                {contact.nextFollowUp && (
                  <div>
                    Next: <span className="font-semibold text-[#A36B58]">{formatDateDisplay(contact.nextFollowUp)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#ECE5DD] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE5DD]">
              <h3 className="font-serif font-bold text-lg text-[#2C2723]">
                {editingContact ? 'Edit Contact' : 'Add Professional Contact'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8C8074] hover:text-[#2C2723] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Linear"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Role / Position
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Tech Recruiter"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. InMail outreach / Referral"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="elena@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedIn}
                  onChange={(e) => setLinkedIn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Last Contact Date
                  </label>
                  <input
                    type="date"
                    value={lastContact}
                    onChange={(e) => setLastContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4A423B] mb-1">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4A423B] mb-1">
                  Notes & Discussion Points
                </label>
                <textarea
                  rows={2}
                  placeholder="Personal preferences, conversation highlights..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E3D9CD] text-[#2C2723] focus:outline-none focus:border-[#A36B58]"
                />
              </div>

              <div className="pt-3 flex items-center justify-between gap-2.5">
                <div>
                  {editingContact && (
                    <button
                      type="button"
                      onClick={() => setContactToDelete(editingContact)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#C13626] bg-[#FDECEC] hover:bg-[#FCD8D8] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Contact
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
                    {editingContact ? 'Save Changes' : 'Add Contact'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(contactToDelete)}
        title="Delete Contact?"
        message={`Are you sure you want to permanently delete "${contactToDelete?.name}" (${contactToDelete?.role} at ${contactToDelete?.company})?`}
        confirmLabel="Delete Contact"
        onConfirm={() => {
          if (contactToDelete) {
            onDeleteContact(contactToDelete.id);
            if (editingContact && editingContact.id === contactToDelete.id) {
              setIsModalOpen(false);
            }
            setContactToDelete(null);
          }
        }}
        onCancel={() => setContactToDelete(null)}
      />
    </div>
  );
};
