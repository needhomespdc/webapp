import ReactSelect, { type GroupBase, type Props } from 'react-select';
import { cn } from '@/lib/utils';

export type SelectOption = { value: string; label: string };

export function AppSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: Props<Option, IsMulti, Group>) {
  return (
    <ReactSelect
      {...props}
      unstyled
      classNames={{
        control: ({ isFocused }) =>
          cn(
            'min-h-10 rounded-xl border px-3 text-sm cursor-pointer transition-all bg-foreground/5',
            isFocused ? 'border-accent ring-2 ring-accent/20' : 'border-foreground/15'
          ),
        placeholder: () => 'text-foreground/40 text-sm',
        singleValue: () => 'text-foreground text-sm',
        input: () => 'text-foreground text-sm',
        menu: () =>
          'mt-1.5 rounded-xl border border-foreground/10 bg-background shadow-xl overflow-hidden z-[99]',
        menuList: () => 'py-1',
        option: ({ isFocused, isSelected }) =>
          cn(
            'px-3 py-2.5 text-sm cursor-pointer transition-colors',
            isSelected
              ? 'bg-accent text-white'
              : isFocused
              ? 'bg-foreground/5 text-foreground'
              : 'text-foreground'
          ),
        indicatorsContainer: () => 'text-foreground/40',
        dropdownIndicator: () => 'p-0 pl-1',
        clearIndicator: () => 'p-0 pr-1 hover:text-foreground',
        valueContainer: () => 'py-0 gap-1',
        noOptionsMessage: () => 'text-foreground/40 text-sm py-3 text-center',
      }}
    />
  );
}
