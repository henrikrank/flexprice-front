import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MdClear } from 'react-icons/md';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
	label?: string;
	description?: string;
	error?: string;
	placeholder?: string;
	onChange?: (value: string[]) => void;
	disabled?: boolean;
	value: string[];
}

const MultichipField = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, label, value, description, error, onChange, placeholder, disabled, ...props }, ref) => {
		const [chips, setchips] = useState<string[]>(value || []);
		const [inputText, setinputText] = useState('');

		// Sync internal state with external value prop
		React.useEffect(() => {
			setchips(value || []);
		}, [value]);

		return (
			<div className='space-y-1 w-full'>
				{label && (
					<label htmlFor={props.id} className=' block text-sm font-medium text-zinc'>
						{label}
					</label>
				)}

				<div
					className={cn(
						'group flex flex-col min-h-10  items-center rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
						error ? 'border-destructive ring-destructive' : 'border-input focus-within:ring-ring focus-within:ring-offset-2',
						className,
					)}>
					<div className='flex w-full justify-start items-center flex-wrap gap-2'>
						{chips.map((chip, index) => (
							<span
								key={index}
								className='bg-[#F1F5F9] flex items-center justify-between text-background text-xs  cursor-pointer gap-2 rounded-md px-2 py-0 '>
								{chip}
								{!disabled && (
									<button
										className=' text-[#52525B] font-medium'
										onClick={() => {
											const updatedChips = chips.filter((_, i) => i !== index);
											setchips(updatedChips);
											onChange?.(updatedChips);
										}}>
										<MdClear />
									</button>
								)}
							</span>
						))}
						{!disabled && (
							<input
								disabled={disabled}
								aria-label='Add a chip'
								value={inputText}
								type={type}
								placeholder={chips.length > 0 ? '' : placeholder}
								className='peer flex-1 h-full bg-transparent  outline-none ring-0 focus:outline-none w-full'
								onChange={(e) => setinputText(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === ' ') {
										e.preventDefault();
										const trimmedText = inputText.trim();
										if (trimmedText && !chips.includes(trimmedText)) {
											const updatedChips = [...chips, trimmedText];
											setchips(updatedChips);
											onChange?.(updatedChips);
										}
										if (trimmedText) setinputText('');
									}
								}}
								ref={ref}
							/>
						)}
					</div>
				</div>

				{description && <p className='text-sm text-muted-foreground'>{description}</p>}
				{error && <p className='text-sm text-destructive'>{error}</p>}
			</div>
		);
	},
);

MultichipField.displayName = 'MultichipField';

export default MultichipField;
