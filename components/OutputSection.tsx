import React from 'react';
import { Copy, Check } from 'lucide-react';

interface OutputSectionProps {
  label: string;
  content: string | React.ReactNode;
  onCopy?: () => void;
  isCopied?: boolean;
  className?: string;
  multiline?: boolean;
}

export const OutputSection: React.FC<OutputSectionProps> = ({ 
  label, 
  content, 
  onCopy, 
  isCopied, 
  className = "",
  multiline = false
}) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700 text-sm tracking-wide uppercase">{label}</h3>
        {onCopy && (
          <button 
            onClick={onCopy}
            className="text-gray-400 hover:text-red-600 transition-colors p-1"
            title="Copy to clipboard"
          >
            {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        )}
      </div>
      <div className={`p-4 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {typeof content === 'string' ? (
           <p className="text-gray-800 leading-relaxed text-[15px]">{content}</p>
        ) : (
          content
        )}
      </div>
    </div>
  );
};