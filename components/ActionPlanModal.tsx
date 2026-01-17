import React from 'react';
import { X, CheckCircle2, AlertCircle, Copy, ClipboardList, ShieldAlert } from 'lucide-react';

interface ActionPlanModalProps {
  plan: string;
  onClose: () => void;
}

const ActionPlanModal: React.FC<ActionPlanModalProps> = ({ plan, onClose }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(plan);
  };

  // Convert markdown list to array for cleaner rendering
  const steps = plan.split('\n').filter(line => line.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-[#09090b] border border-primary/20 rounded-2xl shadow-[0_0_50px_-10px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <ShieldAlert className="w-5 h-5 text-accent" />
              Tactical Action Protocols
            </h2>
            <p className="text-sm text-primaryGlow font-mono mt-1">AI-Generated Strategy • Priority Level: HIGH</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {steps.map((step, index) => {
            // Check if it's a header or list item
            const cleanStep = step.replace(/^[-*#0-9.]+/, '').trim();
            if (!cleanStep) return null;

            return (
              <div key={index} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors group">
                <div className="mt-1">
                   <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-xs font-mono text-primary">
                     {index + 1}
                   </div>
                </div>
                <div className="flex-1">
                   <p className="text-gray-200 leading-relaxed text-sm">
                     {cleanStep.split("**").map((part, i) => 
                       i % 2 === 1 ? <span key={i} className="text-white font-bold">{part}</span> : part
                     )}
                   </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
          <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
             <AlertCircle className="w-3 h-3 text-yellow-500" />
             Review all steps before execution.
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Dismiss
            </button>
            <button 
              onClick={handleCopy}
              className="px-4 py-2 bg-primary hover:bg-primaryGlow text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
            >
              <Copy className="w-4 h-4" />
              Copy Protocol
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ActionPlanModal;