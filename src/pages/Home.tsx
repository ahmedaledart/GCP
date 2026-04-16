import React from 'react';
import { Hero } from '../components/Hero';
import { TopCommodities } from '../components/TopCommodities';
import { AdvancedTable } from '../components/AdvancedTable';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { NewsSection } from '../components/NewsSection';
import { WhyChooseUs } from '../components/WhyChooseUs';

export const Home = () => {
  return (
    <>
      <Hero />
      <TopCommodities />
      <AdvancedTable />
      <AnalyticsCharts />
      <WhyChooseUs />
      <NewsSection />
    </>
  );
};
