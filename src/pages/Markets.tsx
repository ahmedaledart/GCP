import React from 'react';
import { AdvancedTable } from '../components/AdvancedTable';
import { TopCommodities } from '../components/TopCommodities';

export const Markets = () => {
  return (
    <div className="py-8">
      <TopCommodities />
      <AdvancedTable />
    </div>
  );
};
