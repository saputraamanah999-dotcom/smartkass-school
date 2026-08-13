import React from 'react';
import { ChevronRight, Home, Building2 } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-4 overflow-x-auto py-1.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 w-fit">
      <div className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors">
        <Home size={13} className="text-amber-400" />
      </div>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight size={13} className="text-slate-600 shrink-0" />
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="hover:text-amber-400 text-slate-300 transition-colors flex items-center space-x-1 cursor-pointer whitespace-nowrap"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ) : (
              <span className={`flex items-center space-x-1 whitespace-nowrap ${isLast ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                {item.icon}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
