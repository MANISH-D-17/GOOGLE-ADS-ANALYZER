export const getScaleMultiplier = (range: string) => {
  switch (range) {
    case 'Today': return 0.034;
    case 'Yesterday': return 0.031;
    case 'Last 7d': return 0.23;
    case 'Last 30d': return 1;
    case 'Last 90d': return 2.85;
    default: return 1;
  }
};

export const scaleMetrics = <T extends { spend: number; revenue: number; conversions: number; impressions?: number; clicks?: number }>(data: T, multiplier: number): T => {
  return {
    ...data,
    spend: data.spend * multiplier,
    revenue: data.revenue * multiplier,
    conversions: data.conversions * multiplier,
    impressions: data.impressions !== undefined ? data.impressions * multiplier : undefined,
    clicks: data.clicks !== undefined ? data.clicks * multiplier : undefined,
  };
};
