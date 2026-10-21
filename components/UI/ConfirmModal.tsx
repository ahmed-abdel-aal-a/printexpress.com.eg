"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  title = 'تأكيد الإجراء',
  message,
  onConfirm,
  onCancel,
  confirmText = 'نعم، متأكد',
  cancelText = 'إلغاء'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[#111] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="p-6 md:p-8 flex-1">
              <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center mb-6 text-yellow-400">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-400 leading-relaxed font-medium">
                {message}
              </p>
            </div>
            <div className="p-4 md:p-6 bg-[#0a0a0a] flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-3 rounded-xl bg-yellow-400 text-black font-black hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
