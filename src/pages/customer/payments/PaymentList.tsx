import { useQuery } from '@tanstack/react-query';
import PaymentApi from '@/api/PaymentApi';
import usePagination from '@/hooks/usePagination';
import { Loader, ShortPagination } from '@/components/atoms';
import toast from 'react-hot-toast';
import { InvoicePaymentsTable } from '@/components/molecules';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/constants/guides';

const PaymentList = () => {
	const { limit, offset, page } = usePagination();

	const {
		data: payments,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['payments', page],
		queryFn: () => PaymentApi.getAllPayments({ limit, offset }),
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching payments');
		return null;
	}

	if ((payments?.items ?? []).length === 0) {
		return (
			<EmptyPage
				heading='Payments'
				emptyStateCard={{
					heading: 'Record Your First Payment',
					description: 'Add a payment record to manage customer charges and settlements.',
				}}
				tutorials={GUIDES.payments.tutorials}
				tags={['Payments']}
			/>
		);
	}

	return (
		<div>
			<InvoicePaymentsTable data={payments?.items ?? []} />
			<ShortPagination unit='Payments' totalItems={payments?.pagination.total ?? 0} />
		</div>
	);
};

export default PaymentList;
