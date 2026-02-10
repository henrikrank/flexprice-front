import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components/ui';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getTypographyClass } from '@/lib/typography';
import { CalendarClock, AlertCircle } from 'lucide-react';

interface SubscriptionsByPlan {
	count: number;
	plan_name: string;
	plan_id: string;
}

interface RecentSubscriptionsCardProps {
	subscriptionsCount: number;
	subscriptionsByPlan: SubscriptionsByPlan[];
	isLoading: boolean;
	error?: Error | null;
}

export const RecentSubscriptionsCard: React.FC<RecentSubscriptionsCardProps> = ({
	subscriptionsCount,
	subscriptionsByPlan,
	isLoading,
	error,
}) => {
	return (
		<Card className='shadow-sm'>
			<CardHeader className='pb-8'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					<div>
						<CardTitle className={getTypographyClass('section-title', 'font-medium')}>Recent Subscriptions</CardTitle>
						<CardDescription className={getTypographyClass('helper-text', 'mt-1')}>Created in the last 7 days</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className='pt-0'>
				{isLoading ? (
					<div className='space-y-6 py-4'>
						<div className='space-y-2'>
							<Skeleton className='h-10 w-24' />
							<Skeleton className='h-4 w-32' />
						</div>
						<div className='space-y-3'>
							<Skeleton className='h-[180px] w-full rounded-lg' />
							<div className='flex gap-2 justify-center'>
								<Skeleton className='h-4 w-16' />
								<Skeleton className='h-4 w-16' />
								<Skeleton className='h-4 w-16' />
							</div>
						</div>
					</div>
				) : error ? (
					<div className='flex flex-col items-center justify-center py-8'>
						<AlertCircle className='h-8 w-8 text-red-500 mb-3' />
						<p className={getTypographyClass('body-small', 'text-center text-zinc-600')}>
							Failed to load subscription data. Please try again later.
						</p>
					</div>
				) : (
					<>
						<div className='mb-8'>
							<p className='text-4xl font-bold text-zinc-900'>{subscriptionsCount}</p>
							<p className={getTypographyClass('body-small', 'text-zinc-600 mt-2')}>New subscriptions</p>
						</div>
						{subscriptionsByPlan.length > 0 ? (
							<div>
								<ResponsiveContainer width='100%' height={180}>
									<PieChart>
										<Pie
											data={subscriptionsByPlan.map((item) => ({
												name: item.plan_name.length > 20 ? item.plan_name.substring(0, 20) + '...' : item.plan_name,
												value: item.count,
												fullName: item.plan_name,
											}))}
											cx='50%'
											cy='50%'
											innerRadius={40}
											outerRadius={70}
											paddingAngle={2}
											dataKey='value'>
											{subscriptionsByPlan.map((_, idx) => (
												<Cell key={`cell-${idx}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][idx % 6]} />
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: 'white',
												border: '1px solid #e5e7eb',
												borderRadius: '6px',
												padding: '8px 12px',
											}}
											formatter={(value: any, _name: any, props: any) => [
												`${value} subscription${value !== 1 ? 's' : ''}`,
												props.payload.fullName,
											]}
										/>
										<Legend
											verticalAlign='bottom'
											height={36}
											iconType='circle'
											wrapperStyle={{ paddingTop: '24px' }}
											formatter={(value) => <span className={getTypographyClass('helper-text', 'text-zinc-600')}>{value}</span>}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
						) : (
							<div className='flex flex-col items-center py-6'>
								<CalendarClock className='w-8 h-8 text-zinc-300 mb-3' />
								<p className={getTypographyClass('body-small', 'text-center text-zinc-400')}>
									No subscriptions created in the last 24 hours
								</p>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
};

export default RecentSubscriptionsCard;
