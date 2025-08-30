import { useQuery } from "@tanstack/react-query";
import { ConflictFilters } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, AlertTriangle, Shield, Eye } from "lucide-react";

interface ConflictAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  keyInsights: string[];
  recommendations: string[];
  emergingPatterns: string[];
  riskLevel: number;
}

interface RegionAnalysis {
  region: string;
  threatLevel: 'stable' | 'elevated' | 'high' | 'critical';
  trendDirection: 'improving' | 'stable' | 'worsening';
  keyFactors: string[];
  recommendation: string;
}

interface AIInsightsPanelProps {
  filters: ConflictFilters;
}

export function AIInsightsPanel({ filters }: AIInsightsPanelProps) {
  const { data: aiAnalysis, isLoading: analysisLoading } = useQuery<ConflictAnalysis>({
    queryKey: ['/api/ai-analysis', filters],
    enabled: true,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: regionalAnalysis, isLoading: regionalLoading } = useQuery<RegionAnalysis[]>({
    queryKey: ['/api/regional-analysis', filters],
    enabled: true,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'elevated': return 'bg-yellow-500';
      case 'stable': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'worsening': return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
      default: return <TrendingUp className="w-3 h-3 text-gray-500 rotate-90" />;
    }
  };

  return (
    <div className="space-y-4" data-testid="ai-insights-panel">
      {/* AI Global Analysis */}
      <Card className="bg-card/50 backdrop-blur-sm" data-testid="ai-analysis-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <Brain className="w-5 h-5 text-primary" />
            <span>AI Strategic Analysis</span>
            {analysisLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiAnalysis && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant={getSeverityColor(aiAnalysis.severity)} data-testid="ai-severity-badge">
                    {aiAnalysis.severity.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Risk Level: <span className="font-medium text-foreground" data-testid="ai-risk-level">{aiAnalysis.riskLevel}/10</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confidence: <span className="font-medium text-foreground" data-testid="ai-confidence">{Math.round(aiAnalysis.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              {aiAnalysis.keyInsights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>Key Insights</span>
                  </h4>
                  <div className="space-y-1">
                    {aiAnalysis.keyInsights.map((insight, index) => (
                      <div key={index} className="text-sm text-muted-foreground flex items-start space-x-2" data-testid={`ai-insight-${index}`}>
                        <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {aiAnalysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Recommendations</span>
                  </h4>
                  <div className="space-y-1">
                    {aiAnalysis.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm text-foreground bg-background/50 rounded p-2" data-testid={`ai-recommendation-${index}`}>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emerging Patterns */}
              {aiAnalysis.emergingPatterns.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Emerging Patterns</span>
                  </h4>
                  <div className="space-y-1">
                    {aiAnalysis.emergingPatterns.map((pattern, index) => (
                      <div key={index} className="text-sm text-accent" data-testid={`ai-pattern-${index}`}>
                        • {pattern}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {analysisLoading && (
            <div className="text-sm text-muted-foreground text-center py-4" data-testid="ai-analysis-loading">
              AI is analyzing current conflict patterns...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Analysis */}
      <Card className="bg-card/50 backdrop-blur-sm" data-testid="regional-analysis-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <TrendingUp className="w-5 h-5 text-accent" />
            <span>Regional AI Analysis</span>
            {regionalLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {regionalAnalysis && regionalAnalysis.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {regionalAnalysis.map((region, index) => (
                <div key={region.region} className="border border-border rounded-lg p-3" data-testid={`regional-analysis-${index}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h5 className="text-sm font-medium text-foreground">{region.region}</h5>
                      {getTrendIcon(region.trendDirection)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getThreatLevelColor(region.threatLevel)}`} />
                      <span className="text-xs text-muted-foreground capitalize">{region.threatLevel}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-foreground">{region.recommendation}</p>
                    {region.keyFactors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {region.keyFactors.slice(0, 3).map((factor, factorIndex) => (
                          <Badge key={factorIndex} variant="outline" className="text-xs" data-testid={`factor-${index}-${factorIndex}`}>
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : regionalLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4" data-testid="regional-analysis-loading">
              AI is analyzing regional trends...
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4" data-testid="no-regional-data">
              No regional data available for analysis
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}