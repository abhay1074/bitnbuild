import OpenAI from "openai";
import { ConflictEvent, ConflictStats } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ConflictAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  keyInsights: string[];
  recommendations: string[];
  emergingPatterns: string[];
  riskLevel: number; // 1-10 scale
}

export interface RegionAnalysis {
  region: string;
  threatLevel: 'stable' | 'elevated' | 'high' | 'critical';
  trendDirection: 'improving' | 'stable' | 'worsening';
  keyFactors: string[];
  recommendation: string;
}

export class ConflictAIAnalyzer {
  async analyzeConflictEvents(events: ConflictEvent[]): Promise<ConflictAnalysis> {
    if (events.length === 0) {
      return {
        severity: 'low',
        confidence: 1.0,
        keyInsights: ['No conflict events to analyze'],
        recommendations: ['Continue monitoring for emerging threats'],
        emergingPatterns: [],
        riskLevel: 1
      };
    }

    const prompt = `Analyze the following conflict data and provide strategic insights:

${events.slice(0, 50).map(event => 
  `- ${event.eventDate}: ${event.eventType} in ${event.location}, ${event.country} (${event.fatalities || 0} fatalities, ${event.severity} severity)`
).join('\n')}

Total events: ${events.length}
Time period: ${events.length > 0 ? `${new Date(events[events.length - 1].eventDate).toDateString()} to ${new Date(events[0].eventDate).toDateString()}` : 'No data'}

Provide analysis in JSON format:
{
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "keyInsights": ["insight1", "insight2", "insight3"],
  "recommendations": ["recommendation1", "recommendation2"],
  "emergingPatterns": ["pattern1", "pattern2"],
  "riskLevel": 1-10
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a strategic conflict analysis expert. Analyze conflict data patterns, identify emerging threats, and provide actionable insights for decision makers. Focus on geographical patterns, escalation risks, and strategic implications."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        severity: analysis.severity || 'low',
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        keyInsights: Array.isArray(analysis.keyInsights) ? analysis.keyInsights : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
        emergingPatterns: Array.isArray(analysis.emergingPatterns) ? analysis.emergingPatterns : [],
        riskLevel: Math.max(1, Math.min(10, analysis.riskLevel || 5))
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return {
        severity: 'medium',
        confidence: 0.3,
        keyInsights: ['Analysis temporarily unavailable due to AI service error'],
        recommendations: ['Continue monitoring manually'],
        emergingPatterns: [],
        riskLevel: 5
      };
    }
  }

  async analyzeRegionalTrends(events: ConflictEvent[]): Promise<RegionAnalysis[]> {
    // Group events by region
    const regionGroups = new Map<string, ConflictEvent[]>();
    events.forEach(event => {
      const region = event.region || 'Unknown';
      if (!regionGroups.has(region)) {
        regionGroups.set(region, []);
      }
      regionGroups.get(region)!.push(event);
    });

    const analyses: RegionAnalysis[] = [];

    for (const [region, regionEvents] of Array.from(regionGroups.entries())) {
      if (regionEvents.length === 0) continue;

      const prompt = `Analyze regional conflict trends for ${region}:

Recent events (${regionEvents.length} total):
${regionEvents.slice(0, 20).map((event: ConflictEvent) => 
  `- ${new Date(event.eventDate).toDateString()}: ${event.eventType} in ${event.location}, ${event.country} (${event.fatalities || 0} fatalities)`
).join('\n')}

Provide regional analysis in JSON format:
{
  "threatLevel": "stable|elevated|high|critical",
  "trendDirection": "improving|stable|worsening",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "recommendation": "brief actionable recommendation"
}`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            {
              role: "system",
              content: "You are a regional security analyst. Assess conflict trends, identify escalation patterns, and provide strategic recommendations for each region."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 500
        });

        const analysis = JSON.parse(response.choices[0].message.content || '{}');
        
        analyses.push({
          region,
          threatLevel: analysis.threatLevel || 'stable',
          trendDirection: analysis.trendDirection || 'stable',
          keyFactors: Array.isArray(analysis.keyFactors) ? analysis.keyFactors : [],
          recommendation: analysis.recommendation || 'Continue monitoring'
        });
      } catch (error) {
        console.error(`Regional Analysis Error for ${region}:`, error);
        analyses.push({
          region,
          threatLevel: 'stable',
          trendDirection: 'stable',
          keyFactors: ['Analysis unavailable'],
          recommendation: 'Continue monitoring'
        });
      }
    }

    return analyses;
  }

  async generateConflictAlert(event: ConflictEvent): Promise<string> {
    const prompt = `Generate a concise conflict alert for this event:

Event: ${event.eventType}
Location: ${event.location}, ${event.country}
Date: ${new Date(event.eventDate).toDateString()}
Fatalities: ${event.fatalities || 0}
Actors: ${event.actor1 || 'Unknown'}${event.actor2 ? ` vs ${event.actor2}` : ''}
Severity: ${event.severity}

Generate a professional 1-2 sentence alert for emergency responders and decision makers.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an emergency alert system. Generate clear, concise conflict alerts for decision makers. Focus on actionable information and immediate implications."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 100
      });

      return response.choices[0].message.content || `${event.severity.toUpperCase()} conflict event reported in ${event.location}, ${event.country}`;
    } catch (error) {
      console.error('Alert Generation Error:', error);
      return `${event.severity.toUpperCase()} conflict event reported in ${event.location}, ${event.country}`;
    }
  }
}

export const aiAnalyzer = new ConflictAIAnalyzer();