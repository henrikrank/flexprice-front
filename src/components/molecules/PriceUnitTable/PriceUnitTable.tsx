import { FC } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import { PriceUnit } from '@/models/PriceUnit';
import { ENTITY_STATUS } from '@/models';
import { ActionButton, Chip } from '@/components/atoms';
import formatChips from '@/utils/common/format_chips';
import formatDate from '@/utils/common/format_date';
import { PriceUnitApi } from '@/api/PriceUnitApi';

const formatConversionRate = (rate: string): string => {
	if (!rate) return '-';
	const numRate = parseFloat(rate);
	if (isNaN(numRate)) return '-';
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 8,
	}).format(numRate);
};

interface Props {
	data: PriceUnit[];
	onEdit?: (priceUnit: PriceUnit) => void;
}

const PriceUnitTable: FC<Props> = ({ data, onEdit }) => {
	const columnData: ColumnData<PriceUnit>[] = [
		{
			fieldName: 'name',
			title: 'Name',
		},
		{
			fieldName: 'code',
			title: 'Code',
		},
		{
			fieldName: 'symbol',
			title: 'Symbol',
		},
		{
			title: 'Base Currency',
			render: (row) => {
				return row?.base_currency?.toUpperCase() || '-';
			},
		},
		{
			title: 'Conversion Rate',
			render: (row) => {
				return formatConversionRate(row?.conversion_rate || '');
			},
		},
		{
			title: 'Status',
			render: (row) => {
				const label = formatChips(row?.status);
				return <Chip variant={label === 'Active' ? 'success' : 'default'} label={label} />;
			},
		},
		{
			title: 'Updated At',
			render: (row) => {
				return formatDate(row?.updated_at);
			},
		},
		{
			fieldVariant: 'interactive',
			render(row) {
				return (
					<ActionButton
						id={row?.id}
						deleteMutationFn={async () => {
							return await PriceUnitApi.DeletePriceUnit(row?.id);
						}}
						refetchQueryKey='fetchPriceUnits'
						entityName={row?.name}
						edit={{
							enabled: false,
							onClick: () => onEdit?.(row),
						}}
						archive={{
							enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
						}}
					/>
				);
			},
		},
	];

	return (
		<div>
			<FlexpriceTable data={data} columns={columnData} showEmptyRow />
		</div>
	);
};

export default PriceUnitTable;
