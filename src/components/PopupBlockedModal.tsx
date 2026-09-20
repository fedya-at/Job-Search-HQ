import React from 'react';
import { ShieldAlert, ExternalLink, RefreshCw, Download, X, AlertTriangle } from 'lucide-react';

interface PopupBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onExportCsv: () => void;
}

export const PopupBlockedModal: React.FC<PopupBlockedModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onExportCsv,
}) => {
  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#ECE5DD] shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF3E0] border border-[#FFE0B2] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#E65100]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2C2723]">
                Sign-In Pop-up Was Blocked
              </h3>
              <p className="text-xs text-[#8C8074]">
                Browser security restricted the Google authorization window
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#968C82] hover:text-[#2C2723] p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Box */}
        <div className="bg-[#FAF8F5] border border-[#EAE3DA] rounded-2xl p-4 text-xs text-[#5C5349] space-y-2.5 leading-relaxed">
          <div className="flex items-center gap-2 font-medium text-[#2C2723]">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>Why did this happen?</span>
          </div>
          <p>
            When running inside an <strong>embedded iframe preview</strong>, browsers enforce cross-origin pop-up restrictions to protect user privacy.
          </p>
          <p className="text-[#7D736A]">
            Opening the app directly in a full browser tab removes all iframe sandbox restrictions, allowing the official Google Sign-in dialog to pop up seamlessly.
          </p>
        </div>

        {/* Action Options */}
        <div className="space-y-2.5 pt-1">
          {/* Option 1: Open in New Tab (Recommended) */}
          <a
            id="popup-modal-open-new-tab-btn"
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              onClose();
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#A36B58] hover:bg-[#8F5A49] text-white rounded-2xl font-semibold text-xs transition-all shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <ExternalLink className="w-4 h-4 text-[#FFD8CD] group-hover:translate-x-0.5 transition-transform shrink-0" />
              <div>
                <div className="font-bold">Open App in New Tab (Recommended)</div>
                <div className="text-[11px] text-[#F3DDD5] font-normal">
                  Opens standalone full window where Google Sign-In popups are allowed
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg shrink-0 ml-2">
              Launch ↗
            </span>
          </a>

          {/* Option 2: Try Again */}
          <button
            id="popup-modal-retry-btn"
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#F4EFEA] hover:bg-[#ECE5DC] text-[#3D352E] rounded-2xl font-medium text-xs border border-[#E3D9CD] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <RefreshCw className="w-4 h-4 text-[#8C8074] shrink-0" />
              <div>
                <div className="font-semibold">Try Sign-In Inside Frame</div>
                <div className="text-[11px] text-[#7D736A]">
                  Attempt popup anyway (if popups were unblocked in browser bar)
                </div>
              </div>
            </div>
            <span className="text-xs text-[#8C8074] font-semibold shrink-0 ml-2">Retry</span>
          </button>

          {/* Option 3: Download CSV immediately without signing in */}
          <button
            id="popup-modal-export-csv-btn"
            onClick={() => {
              onClose();
              onExportCsv();
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#5C5349] rounded-2xl font-medium text-xs border border-[#E8E0D7] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Download className="w-4 h-4 text-[#8C8074] shrink-0" />
              <div>
                <span className="font-semibold">Export CSV Spreadsheet Instead</span>
                <span className="text-[11px] text-[#8C8074] ml-1.5">(No Google sign-in required)</span>
              </div>
            </div>
            <span className="text-xs text-[#8C8074] font-semibold shrink-0 ml-2">Export</span>
          </button>
        </div>

        {/* Quick tip at bottom */}
        <div className="pt-2 border-t border-[#ECE5DD] flex items-center justify-between text-[11px] text-[#968C82]">
          <span>💡 Tip: Check your browser address bar for the blocked pop-up icon</span>
          <button
            onClick={onClose}
            className="text-[#6B6158] hover:text-[#2C2723] font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
