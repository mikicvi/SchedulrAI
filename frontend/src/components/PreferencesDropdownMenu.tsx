import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Settings2, Sun, Moon, Monitor, Type, TextQuote, Heading1, Heading2, Heading3, Check } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export function PreferencesDropdownMenuMenu() {
	const { setTheme } = useTheme();
	const [currentFontSize, setCurrentFontSize] = useState(() => localStorage.getItem('preferred-font-size') || '16px');

	const fontSizes = [
		{ name: 'Default', size: '16px', icon: TextQuote },
		{ name: 'Large', size: '18px', icon: Heading3 },
		{ name: 'X-Large', size: '20px', icon: Heading2 },
		{ name: 'XX-Large', size: '24px', icon: Heading1 },
	];

	useEffect(() => {
		const savedSize = localStorage.getItem('preferred-font-size');
		if (savedSize) {
			document.documentElement.style.fontSize = savedSize;
			setCurrentFontSize(savedSize);
		}
	}, []);

	const handleFontSizeChange = (size: string) => {
		document.documentElement.style.fontSize = size;
		localStorage.setItem('preferred-font-size', size);
		setCurrentFontSize(size);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='outline' size='icon'>
					<Settings2 className='h-[1.2rem] w-[1.2rem]' />
					<span className='sr-only'>Preferences Menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuLabel>Preferences</DropdownMenuLabel>
				<DropdownMenuSeparator />

				{/* Theme Sub-menu */}
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<Sun className='h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
						<Moon className='absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
						<span className='ml-2'>Theme</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent className='mr-1'>
						<DropdownMenuItem onClick={() => setTheme('light')}>
							<Sun className='h-4 w-4 mr-2' />
							Light
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme('dark')}>
							<Moon className='h-4 w-4 mr-2' />
							Dark
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme('system')}>
							<Monitor className='h-4 w-4 mr-2' />
							System
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				{/* Font Size Sub-menu */}
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<Type className='h-4 w-4 mr-2' />
						<span>Font Size</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent className='mr-1'>
						{fontSizes.map((font) => {
							const Icon = font.icon;
							const isSelected = currentFontSize === font.size;

							return (
								<DropdownMenuItem key={font.size} onSelect={() => handleFontSizeChange(font.size)}>
									<div className='flex items-center justify-between w-full'>
										<div className='flex items-center'>
											<Icon className='h-4 w-4 mr-2' />
											<span style={{ fontSize: font.size }}>{font.name}</span>
										</div>
										{isSelected && <Check className='h-4 w-4 ml-2' />}
									</div>
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
