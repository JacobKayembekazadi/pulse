import React, { useState } from 'react';
import { SOPItem } from '../types';
import { Plus, Trash2, FileText, Shield, MessageSquare, X } from 'lucide-react';

interface SOPManagerProps {
  sops: SOPItem[];
  onAdd: (item: SOPItem) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onClose: () => void;
}

const SOPManager: React.FC<SOPManagerProps> = ({ sops, onAdd, onDelete, onToggle, onClose }) => {
  const [newItem, setNewItem] = useState<{ title: string; content: string; type: SOPItem['type'] }>({
    title: '',
    content: '',
    type: 'tone'
  });

  const handleAdd = () => {
    if (!newItem.title || !newItem.content) return;
    
    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      title: newItem.title,
      content: newItem.content,
      type: newItem.type,
      isActive: true
    });
    
    setNewItem({ title: '', content: '', type: 'tone' });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'tone': return <MessageSquare className="w-4 h-4 text-accent" />;
      case 'rule': return <Shield className="w-4 h-4 text-red-400" />;
      case 'template': return <FileText className="w-4 h-4 text-primary" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Brand Protocol (SOPs)
            </h2>
            <p className="text-sm text-gray-400">Define how the AI should respond to your community.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* List of Existing SOPs */}
          <div className="space-y-3">
             {sops.length === 0 && (
                <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-lg">
                   No protocols defined. Add your first rule or template below.
                </div>
             )}
             {sops.map(sop => (
               <div key={sop.id} className={`glass-card p-4 rounded-lg border flex items-start gap-4 ${sop.isActive ? 'border-white/10 opacity-100' : 'border-transparent opacity-50 bg-black/20'}`}>
                  <div className="mt-1">{getIcon(sop.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white text-sm">{sop.title}</h3>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-gray-500 border border-white/10 px-1.5 rounded">{sop.type}</span>
                    </div>
                    <p className="text-sm text-gray-400 whitespace-pre-wrap">{sop.content}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => onDelete(sop.id)} className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-colors">
                       <Trash2 className="w-4 h-4" />
                    </button>
                    <input 
                      type="checkbox" 
                      checked={sop.isActive} 
                      onChange={() => onToggle(sop.id)}
                      className="accent-primary h-4 w-4 rounded cursor-pointer"
                    />
                  </div>
               </div>
             ))}
          </div>

          {/* Add New Form */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New Protocol
            </h3>
            <div className="space-y-3">
               <div className="flex gap-3">
                 <input 
                    type="text" 
                    placeholder="Title (e.g., Apology Template)" 
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors"
                 />
                 <select 
                    value={newItem.type}
                    onChange={(e) => setNewItem({...newItem, type: e.target.value as SOPItem['type']})}
                    className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:border-primary outline-none"
                 >
                    <option value="tone">Tone of Voice</option>
                    <option value="rule">Strict Rule</option>
                    <option value="template">Response Template</option>
                 </select>
               </div>
               <textarea 
                  placeholder="Content (e.g., 'Always be empathetic. Use emojis sparingly.' OR 'Hi {name}, sorry about that...')"
                  value={newItem.content}
                  onChange={(e) => setNewItem({...newItem, content: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none h-24 resize-none"
               />
               <button 
                 onClick={handleAdd}
                 disabled={!newItem.title || !newItem.content}
                 className="w-full py-2 bg-primary hover:bg-primaryGlow text-white rounded font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Add to Knowledge Base
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SOPManager;