'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarDays, Home, Settings, Sparkles } from 'lucide-react';

const ITEMS = [
  { href: '/today', label: 'Today', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/insights', label: 'Insights', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

/**
 * Floating cream glass pill with circular icon buttons. Active item is
 * burgundy with a cream icon and a soft glow; the indicator slides between
 * items with a spring. Bottom-centre on mobile, top-centre on desktop.
 */
export function FloatingNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center md:bottom-auto md:top-6"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/60 bg-surface/85 p-1.5 shadow-glow backdrop-blur-xl">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              title={label}
              className="relative flex h-11 w-11 items-center justify-center rounded-full"
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-burgundy shadow-nav-active"
                />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.4 : 2}
                className={`relative z-10 transition-colors duration-200 ${
                  active ? 'text-cream' : 'text-burgundy/70 hover:text-burgundy'
                }`}
              />
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
