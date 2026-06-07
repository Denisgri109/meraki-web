import { TrendingUp } from 'lucide-react';

const trendingTags = ['Balayage', 'Gel Nails', 'Lash Extensions', 'Facial', 'Braids', 'Microblading', 'Keratin', 'Waxing'];

const tagGradients = [
  'from-pink-400 to-rose-300',
  'from-violet-400 to-purple-300',
  'from-blue-400 to-cyan-300',
  'from-emerald-400 to-teal-300',
  'from-amber-400 to-orange-300',
  'from-indigo-400 to-blue-300',
  'from-rose-400 to-pink-300',
  'from-teal-400 to-emerald-300',
];

interface TrendingTagsProps {
  search: string;
  setSearch: (search: string) => void;
}

export function TrendingTags({ search, setSearch }: TrendingTagsProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center">
          <TrendingUp size={14} className="text-white" />
        </div>
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">Popular</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {trendingTags.map((tag, idx) => (
          <button
            key={tag}
            onClick={() => setSearch(tag)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-md ${
              search === tag
                ? `bg-gradient-to-r ${tagGradients[idx]} text-white shadow-lg`
                : 'bg-white text-[var(--color-text-secondary)] border border-[var(--color-border-light)] hover:border-pink-200 hover:text-pink-600'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
