import { useState, useEffect, useCallback } from 'react';
import { 
  competitorApiService, 
  OverviewResponse, 
  KeywordIntel, 
  AdCreative, 
  BenchmarkReport, 
  AIRecommendation 
} from '../services/competitorApiService';

export const useCompetitorData = (domain?: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [keywords, setKeywords] = useState<KeywordIntel[]>([]);
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [comparison, setComparison] = useState<BenchmarkReport | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, keywordsData, creativesData, comparisonData, recommendationsData] = await Promise.all([
        competitorApiService.getOverview(domain),
        competitorApiService.getKeywords(domain),
        competitorApiService.getCreatives({ domain, limit: 12 }),
        competitorApiService.getComparison(domain),
        competitorApiService.getRecommendations(domain)
      ]);

      setOverview(overviewData);
      setKeywords(keywordsData.keywords);
      setCreatives(creativesData.ads);
      
      // Handle both single report and multiple reports return from comparison
      if ('benchmark' in comparisonData) {
        setComparison(comparisonData as BenchmarkReport);
      } else if ('reports' in comparisonData && (comparisonData as any).reports.length > 0) {
        // Use the first report if domain is not specified
        setComparison((comparisonData as any).reports[0]);
      }
      
      setRecommendations(recommendationsData.recommendations);
    } catch (err: any) {
      console.error('Error fetching competitor data:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    overview,
    keywords,
    creatives,
    comparison,
    recommendations,
    refetch: fetchData
  };
};
