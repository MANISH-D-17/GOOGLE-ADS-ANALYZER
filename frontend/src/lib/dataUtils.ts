export const getScaleMultiplier = (range: string): number => {
  switch (range) {
    case 'Today': return 1/30;
    case 'Yesterday': return 1/30;
    case 'Last 7d': return 7/30;
    case 'Last 30d': return 1;
    case 'Last 90d': return 3;
    default: return 1;
  }
};

export const getDateRangeString = (range: string): string => {
  const end = new Date(2026, 4, 5); // May 5, 2026 (based on dataset end)
  let start = new Date(end);
  
  switch (range) {
    case 'Today':
      break;
    case 'Yesterday':
      start.setDate(end.getDate() - 1);
      break;
    case 'Last 7d':
      start.setDate(end.getDate() - 7);
      break;
    case 'Last 30d':
      start.setDate(end.getDate() - 30);
      break;
    case 'Last 90d':
      start.setDate(end.getDate() - 90);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  const format = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  return `${format(start)} to ${format(end)}`;
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
