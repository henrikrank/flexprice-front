import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components/ui';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { getTypographyClass } from '@/lib/typography';

interface Invoice {
	amount_remaining?: number;
	amount_due?: number;
	currency?: string;
}

interface InvoicesByStatus {
	paid: Invoice[];
	failed: Invoice[];
	pending: Invoice[];
	processing: Invoice[];
	refunded: Invoice[];
}

interface InvoiceIssuesCardProps {
	invoicesByStatus: InvoicesByStatus;
	isLoading: boolean;
	error?: boolean;
}
export const InvoiceIssuesCard: React.FC<InvoiceIssuesCardProps> = ({ invoicesByStatus, isLoading, error }) => {
	return (
		<Card className='shadow-sm'>
			<CardHeader className='pb-8'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					<div>
						<CardTitle className={getTypographyClass('section-title', 'font-medium')}>Invoice Payment Status</CardTitle>
						<CardDescription className={getTypographyClass('helper-text', 'mt-1')}>Requires attention (last 7 days)</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className='pt-0'>
				{isLoading ? (
					<div className='space-y-3 py-4'>
						<Skeleton className='h-16 w-full' />
						<Skeleton className='h-16 w-full' />
						<Skeleton className='h-16 w-full' />
					</div>
				) : error ? (
					<div className='flex flex-col items-center justify-center py-8'>
						<AlertCircle className='h-8 w-8 text-red-500 mb-3' />
						<p className={getTypographyClass('body-small', 'text-center text-zinc-600')}>
							Failed to load invoice data. Please try again later.
						</p>
					</div>
				) : (
					<div className='space-y-3'>
						{/* Paid Invoices */}
						<div className='bg-white border border-zinc-200 rounded-lg p-4'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<CheckCircle className='w-5 h-5 text-green-600' />
									<p className={getTypographyClass('body-default', 'font-medium text-zinc-900')}>Paid</p>
								</div>
								<span className='text-2xl font-bold text-zinc-900'>{invoicesByStatus?.paid?.length || 0}</span>
							</div>
						</div>

						{/* Pending Payments */}
						<div className='bg-white border border-zinc-200 rounded-lg p-4'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<Clock className='w-5 h-5 text-yellow-600' />
									<p className={getTypographyClass('body-default', 'font-medium text-zinc-900')}>Pending</p>
								</div>
								<span className='text-2xl font-bold text-zinc-900'>{invoicesByStatus?.pending?.length || 0}</span>
							</div>
						</div>

						{/* Failed Payments */}
						<div className='bg-white border border-zinc-200 rounded-lg p-4'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<AlertCircle className='w-5 h-5 text-red-600' />
									<p className={getTypographyClass('body-default', 'font-medium text-zinc-900')}>Failed</p>
								</div>
								<span className='text-2xl font-bold text-zinc-900'>{invoicesByStatus?.failed?.length || 0}</span>
							</div>
						</div>

						{/* Processing Payments */}
						{(invoicesByStatus?.processing?.length || 0) > 0 && (
							<div className='bg-white border border-zinc-200 rounded-lg p-4'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<RefreshCw className='w-5 h-5 text-blue-600' />
										<p className={getTypographyClass('body-default', 'font-medium text-zinc-900')}>Processing</p>
									</div>
									<span className='text-2xl font-bold text-zinc-900'>{invoicesByStatus?.processing?.length || 0}</span>
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default InvoiceIssuesCard;
