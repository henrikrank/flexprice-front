import { ApiDocsContent, FlatTabs } from '@/components/molecules';
import { Page } from '@/components/atoms';
import PaymentList from './PaymentList';
import WalletTransactionList from './WalletTransactionList';

const PaymentPage = () => {
	return (
		<Page heading='Payments'>
			<ApiDocsContent tags={['Payments', 'Auth']} />
			<FlatTabs
				tabs={[
					{
						value: 'payments',
						label: 'Payments',
						content: <PaymentList />,
					},
					{
						value: 'wallet-transactions',
						label: 'Wallet Transactions',
						content: <WalletTransactionList />,
					},
				]}
			/>
		</Page>
	);
};

export default PaymentPage;
