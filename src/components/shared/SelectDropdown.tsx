import ReactSelect, { type GroupBase, type Props } from 'react-select';
import { cn } from '@/lib/utils';

export type SelectOption = { value: string; label: string };

export function SelectDropdown<
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
            'h-12 w-full rounded-xl border px-4 text-sm cursor-pointer transition-all duration-200 bg-foreground/10',
            isFocused
              ? 'border-transparent ring-2 ring-accent'
              : 'border-foreground/10'
          ),
        placeholder: () => 'text-foreground/40 text-sm',
        singleValue: () => 'text-foreground text-sm',
        input: () => 'text-foreground text-sm',
        valueContainer: () => 'h-full flex items-center gap-1 py-0',
        menu: () =>
          'mt-1.5 rounded-xl border border-foreground/10 bg-background shadow-xl overflow-hidden z-[99]',
        menuList: () => 'py-1',
        option: ({ isFocused, isSelected }) =>
          cn(
            'px-4 py-2.5 text-sm cursor-pointer transition-colors',
            isSelected
              ? 'bg-accent text-white'
              : isFocused
              ? 'bg-foreground/5 text-foreground'
              : 'text-foreground'
          ),
        indicatorsContainer: () => 'text-foreground/40 h-full flex items-center',
        dropdownIndicator: () => 'p-0 pl-1',
        clearIndicator: () => 'p-0 pr-1 hover:text-foreground',
        noOptionsMessage: () => 'text-foreground/40 text-sm py-3 text-center',
        loadingMessage: () => 'text-foreground/40 text-sm py-3 text-center',
      }}
    />
  );
}
