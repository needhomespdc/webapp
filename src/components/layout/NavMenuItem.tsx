import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { RiArrowDownSLine } from 'react-icons/ri';
import { cn } from '@/lib/utils';
import type { NavItem } from './AppShell';

/**
 * One sidebar / mobile-menu entry. Items with `children` are parents (e.g. My Portfolio):
 * clicking opens the first child and expands the list; it stays expanded while a child route is open.
 */
export function NavMenuItem({
  item,
  onNavigate,
  idleClass = 'text-foreground/60',
}: {
  item: NavItem;
  onNavigate?: () => void;
  idleClass?: string;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const childActive = !!item.children?.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`));
  const [expanded, setExpanded] = useState(childActive);
  // Opens by itself when you land on one of its pages; the chevron then folds it away again
  const [prevChildActive, setPrevChildActive] = useState(childActive);
  if (childActive !== prevChildActive) {
    setPrevChildActive(childActive);
    if (childActive) setExpanded(true);
  }
  const open = expanded;

  const rowClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full',
      active ? 'bg-accent/15 text-accent' : cn(idleClass, 'hover:text-foreground hover:bg-foreground/5'),
    );

  if (!item.children?.length) {
    return (
      <NavLink to={item.to} onClick={onNavigate} className={({ isActive }) => rowClass(isActive)}>
        {({ isActive }) => (
          <>
            <span className="text-xl">{isActive && item.activeIcon ? item.activeIcon : item.icon}</span>
            <span>{item.label}</span>
          </>
        )}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          // From elsewhere: open the first sub-page. On one of its pages: just fold or unfold
          if (!childActive) {
            navigate(item.children![0].to);
            onNavigate?.();
          }
          setExpanded(childActive ? !expanded : true);
        }}
        className={rowClass(childActive)}
      >
        <span className="text-xl">{childActive && item.activeIcon ? item.activeIcon : item.icon}</span>
        <span className="flex-1 text-left">{item.label}</span>
        <RiArrowDownSLine className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-6 mt-1 mb-1 space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={child.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'block px-3 py-2.5 text-[13px] font-medium border-b border-foreground/5 last:border-0 transition-colors',
                  isActive ? 'text-accent' : cn(idleClass, 'hover:text-foreground'),
                )
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
