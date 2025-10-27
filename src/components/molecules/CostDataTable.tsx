import React from 'react';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { CostAnalyticItem } from '@/types/dto/CostAnalytics';
import { formatNumber } from '@/utils/common';
import { createStableId } from '@/utils/cost-analytics';

interface CostDataTableProps {
	items: CostAnalyticItem[];
}

export const CostDataTable: React.FC<CostDataTableProps> = ({ items }) => {
	// Define table columns
	const columns: ColumnData<CostAnalyticItem>[] = [
		{
			title: 'Cost Attribute',
			render: (row: CostAnalyticItem) => {
				return <span>{row.meter_name || row.meter?.name || row.meter_id}</span>;
			},
		},
		{
			title: 'Total Quantity',
			render: (row: CostAnalyticItem) => {
				return <span>{formatNumber(parseFloat(row.total_quantity || '0'))}</span>;
			},
		},
		{
			title: 'Total Cost',
			render: (row: CostAnalyticItem) => {
				return (
					<span>
						{formatNumber(parseFloat(row.total_cost || '0'), 2)} {row.currency}
					</span>
				);
			},
		},
	];

	// Prepare data for the table with stable IDs
	const tableData = items.map((item) => ({
		...item,
		id: createStableId(item),
	}));

	return (
		<>
			<h1 className='text-lg font-medium text-gray-900 mb-4'>Cost Breakdown</h1>
			<FlexpriceTable columns={columns} data={tableData} showEmptyRow />
		</>
	);
};
