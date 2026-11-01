// Investment model pills (Figma, Oct 2026): pale fill, dark text in light mode; translucent in dark mode
export const MODEL_BADGE: Record<string, string> = {
  co_development: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  fractional: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  land_banking: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  save_to_own: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  outright: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

// "Owned" column label in investment lists, per model (Nov 2026)
const OWNED_LABEL: Record<string, string> = {
  land_banking: 'Plots Owned',
  save_to_own: 'Plots Owned',
  co_development: 'Slots Owned',
  fractional: 'Slots Owned',
  outright: 'Units Owned',
};
export const ownedLabel = (type: string) => OWNED_LABEL[type] ?? 'Units Owned';
