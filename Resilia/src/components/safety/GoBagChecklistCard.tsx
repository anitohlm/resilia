/**
 * GoBagChecklistCard Component
 * Displays the 72-Hour Emergency Evacuation Go-Bag checklist directly on user dashboards
 * (Residents, Responders, and General).
 * Supports collapsible dropdown mode with full keyboard accessibility, WAI-ARIA compliance,
 * offline state persistence, and reactive multi-tab synchronization.
 */

import React, { useState, useEffect, useId } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { GoBagIcon } from '../icons/ResidentIcons';
import { GO_BAG_ITEMS, STORAGE_KEY } from './GoBagChecklistModal';

export interface GoBagChecklistCardProps {
  onOpenFullModal?: () => void;
  className?: string;
  variant?: 'resident' | 'responder' | 'general';
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggleOpen?: (isOpen: boolean) => void;
}

export const GoBagChecklistCard: React.FC<GoBagChecklistCardProps> = ({
  onOpenFullModal,
  className = '',
  variant = 'resident',
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggleOpen,
}) => {
  const headingId = useId();
  const contentId = useId();

  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>(() => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch {
      // ignore
    }
    return { water: true, food: true, whistle: true };
  });
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL'>('CRITICAL');

  const isDropdownOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleDropdown = () => {
    const next = !isDropdownOpen;
    setInternalIsOpen(next);
    onToggleOpen?.(next);
  };

  // Load state and listen to updates
  useEffect(() => {
    const loadState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setCheckedIds(JSON.parse(saved));
        } else {
          // Default initial items
          setCheckedIds({ water: true, food: true, whistle: true });
        }
      } catch {
        // ignore
      }
    };

    loadState();

    const handleLocalUpdate = (e: any) => {
      if (e.detail) {
        setCheckedIds(e.detail);
      } else {
        loadState();
      }
    };

    window.addEventListener('resilia_gobag_updated', handleLocalUpdate);
    window.addEventListener('storage', loadState);

    return () => {
      window.removeEventListener('resilia_gobag_updated', handleLocalUpdate);
      window.removeEventListener('storage', loadState);
    };
  }, []);

  const toggleItem = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    const next = { ...checkedIds, [id]: !checkedIds[id] };
    setCheckedIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('resilia_gobag_updated', { detail: next }));
    } catch {}
  };

  const packAllCritical = () => {
    const updated: Record<string, boolean> = { ...checkedIds };
    GO_BAG_ITEMS.filter((i) => i.isCritical).forEach((item) => {
      updated[item.id] = true;
    });
    setCheckedIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('resilia_gobag_updated', { detail: updated }));
    } catch {}
  };

  const resetAll = () => {
    setCheckedIds({});
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('resilia_gobag_updated', { detail: {} }));
    } catch {}
  };

  const totalItems = GO_BAG_ITEMS.length;
  const packedCount = GO_BAG_ITEMS.filter((item) => checkedIds[item.id]).length;
  const criticalItems = GO_BAG_ITEMS.filter((item) => item.isCritical);
  const criticalPackedCount = criticalItems.filter((item) => checkedIds[item.id]).length;
  const allCriticalReady = criticalPackedCount === criticalItems.length;
  const percent = Math.round((packedCount / totalItems) * 100);

  const displayedItems = activeFilter === 'CRITICAL'
    ? GO_BAG_ITEMS.filter((item) => item.isCritical)
    : GO_BAG_ITEMS;

  const itemsToShow = isExpanded ? displayedItems : displayedItems.slice(0, 4);

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        variant === 'responder'
          ? 'bg-white border-[#E3E9E5]'
          : 'bg-white border-neutral-200/90'
      } ${className}`}
    >
      {/* Header / Dropdown Trigger Bar */}
      <div
        onClick={(e) => {
          // Allow clicking whitespace on the header to toggle, while protecting inner buttons
          if (!(e.target as HTMLElement).closest('button')) {
            toggleDropdown();
          }
        }}
        className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-neutral-50/70 transition"
      >
        {/* Left Side: Clickable Title & Icon Trigger */}
        <button
          type="button"
          onClick={toggleDropdown}
          aria-expanded={isDropdownOpen}
          aria-controls={contentId}
          className="flex items-start gap-3 flex-1 min-w-[260px] text-left cursor-pointer group bg-transparent border-0 p-0 focus:outline-hidden"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 group-hover:bg-amber-500/20 transition-colors">
            <GoBagIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id={headingId} className="text-base sm:text-lg font-bold text-neutral-900 leading-snug group-hover:text-amber-950 transition-colors">
                72-Hour Evacuation Go-Bag
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                NDRRMC Standard
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Track emergency survival essentials packed for family evacuation • Available offline
            </p>
          </div>
        </button>

        {/* Right Side: Readiness Pill, Full Guide Modal Link, Chevron Toggle Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Readiness pill in header */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              allCriticalReady
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-amber-50 text-amber-900 border border-amber-200/80'
            }`}
          >
            {allCriticalReady ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Readiness: {percent}%</span>
            <span
              className={
                allCriticalReady
                  ? 'text-emerald-700/70 hidden sm:inline'
                  : 'text-amber-700/60 hidden sm:inline'
              }
            >
              ({packedCount}/{totalItems})
            </span>
          </div>

          {onOpenFullModal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullModal();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 shrink-0 p-1.5 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
              title="Open full-screen guide"
            >
              <span>Full Guide</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown();
            }}
            aria-expanded={isDropdownOpen}
            aria-controls={contentId}
            aria-label={isDropdownOpen ? 'Collapse 72-Hour Evacuation Go-Bag' : 'Expand 72-Hour Evacuation Go-Bag'}
            className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                isDropdownOpen ? 'rotate-180 text-neutral-900' : 'rotate-0 text-neutral-500'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Collapsible Dropdown Content with Smooth Transition & Keyboard Trap Prevention */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={headingId}
        aria-hidden={!isDropdownOpen}
        inert={!isDropdownOpen ? true : undefined}
        className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-in-out ${
          isDropdownOpen
            ? 'grid-rows-[1fr] opacity-100 visible'
            : 'grid-rows-[0fr] opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className="overflow-hidden border-t border-neutral-100">
          {/* Readiness Meter */}
          <div className="p-4 sm:p-5 pb-3">
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Readiness: {percent}% Packed ({packedCount}/{totalItems} items)</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    allCriticalReady
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {allCriticalReady
                    ? 'All Critical Ready'
                    : `${criticalItems.length - criticalPackedCount} Critical Missing`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-200/80 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] pt-0.5 gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={packAllCritical}
                    className="text-amber-900 hover:text-amber-950 font-bold underline cursor-pointer"
                  >
                    Pack All Critical Essentials
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {/* Filter Toggle */}
                <div className="flex items-center bg-white/80 rounded-lg p-0.5 border border-amber-200">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('CRITICAL')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      activeFilter === 'CRITICAL'
                        ? 'bg-amber-600 text-white'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Critical ({criticalItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      activeFilter === 'ALL'
                        ? 'bg-amber-600 text-white'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    All ({totalItems})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Checklist Items */}
          <div className="px-4 sm:px-5 pb-3 space-y-2">
            {itemsToShow.map((item) => {
              const isChecked = !!checkedIds[item.id];
              return (
                <button
                  type="button"
                  key={item.id}
                  role="checkbox"
                  aria-checked={isChecked}
                  onClick={(e) => toggleItem(item.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleItem(item.id, e);
                    }
                  }}
                  className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-emerald-50/60 border-emerald-200/90 text-emerald-950'
                      : 'bg-neutral-50/60 border-neutral-200/70 text-neutral-800 hover:bg-neutral-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-neutral-300 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`font-semibold text-xs sm:text-sm ${
                          isChecked ? 'line-through text-emerald-800/80' : 'text-neutral-900'
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.isCritical && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                          Must Have
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug line-clamp-1 sm:line-clamp-none">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Expand / Collapse Footer */}
          <div className="px-4 sm:px-5 py-2.5 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-neutral-700 hover:text-neutral-900 font-semibold inline-flex items-center gap-1 transition cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>
                    View all {displayedItems.length} {activeFilter === 'CRITICAL' ? 'critical' : ''} items
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>

            <span className="text-[11px] text-neutral-500 hidden sm:inline">
              Keep near front exit for fast evacuation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
