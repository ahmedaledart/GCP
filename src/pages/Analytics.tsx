import React from 'react';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { useAuth } from '../context/AuthContext';
import { AccessRestricted } from '../components/AccessRestricted';

export const Analytics = () => {
  const { platformUser } = useAuth();
  
  if (platformUser?.approval_status !== 'approved' || !platformUser?.is_active) {
    return <AccessRestricted />;
  }

  return (
    <div className="py-8">
      <AnalyticsCharts />
    </div>
  );
};
