import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  FileText,
  Flame,
  Heart,
  Package,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { GoBagIcon } from '../icons/ResidentIcons';

export interface GoBagItem {
  id: string;
  category: 'HYDRATION' | 'FOOD' | 'MEDICAL' | 'POWER_LIGHT' | 'DOCUMENTS' | 'SANITATION';
  title: string;
  description: string;
  isCritical: boolean;
}

export const GO_BAG_ITEMS: GoBagItem[] = [
  {
    id: 'water',
    category: 'HYDRATION',
    title: 'Drinking Water (1 Gallon / Person / Day)',
    description: 'Minimum 3-day supply in sealed, durable bottles.',
    isCritical: true,
  },
  {
    id: 'food',
    category: 'FOOD',
    title: 'Non-Perishables & Ready-to-Eat Food',
    description: 'Canned meats, biscuits, high-energy bars, manual can opener.',
    isCritical: true,
  },
  {
    id: 'meds',
    category: 'MEDICAL',
    title: 'First Aid Kit & 7-Day Prescription Meds',
    description: 'Hypertension/asthma/insulin maintenance, antiseptic, gauze, paracetamol.',
    isCritical: true,
  },
  {
    id: 'docs',
    category: 'DOCUMENTS',
    title: 'Waterproof Pouch with Essential Documents & IDs',
    description: 'Govt IDs, birth certificates, deeds, insurance, sealed in ziplock.',
    isCritical: true,
  },
  {
    id: 'whistle',
    category: 'POWER_LIGHT',
    title: 'Emergency Whistle & High-Lumen Flashlight',
    description: 'High-decibel whistle to alert rescue teams and durable flashlight.',
    isCritical: true,
  },
  {
    id: 'powerbank',
    category: 'POWER_LIGHT',
    title: 'Power Bank, Spare Batteries & Charging Cables',
    description: 'Extra AA/AAA batteries, phone cables, and power bank for mobile comms.',
    isCritical: true,
  },
  {
    id: 'cash',
    category: 'DOCUMENTS',
    title: 'Emergency Cash in Small Bills & Coins',
    description: 'ATMs will be offline during grid power failure.',
    isCritical: true,
  },
  {
    id: 'masks',
    category: 'SANITATION',
    title: 'N95 Respirators & Dust Masks',
    description: 'Protection against volcanic ashfall, smoke, and mold spores.',
    isCritical: false,
  },
  {
    id: 'radio',
    category: 'POWER_LIGHT',
    title: 'Battery / Hand-Crank Emergency AM/FM Radio',
    description: 'Tune into NDRRMC / LGU civil defense broadcasts when cell towers fail.',
    isCritical: false,
  },
  {
    id: 'blanket',
    category: 'SANITATION',
    title: 'Thermal Blanket & Clean Dry Clothes',
    description: 'Prevent hypothermia during torrential monsoon rains and floods.',
    isCritical: false,
  },
  {
    id: 'sanitation',
    category: 'SANITATION',
    title: 'Personal Hygiene Kit, Wet Wipes & Sanitizer',
    description: 'Prevent waterborne leptospirosis, diarrhea, and infections.',
    isCritical: false,
  },
  {
    id: 'multitool',
    category: 'POWER_LIGHT',
    title: 'Multi-tool Pocket Knife & Duct Tape',
    description: 'General repairs, cutting ropes, sealing openings.',
    isCritical: false,
  },
];

export const STORAGE_KEY = 'resilia_gobag_checks_v1';

export const GoBagChecklistModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setCheckedIds(JSON.parse(saved));
        } else {
          // Default seed a few common items checked
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
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    const next = { ...checkedIds, [id]: !checkedIds[id] };
    setCheckedIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('resilia_gobag_updated', { detail: next }));
    } catch {}
  };

  const totalItems = GO_BAG_ITEMS.length;
  const packedCount = GO_BAG_ITEMS.filter((item) => checkedIds[item.id]).length;
  const criticalItems = GO_BAG_ITEMS.filter((item) => item.isCritical);
  const criticalPackedCount = criticalItems.filter((item) => checkedIds[item.id]).length;
  const percent = Math.round((packedCount / totalItems) * 100);

  const resetAll = () => {
    setCheckedIds({});
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('resilia_gobag_updated', { detail: {} }));
    } catch {}
  };

  const packAllCritical = () => {
    const updated: Record<string, boolean> = { ...checkedIds };
    criticalItems.forEach((item) => {
      updated[item.id] = true;
    });
    setCheckedIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('resilia_gobag_updated', { detail: updated }));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full border border-neutral-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-800 text-white flex items-center justify-center shadow-2xs">
              <GoBagIcon className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-white tracking-tight">72-Hour Evacuation Go-Bag</h3>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 text-[10px] font-mono uppercase tracking-wider">
                  NDRRMC Standard
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Essential emergency kit checklist • Available offline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Readiness Meter */}
        <div className="bg-amber-50/60 p-4 border-b border-amber-200/80 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold">
            <span className="text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Evacuation Readiness: {percent}% Packed ({packedCount}/{totalItems})
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                criticalPackedCount === criticalItems.length
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {criticalPackedCount === criticalItems.length
                ? 'All Critical Essentials Ready'
                : `${criticalItems.length - criticalPackedCount} Critical Missing`}
            </span>
          </div>

          <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <button
              onClick={packAllCritical}
              className="text-amber-800 hover:text-amber-950 font-bold underline"
            >
              Check All Critical Essentials
            </button>
            <button
              onClick={resetAll}
              className="text-neutral-500 hover:text-neutral-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>

        {/* Checklist */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2 text-xs">
          {GO_BAG_ITEMS.map((item) => {
            const isChecked = !!checkedIds[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                  isChecked
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-white'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isChecked
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-neutral-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-sm ${
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
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs">
          <span className="text-neutral-500 text-[11px]">
            Keep your Go-Bag within arm's reach near the front exit.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
