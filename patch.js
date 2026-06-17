const fs = require('fs');
const code = fs.readFileSync('src/app/dashboard/discover/components/ProfessionalsGrid.tsx', 'utf-8');

const newCode = `import { useState } from 'react';
import { Users, Search, Heart, MapPin, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Master } from '../types';

interface ProfessionalsGridProps {
  loading: boolean;
  filtered: Master[];
  search: string;
  userCountry: string | null;
}

export function ProfessionalsGrid({ loading, filtered, search, userCountry }: ProfessionalsGridProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleToggleFavorite = (e: React.MouseEvent, masterId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(masterId)) {
        next.delete(masterId);
        showToast('Removed from favorites', 'info');
      } else {
        next.add(masterId);
        showToast('Added to favorites ❤️', 'success');
      }
      return next;
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl shimmer" />
                <div className="flex-1">
                  <div className="h-4 shimmer rounded w-2/3 mb-2" />
                  <div className="h-3 shimmer rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 shimmer rounded w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="glass-card p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-100/50 to-transparent rounded-bl-full" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-200 to-purple-200 flex items-center justify-center mx-auto mb-4 animate-float">
            <Search size={32} className="text-violet-400" />
          </div>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">No professionals found</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            {search
              ? 'Try adjusting your search query'
              : !userCountry
                ? 'Set your country in Settings → Profile to discover nearby professionals'
                : 'No professionals are available in your area yet. Try increasing your search radius in Settings.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((master, idx) => (
          <ProfessionalCard
            key={master.id}
            master={master}
            idx={idx}
            isFavorite={favorites.has(master.id)}
            onToggleFavorite={handleToggleFavorite}
            onClick={() => router.push(\`/dashboard/booking?masterId=\${master.id}\`)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center">
          <Users size={14} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Beauty Professionals</h2>
      </div>

      {renderContent()}
    </>
  );
}

interface ProfessionalCardProps {
  master: Master;
  idx: number;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, masterId: string) => void;
  onClick: () => void;
}

function ProfessionalCard({ master, idx, isFavorite, onToggleFavorite, onClick }: ProfessionalCardProps) {
  return (
    <div
      onClick={onClick}
      className={\`glass-card p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group relative animate-scale-in stagger-\${Math.min(idx + 1, 6)}\`}
      style={{ animationFillMode: 'both' }}
    >
      {/* Favorite Heart */}
      <button
        onClick={(e) => onToggleFavorite(e, master.id)}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white hover:scale-110 transition-all shadow-sm cursor-pointer"
      >
        <Heart size={16} className={isFavorite ? 'text-pink-500 fill-pink-500' : 'text-gray-300 hover:text-pink-400'} />
      </button>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg group-hover:scale-105 transition-transform">
          {master.avatar_url ? (
            <img src={master.avatar_url} alt={master.full_name || ''} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            master.full_name?.charAt(0) || '?'
          )}
        </div>
        <div>
          <p className="font-bold text-[var(--color-text-primary)] group-hover:text-violet-600 transition-colors">
            {master.full_name}
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">{master.specialties || 'Beauty Professional'}</p>
        </div>
      </div>

      {master.bio && (
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">{master.bio}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-light)]">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          {master.city && (
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-violet-400" />
              <span>{master.city}{master.country ? \`, \${master.country}\` : ''}</span>
            </div>
          )}
          {master.state && (
            <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 font-semibold text-[10px]">
              {master.state}
            </span>
          )}
        </div>
        <span className="text-xs font-bold text-violet-500 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all flex items-center gap-1">
          View <ArrowRight size={12} />
        </span>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/app/dashboard/discover/components/ProfessionalsGrid.tsx', newCode);
