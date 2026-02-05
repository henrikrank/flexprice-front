'use client';

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { defaultFilter } from 'cmdk';
import { CommandPaletteDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command-palette';

import { commandPaletteCommands, COMMAND_PALETTE_INITIAL_SUGGESTED_IDS, CommandPaletteGroup } from '@/config/commandPaletteCommands';

const GROUPS_ORDER = [CommandPaletteGroup.Actions, CommandPaletteGroup.GoTo];

const CommandPalette = () => {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const navigate = useNavigate();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		};
		const handleOpenPalette = () => setOpen(true);
		document.addEventListener('keydown', handleKeyDown);
		window.addEventListener('open-command-palette', handleOpenPalette);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('open-command-palette', handleOpenPalette);
		};
	}, []);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) setSearch('');
	};

	const commandsByGroup = useMemo(() => {
		const map = new Map<string, typeof commandPaletteCommands>();
		for (const cmd of commandPaletteCommands) {
			const list = map.get(cmd.group) ?? [];
			list.push(cmd);
			map.set(cmd.group, list);
		}
		return map;
	}, []);

	const suggestedIdsSet = useMemo(() => new Set(COMMAND_PALETTE_INITIAL_SUGGESTED_IDS), []);

	const suggestedValues = useMemo(() => {
		const set = new Set<string>();
		for (const cmd of commandPaletteCommands) {
			if (suggestedIdsSet.has(cmd.id)) {
				const value = [cmd.label, ...(cmd.keywords ?? [])].join(' ');
				set.add(value);
			}
		}
		return set;
	}, [suggestedIdsSet]);

	const filter = useMemo(
		() => (value: string, searchTerm: string) => {
			const trimmed = searchTerm?.trim() ?? '';
			if (trimmed === '') {
				return suggestedValues.has(value) ? 1 : 0;
			}
			return defaultFilter(value, trimmed);
		},
		[suggestedValues],
	);

	/** When search is empty, only show the minimal suggested commands. */
	// const commandsToShow = useMemo(() => {
	// 	const trimmed = search?.trim() ?? '';
	// 	if (trimmed === '') {
	// 		return commandPaletteCommands.filter((cmd) => suggestedIdsSet.has(cmd.id));
	// 	}
	// 	return commandPaletteCommands;
	// }, [search, suggestedIdsSet]);

	const handleSelect = (command: (typeof commandPaletteCommands)[number]) => {
		if (command.path) {
			navigate(command.path);
		}
		setOpen(false);
	};

	return (
		<CommandPaletteDialog open={open} onOpenChange={handleOpenChange} value={search} onValueChange={setSearch} filter={filter}>
			<CommandInput placeholder='Search features, plans, customers...' />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				{GROUPS_ORDER.map((groupName) => {
					const items = commandsByGroup.get(groupName);
					if (!items?.length) return null;
					return (
						<CommandGroup className='!font-normal' key={groupName} heading={groupName}>
							{items.map((command) => {
								const Icon = command.icon;
								const searchValue = [command.label, ...(command.keywords ?? [])].join(' ');
								return (
									<CommandItem
										key={command.id}
										value={searchValue}
										onSelect={() => handleSelect(command)}
										className='my-1 mx-2 p-2 !rounded-xl'>
										{Icon && <Icon className='!size-[11px] shrink-0 text-muted-foreground mx-2' />}
										<span className='!text-[13px] text-black/70 !font-normal'>{command.label}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>
					);
				})}
			</CommandList>
		</CommandPaletteDialog>
	);
};

export default CommandPalette;
