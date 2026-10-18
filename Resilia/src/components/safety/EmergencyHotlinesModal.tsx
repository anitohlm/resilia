import React, { useState } from 'react';
import {
  Copy,
  Check,
  Flame,
  MessageSquare,
  ShieldAlert,
  Waves,
  X,
  ExternalLink,
} from 'lucide-react';
import { EmergencyPhoneIcon } from '../icons/ResidentIcons';
import { useAuth } from '../../services/auth/authContext';

interface HotlineItem {
  name: string;
  agency: string;
  number: string;
  telUri: string;
  type: 'NATIONAL' | 'LGU' | 'MEDICAL' | 'FIRE_POLICE';
  badge: string;
}

const HOTLINES: HotlineItem[] = [
  {
    name: 'National Emergency Hotline',
    agency: 'Emergency 911 Philippines',
    number: '911',
    telUri: 'tel:911',
    type: 'NATIONAL',
    badge: 'Immediate Response',
  },
  {
    name: 'Marikina Rescue 161',
    agency: 'Marikina City CDRRMO Emergency Ops',
    number: '161 / (02) 8646-2436',
    telUri: 'tel:161',
    type: 'LGU',
    badge: 'Local River Rescue',
  },
  {
    name: 'Philippine Red Cross',
    agency: 'Emergency Medical & Blood Bank',
    number: '143 / (02) 8790-2300',
    telUri: 'tel:143',
    type: 'MEDICAL',
    badge: 'Ambulance & First Aid',
  },
  {
    name: 'Philippine National Police',
    agency: 'PNP Emergency Operations',
    number: '117 / (02) 8722-0650',
    telUri: 'tel:117',
    type: 'FIRE_POLICE',
    badge: 'Security & Order',
  },
  {
    name: 'Bureau of Fire Protection',
    agency: 'BFP Marikina Central Fire Station',
    number: '(02) 8646-0427',
    telUri: 'tel:0286460427',
    type: 'FIRE_POLICE',
    badge: 'Fire & Hazmat',
  },
  {
    name: 'Philippine Coast Guard',
    agency: 'PCG Search & Rescue Command',
    number: '(02) 8527-8481',
    telUri: 'tel:0285278481',
    type: 'NATIONAL',
    badge: 'Flood & Rubber Boats',
  },
  {
    name: 'PHIVOLCS Seismo-Volcano Duty',
    agency: 'DOST-PHIVOLCS 24/7 Operations',
    number: '(02) 8426-1468',
    telUri: 'tel:0284261468',
    type: 'NATIONAL',
    badge: 'Quake & Volcano Desk',
  },
];

export const EmergencyHotlinesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'HOTLINES' | 'SMS_GENERATOR'>('HOTLINES');

  // SMS Generator state
  const [senderName, setSenderName] = useState(currentUser.name || '');
  const [locationText, setLocationText] = useState(currentUser.locationName || 'Purok 4 Tumana Marikina');
  const [urgentNeed, setUrgentNeed] = useState('Critical flood water rising, need boat evacuation');
  const [headcount, setHeadcount] = useState('4');
  const [isTrapped, setIsTrapped] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const smsText = `RESILIA EMERGENCY SOS: ${senderName || 'Resident'}. Location: ${locationText}. Status: ${
    isTrapped ? 'TRAPPED / LIFE THREAT' : 'EVACUATING'
  }. Headcount: ${headcount} persons. Need: ${urgentNeed}. Please dispatch rescue.`;

  const smsUrl = `sms:911?body=${encodeURIComponent(smsText)}`;

  const handleCopySMS = () => {
    navigator.clipboard.writeText(smsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full border border-neutral-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-800 text-white flex items-center justify-center shadow-2xs">
              <EmergencyPhoneIcon className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-white tracking-tight">Emergency Hotlines & 1-Tap SOS</h3>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 text-[10px] font-mono uppercase tracking-wider">
                  Zero Data
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Direct cellular speed dial & preformatted offline SMS dispatch
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

        {/* Tab switch */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-4 pt-2.5 gap-2">
          <button
            onClick={() => setActiveTab('HOTLINES')}
            className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'HOTLINES'
                ? 'bg-white text-rose-700 border-rose-600 shadow-2xs'
                : 'text-neutral-500 border-transparent hover:text-neutral-800'
            }`}
          >
            <EmergencyPhoneIcon className="w-3.5 h-3.5" />
            <span>Speed-Dial Hotlines</span>
          </button>
          <button
            onClick={() => setActiveTab('SMS_GENERATOR')}
            className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'SMS_GENERATOR'
                ? 'bg-white text-rose-700 border-rose-600 shadow-2xs'
                : 'text-neutral-500 border-transparent hover:text-neutral-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Pre-Formatted SMS SOS (No Internet)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs">
          {activeTab === 'HOTLINES' ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-900 text-xs leading-relaxed">
                <span className="font-semibold">Cellular Voice Redundancy:</span> Tapping any hotline initiates direct mobile carrier calling without needing internet or Wi-Fi.
              </div>

              {HOTLINES.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/60 hover:bg-white transition flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 text-xs sm:text-sm">{item.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wide bg-neutral-200/80 text-neutral-700 border border-neutral-300">
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500">{item.agency}</div>
                    <div className="font-mono font-bold text-rose-700 text-xs tabular-nums">{item.number}</div>
                  </div>

                  <a
                    href={item.telUri}
                    className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition flex items-center gap-1.5 shrink-0"
                  >
                    <EmergencyPhoneIcon className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <span className="font-semibold">Offline SMS Fallback:</span> When 4G/5G data is down, 2G SMS text messages often still transmit. Generate and send this pre-formatted distress dispatch with one tap.
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-neutral-800 block mb-1">Your Name</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-neutral-800 block mb-1">Headcount Needing Rescue</label>
                    <input
                      type="number"
                      value={headcount}
                      onChange={(e) => setHeadcount(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">Location / Landmarks</label>
                  <input
                    type="text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">Critical Need Description</label>
                  <input
                    type="text"
                    value={urgentNeed}
                    onChange={(e) => setUrgentNeed(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-rose-200 bg-rose-50/50">
                  <input
                    type="checkbox"
                    id="trappedCheck"
                    checked={isTrapped}
                    onChange={(e) => setIsTrapped(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <label htmlFor="trappedCheck" className="text-xs font-semibold text-rose-950 cursor-pointer">
                    Flag as Immediate Life Threat / Trapped (Roof, Water, Collapsed Structure)
                  </label>
                </div>

                {/* Formatted SMS Preview */}
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Generated SMS Message Payload:</label>
                  <div className="bg-neutral-900 text-emerald-400 font-mono text-[11px] p-3 rounded-lg border border-neutral-800 break-words leading-relaxed select-all">
                    {smsText}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href={smsUrl}
                    className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-center shadow-2xs transition flex items-center justify-center gap-2 text-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send SMS via Phone Carrier</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopySMS}
                    className="px-4 py-2.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-800 font-semibold transition flex items-center justify-center gap-2 border border-neutral-200 shadow-2xs text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy SMS Text'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
