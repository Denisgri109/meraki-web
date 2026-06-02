import Link from 'next/link';

interface QuickAction {
  href: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
  img: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className={`group relative rounded-[var(--radius-xl)] overflow-hidden h-40 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 animate-slide-up stagger-${idx + 1}`}
            style={{ animationFillMode: 'both' }}
          >
            <img src={action.img} alt={action.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className={`absolute inset-0 bg-gradient-to-t ${action.gradient} opacity-30 group-hover:opacity-40 transition-opacity`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-sm font-bold text-white drop-shadow-md">{action.label}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
