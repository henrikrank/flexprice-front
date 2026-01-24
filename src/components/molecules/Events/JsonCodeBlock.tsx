import { FC } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';

interface JsonCodeBlockProps {
	value: any;
	title?: string;
	onCopy?: () => void;
	className?: string;
}

const JsonCodeBlock: FC<JsonCodeBlockProps> = ({ value, title, onCopy, className }) => {
	const handleCopy = () => {
		if (onCopy) {
			onCopy();
		} else {
			navigator.clipboard.writeText(JSON.stringify(value ?? {}, null, 2));
			toast.success('Copied to clipboard!');
		}
	};

	return (
		<div className={cn('rounded-lg overflow-hidden border border-gray-200 bg-gray-50', className)}>
			{title && (
				<div className='px-4 py-2 border-b border-gray-200 bg-white flex items-center justify-between'>
					<p className='text-xs font-medium text-foreground'>{title}</p>
					<Button onClick={handleCopy} variant='ghost' size='sm' className='h-7'>
						<Copy size={12} className='mr-1' />
						<span className='text-xs'>Copy</span>
					</Button>
				</div>
			)}
			<div className='relative'>
				<Highlight theme={themes.nightOwl} code={JSON.stringify(value ?? {}, null, 2)} language='json'>
					{({ className, style, tokens, getLineProps, getTokenProps }) => (
						<pre className={cn(className, 'p-4 overflow-x-auto')} style={style}>
							{tokens.map((line, i) => (
								<div key={i} {...getLineProps({ line })}>
									{line.map((token, key) => (
										<span key={key} {...getTokenProps({ token })} className='text-sm font-normal font-fira-code' />
									))}
								</div>
							))}
						</pre>
					)}
				</Highlight>
			</div>
		</div>
	);
};

export default JsonCodeBlock;
