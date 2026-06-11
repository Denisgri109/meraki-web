'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertCircle, AlertTriangle, HelpCircle, Info, X } from 'lucide-react';

type ModalType = 'info' | 'warning' | 'danger';

interface ModalConfig {
  id: number;
  message: string;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  isConfirm: boolean;
  isPrompt: boolean;
  placeholder?: string;
  type: ModalType;
  resolve: (value: any) => void;
}

interface ModalContextType {
  showAlert: (message: string, title?: string, confirmLabel?: string) => Promise<void>;
  showConfirm: (
    message: string,
    title?: string,
    confirmLabel?: string,
    cancelLabel?: string,
    type?: ModalType
  ) => Promise<boolean>;
  showPrompt: (
    message: string,
    title?: string,
    placeholder?: string,
    confirmLabel?: string,
    cancelLabel?: string
  ) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType>({
  showAlert: async () => {},
  showConfirm: async () => false,
  showPrompt: async () => null,
});

export const useModal = () => useContext(ModalContext);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  const idRef = useRef(0);

  const showAlert = useCallback((message: string, title = 'Notice', confirmLabel = 'OK') => {
    return new Promise<void>((resolve) => {
      const id = ++idRef.current;
      setModal({
        id,
        message,
        title,
        confirmLabel,
        cancelLabel: '',
        isConfirm: false,
        isPrompt: false,
        type: 'info',
        resolve: () => {
          setModal(null);
          resolve();
        },
      });
    });
  }, []);

  const showConfirm = useCallback(
    (
      message: string,
      title = 'Confirm Action',
      confirmLabel = 'OK',
      cancelLabel = 'Cancel',
      type: ModalType = 'warning'
    ) => {
      return new Promise<boolean>((resolve) => {
        const id = ++idRef.current;
        setModal({
          id,
          message,
          title,
          confirmLabel,
          cancelLabel,
          isConfirm: true,
          isPrompt: false,
          type,
          resolve: (val) => {
            setModal(null);
            resolve(val);
          },
        });
      });
    },
    []
  );

  const showPrompt = useCallback(
    (
      message: string,
      title = 'Input Required',
      placeholder = '',
      confirmLabel = 'Submit',
      cancelLabel = 'Cancel'
    ) => {
      setInputValue('');
      return new Promise<string | null>((resolve) => {
        const id = ++idRef.current;
        setModal({
          id,
          message,
          title,
          confirmLabel,
          cancelLabel,
          isConfirm: true,
          isPrompt: true,
          placeholder,
          type: 'info',
          resolve: (val) => {
            setModal(null);
            resolve(val);
          },
        });
      });
    },
    []
  );

  const handleClose = () => {
    if (modal) {
      if (modal.isPrompt) {
        modal.resolve(null);
      } else {
        modal.resolve(false);
      }
    }
  };

  const handleConfirm = () => {
    if (modal) {
      if (modal.isPrompt) {
        modal.resolve(inputValue);
      } else {
        modal.resolve(true);
      }
    }
  };

  // Icon mapping depending on the type
  const getIcon = () => {
    if (!modal) return null;
    switch (modal.type) {
      case 'danger':
        return <AlertTriangle size={24} className="text-red-500" />;
      case 'warning':
        return <HelpCircle size={24} className="text-amber-500" />;
      case 'info':
      default:
        return <Info size={24} className="text-[var(--color-brand-pink-dark)]" />;
    }
  };

  // Badge background color depending on type
  const getBadgeClass = () => {
    if (!modal) return '';
    switch (modal.type) {
      case 'danger':
        return 'bg-red-50';
      case 'warning':
        return 'bg-amber-50';
      case 'info':
      default:
        return 'bg-[var(--color-brand-pink-light)]';
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}

      {modal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto modal-overlay"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-content relative border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-gray-50 cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              {/* Header Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${getBadgeClass()}`}>
                {getIcon()}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2 px-2">
                {modal.title}
              </h3>

              {/* Message */}
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4 px-1 whitespace-pre-line">
                {modal.message}
              </p>

              {/* Input for Prompt */}
              {modal.isPrompt && (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={modal.placeholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-pink-dark)] focus:border-transparent text-center font-medium"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirm();
                    }
                  }}
                />
              )}

              {/* Action Buttons */}
              <div className="flex w-full gap-3 justify-center">
                {modal.isConfirm && (
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] border border-[var(--color-border-light)] transition-colors cursor-pointer"
                  >
                    {modal.cancelLabel}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-all shadow-sm cursor-pointer ${
                    modal.type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20'
                      : 'bg-black hover:bg-gray-800'
                  }`}
                >
                  {modal.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
