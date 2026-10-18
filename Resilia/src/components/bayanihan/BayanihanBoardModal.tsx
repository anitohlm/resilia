/**
 * "Bayanihan" Community Mutual Aid Board
 * Hyper-Local Skills, Tools & Equipment Sharing Exchange
 *
 * Enables community members to share survival resources:
 * - OFFERS: Generator phone charging stations, chainsaws for fallen trees, water pumps, volunteer carpenters.
 * - REQUESTS: Nebulizer power, roof patching tarps, sump pumps for flooded basements.
 * - Filters by Purok / Sector and Category.
 * - Stored locally in IndexedDB with sync upon reconnection.
 */

import React, { useState, useEffect } from 'react';
import {
  BatteryCharging,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Hammer,
  HandHeart,
  HeartHandshake,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Search,
  Sparkles,
  Truck,
  User,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { MutualAidCategory, MutualAidPost, MutualAidStatus, MutualAidType } from '../../types';
import { MutualAidRepository } from '../../services/repositories';
import { useAuth } from '../../services/auth/authContext';

interface BayanihanBoardModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isInline?: boolean;
  onPostUpdated?: () => void;
}

const PUROK_SECTORS = [
  'All Sectors',
  'Purok 1 Malanday',
  'Purok 2 Malanday (High Ground)',
  'Purok 3 Malanday Riverside',
  'Purok 4 Tumana Dike Side',
  'Tumana North Riverbanks',
  'Concepcion Uno Hub',
];

export const BayanihanBoardModal: React.FC<BayanihanBoardModalProps> = ({
  isOpen = true,
  onClose,
  isInline = false,
  onPostUpdated,
}) => {
  const { currentUser } = useAuth();
  const isResident = currentUser.role === 'RESIDENT';
  const [posts, setPosts] = useState<MutualAidPost[]>([]);
  const [typeFilter, setTypeFilter] = useState<'ALL' | MutualAidType>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | MutualAidCategory>('ALL');
  const [selectedPurok, setSelectedPurok] = useState('All Sectors');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // New Post Form State
  const [postType, setPostType] = useState<MutualAidType>('OFFER');
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState<MutualAidCategory>('POWER_CHARGING');
  const [postPurok, setPostPurok] = useState('Purok 2 Malanday (High Ground)');
  const [postDesc, setPostDesc] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [contactName, setContactName] = useState(currentUser.name || 'Local Resident');
  const [contactPhone, setContactPhone] = useState(currentUser.phone || '+63 915 000 0000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPosts = async () => {
    try {
      const all = await MutualAidRepository.getAll();
      setPosts(all);
    } catch (e) {
      console.warn('Failed to load mutual aid posts:', e);
    }
  };

  useEffect(() => {
    if (isOpen || isInline) {
      loadPosts();
      setIsPosting(false);
    }
  }, [isOpen, isInline]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isResident) {
      alert('RBAC Violation: Only residents are authorized to create community mutual aid posts.');
      return;
    }
    if (!postTitle.trim() || !postDesc.trim()) return;

    setIsSubmitting(true);
    try {
      await MutualAidRepository.createPost(
        {
          title: postTitle.trim(),
          description: postDesc.trim(),
          type: postType,
          category: postCategory,
          purokSector: postPurok,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          locationDetails: locationDetails.trim() || undefined,
        },
        currentUser
      );

      await loadPosts();
      setIsPosting(false);
      resetForm();
      if (onPostUpdated) onPostUpdated();
    } catch (e: any) {
      console.warn('Create post failed:', e);
      alert(e?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPostTitle('');
    setPostDesc('');
    setLocationDetails('');
    setPostCategory('POWER_CHARGING');
    setPostType('OFFER');
  };

  const handleStatusChange = async (postId: string, newStatus: MutualAidStatus) => {
    try {
      await MutualAidRepository.updateStatus(postId, newStatus, currentUser, currentUser.name);
      await loadPosts();
      if (onPostUpdated) onPostUpdated();
    } catch (e) {
      console.warn('Status update failed:', e);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (selectedPurok !== 'All Sectors' && !p.purokSector.includes(selectedPurok.split(' ')[0])) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.purokSector.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!isInline && !isOpen) return null;

  const categoryIcon = (cat: MutualAidCategory) => {
    switch (cat) {
      case 'POWER_CHARGING':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'EQUIPMENT_TOOLS':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'SKILL_VOLUNTEER':
        return <Hammer className="w-4 h-4 text-emerald-500" />;
      case 'TRANSPORT':
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case 'FOOD_WATER':
        return <Package className="w-4 h-4 text-cyan-500" />;
      default:
        return <HeartHandshake className="w-4 h-4 text-rose-500" />;
    }
  };

  const modalBody = (
    <div
      className={`bg-white rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col ${
        isInline ? 'w-full min-h-[700px]' : 'max-w-4xl w-full max-h-[92vh] overflow-hidden'
      }`}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 bg-[#153B32] text-white flex items-center justify-between border-b border-[#1c4d42]">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center border border-white/10">
            <HeartHandshake className="w-5 h-5 text-emerald-300" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="bayanihan-title" className="text-base sm:text-lg font-black tracking-tight font-sans">
                "BAYANIHAN" MUTUAL AID EXCHANGE
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/20 text-white">
                Hyper-Local
              </span>
              {!isResident && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-400 text-neutral-900">
                  Read-Only ({currentUser.role})
                </span>
              )}
            </div>
            <p className="text-xs text-white/80">
              Community peer-to-peer sharing: generator charging, chainsaws, sump pumps & volunteers
            </p>
          </div>
        </div>

        {!isInline && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            aria-label="Close mutual aid modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 font-sans">
        {/* Top Controls: Filter by Type, Category, Sector & "+ Post Aid" */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Offer vs Request Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === 'ALL' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              ALL ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('OFFER')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === 'OFFER' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              OFFERS (I CAN SHARE)
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('REQUEST')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === 'REQUEST' ? 'bg-rose-600 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              REQUESTS (NEED HELP)
            </button>
          </div>

          {/* RBAC Protected Action: Only RESIDENT can author posts */}
          {isResident ? (
            <button
              type="button"
              onClick={() => setIsPosting(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>POST COMMUNITY AID</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-mono">
              <Users className="w-3.5 h-3.5 text-neutral-500" />
              <span>Resident-Only Board • Read-Only View for {currentUser.role}</span>
            </div>
          )}
        </div>

        {/* Secondary Filter: Sector Dropdown & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 font-mono text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools, generator, pump, carpenter..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedPurok}
              onChange={(e) => setSelectedPurok(e.target.value)}
              className="w-full sm:w-auto p-2 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
            >
              {PUROK_SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* New Post Form */}
          {isPosting ? (
            <form onSubmit={handleCreatePost} className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold uppercase text-neutral-900 flex items-center gap-2">
                  <HandHeart className="w-4 h-4 text-emerald-700" />
                  <span>Post Bayanihan Offer or Request</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsPosting(false)}
                  className="text-neutral-500 hover:text-neutral-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Post Type</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono font-bold"
                  >
                    <option value="OFFER">OFFER (I have tools / power / skill)</option>
                    <option value="REQUEST">REQUEST (I urgently need tools / help)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Category</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  >
                    <option value="POWER_CHARGING">Generator / Mobile Charging Station</option>
                    <option value="EQUIPMENT_TOOLS">Chainsaw, Sump Pump, Rope, Ladders</option>
                    <option value="SKILL_VOLUNTEER">Carpenter, Nurse, Electrician Volunteer</option>
                    <option value="TRANSPORT">Evac Transport / Boat / Truck</option>
                    <option value="FOOD_WATER">Surplus Potable Water / Warm Meals</option>
                    <option value="OTHER">Other Community Aid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold uppercase mb-1">Title *</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Free 3kW generator phone charging station at Purok 2"
                  className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Purok / Sector *</label>
                  <select
                    value={postPurok}
                    onChange={(e) => setPostPurok(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  >
                    {PUROK_SECTORS.filter((s) => s !== 'All Sectors').map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Specific Landmark / Spot</label>
                  <input
                    type="text"
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    placeholder="e.g. Yellow gate beside baker shop"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold uppercase mb-1">Description *</label>
                <textarea
                  rows={2}
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  placeholder="Details of availability, borrowing terms, fuel sharing, or urgent emergency requirements..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPosting(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 font-bold hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  {isSubmitting ? 'Posting...' : 'PUBLISH TO BAYANIHAN BOARD'}
                </button>
              </div>
            </form>
          ) : null}

          {/* Mutual Aid Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredPosts.map((p) => {
              const isOffer = p.type === 'OFFER';
              const isResolved = p.status === 'COMPLETED';

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border-2 transition-all bg-white relative space-y-3 ${
                    isResolved
                      ? 'border-neutral-200 opacity-60 bg-neutral-50'
                      : isOffer
                      ? 'border-emerald-200 hover:border-emerald-400 shadow-xs'
                      : 'border-rose-200 hover:border-rose-400 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          isOffer
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {p.type}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-neutral-500">
                        {categoryIcon(p.category)}
                        <span>{p.category.replace(/_/g, ' ')}</span>
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        p.status === 'COMPLETED'
                          ? 'bg-neutral-200 text-neutral-700'
                          : p.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-neutral-900 leading-snug">{p.title}</h4>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{p.description}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs font-mono space-y-1">
                    <div className="flex items-center gap-1.5 text-neutral-700">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="font-bold">{p.purokSector}</span>
                    </div>
                    {p.locationDetails && (
                      <p className="text-[11px] text-neutral-500 pl-5">Spot: {p.locationDetails}</p>
                    )}
                  </div>

                  {/* Contact & Status Controls */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-mono">
                    <div className="text-neutral-600">
                      <span className="font-bold">{p.contactName}</span> ·{' '}
                      <a href={`tel:${p.contactPhone}`} className="text-emerald-700 font-bold underline">
                        {p.contactPhone}
                      </a>
                    </div>

                    {p.status !== 'COMPLETED' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(p.id, 'COMPLETED')}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-[11px] transition-colors"
                      >
                        Mark Done ✓
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold text-[11px]">Fulfilled ✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPosts.length === 0 && (
            <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2 font-mono">
              <HeartHandshake className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs text-neutral-600">No mutual aid posts found for current filter.</p>
              {isResident && (
                <button
                  type="button"
                  onClick={() => setIsPosting(true)}
                  className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Post first aid exchange offer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
  );

  if (isInline) {
    return modalBody;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bayanihan-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      {modalBody}
    </div>
  );
};
