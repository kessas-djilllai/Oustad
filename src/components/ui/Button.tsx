import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Button({ 
  onClick, 
  children, 
  disabled, 
  isLoading, 
  className = '', 
  type = 'button',
  ...props 
}: any) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    if (!onClick) return;
    
    try {
      const result = onClick(e);
      if (result && typeof result.then === 'function') {
        setInternalLoading(true);
        await result;
      }
    } finally {
      if (internalLoading) setInternalLoading(false); // To handle unmounted components, wait, use isMounted ref if needed.
    }
  };

  const showLoading = isLoading || internalLoading;

  return (
    <button 
      type={type}
      onClick={handleClick}
      disabled={disabled || showLoading}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden transition-all ${className}`}
      {...props}
    >
      <AnimatePresence>
        {showLoading && (
          <motion.div 
            initial={{ width: 0, opacity: 0, scale: 0 }} 
            animate={{ width: 'auto', opacity: 1, scale: 1 }} 
            exit={{ width: 0, opacity: 0, scale: 0 }}
            className="flex items-center justify-center shrink-0"
          >
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className={`inline-flex items-center gap-2 transition-opacity ${showLoading ? 'opacity-80' : 'opacity-100'}`}>
        {children}
      </span>
    </button>
  );
}
