import { Check } from 'lucide-react';
import { Button, Chip } from '@/components/atoms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useState, useMemo, useCallback } from 'react';

interface FilterMultiSelectProps {
	value: string[];
	options: { value: string; label: string }[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	className?: string;
}

const FilterMultiSelect: React.FC<FilterMultiSelectProps> = ({
	value = [],
	options,
	onChange,
	placeholder = 'Select options...',
	searchPlaceholder = 'Search options...',
	className,
}) => {
	const [isOpen, setIsOpen] = useState(false);

	const selectedOptions = options.filter((option) => value.includes(option.value));

	// Check if all options are selected
	const isAllSelected = useMemo(() => {
		if (options.length === 0) return false;
		return options.every((option) => value.includes(option.value));
	}, [options, value]);

	// Handle select all checkbox
	const handleSelectAll = useCallback(
		(checked: boolean) => {
			if (checked) {
				// Select all: Add all options to the selection
				const allOptionValues = options.map((opt) => opt.value);
				onChange(allOptionValues);
			} else {
				// Deselect all: Clear all selections
				onChange([]);
			}
		},
		[options, onChange],
	);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button variant='outline' size='sm' className={cn(className, 'h-9 rounded-sm text-xs w-full justify-start font-normal')}>
					{value.length === 0 ? (
						<span className='truncate text-sm'>{placeholder}</span>
					) : (
						<Chip
							label={value.length > 1 ? `${value.length} selected` : selectedOptions[0]?.label}
							className='truncate bg-muted rounded-md'
						/>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-48 p-0'>
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>No options found.</CommandEmpty>
						{options.length > 0 && (
							<>
								{/* Select All Checkbox */}
								<div className='flex items-center gap-2 px-2 py-2 border-b bg-muted/20'>
									<Checkbox id='select-all-multi' checked={isAllSelected} onCheckedChange={handleSelectAll} className='h-4 w-4' />
									<label htmlFor='select-all-multi' className='text-sm font-medium leading-none cursor-pointer select-none flex-1'>
										Select all
									</label>
									<span className='text-xs text-muted-foreground'>{options.length} items</span>
								</div>

								<CommandGroup>
									{options.map((option) => (
										<CommandItem
											key={option.value}
											value={option.value}
											onSelect={() => {
												const newValue = value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value];
												onChange(newValue);
											}}>
											<span className='truncate'>{option.label}</span>
											<Check className={cn('ml-auto h-4 w-4', value.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
										</CommandItem>
									))}
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default FilterMultiSelect;
