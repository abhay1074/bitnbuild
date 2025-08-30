import { useMemo } from "react";
import { ConflictEvent, ConflictStats } from "@shared/schema";

interface DataVisualizationPanelProps {
  events: ConflictEvent[];
  stats?: ConflictStats;
}

export function DataVisualizationPanel({ events, stats }: DataVisualizationPanelProps) {
  // Generate timeline data for the last 30 days
  const timelineData = useMemo(() => {
    const days = 30;
    const data = [];
    const endDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.eventDate).toISOString().split('T')[0];
        return eventDate === dateStr;
      });
      
      data.push({
        date: dateStr,
        count: dayEvents.length,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return data;
  }, [events]);

  // Generate recent alerts from events
  const recentAlerts = useMemo(() => {
    const sorted = [...events]
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
      .slice(0, 4);
    
    return sorted.map(event => ({
      id: event.id,
      severity: event.severity,
      title: `${event.severity.charAt(0).toUpperCase() + event.severity.slice(1)} Event`,
      description: `${event.eventType} in ${event.location}`,
      timeAgo: getTimeAgo(new Date(event.eventDate)),
      fatalities: event.fatalities || 0,
    }));
  }, [events]);

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  const maxTimelineCount = Math.max(...timelineData.map(d => d.count), 1);

  return (
    <div className="h-64 bg-card border-t border-border p-4 overflow-x-auto" data-testid="data-panel">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Conflict Timeline Chart */}
        <div className="bg-background rounded-lg border border-border p-4" data-testid="timeline-chart">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Conflict Events Timeline (30 Days)
          </h3>
          <div className="h-32 relative">
            <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-between space-x-1">
              {timelineData.map((data, index) => (
                <div
                  key={data.date}
                  className="bg-destructive w-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ height: `${(data.count / maxTimelineCount) * 100}%` }}
                  title={`${data.displayDate}: ${data.count} events`}
                  data-testid={`timeline-bar-${index}`}
                />
              ))}
            </div>
            <div className="absolute bottom-0 left-0 w-full text-xs text-muted-foreground flex justify-between">
              <span>{timelineData[0]?.displayDate}</span>
              <span>{timelineData[Math.floor(timelineData.length / 2)]?.displayDate}</span>
              <span>{timelineData[timelineData.length - 1]?.displayDate}</span>
            </div>
          </div>
        </div>

        {/* Event Type Distribution */}
        <div className="bg-background rounded-lg border border-border p-4" data-testid="event-type-distribution">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Event Type Distribution
          </h3>
          <div className="space-y-2">
            {stats?.eventTypeCounts && Object.entries(stats.eventTypeCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 4)
              .map(([type, count]) => {
                const total = Object.values(stats.eventTypeCounts).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                  <div key={type} className="flex items-center justify-between" data-testid={`event-type-${type.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-destructive rounded"></div>
                      <span className="text-xs text-foreground truncate">{type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-destructive"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Recent Alert Feed */}
        <div className="bg-background rounded-lg border border-border p-4" data-testid="recent-alerts">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Recent Alerts
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="text-xs space-y-1" data-testid={`alert-${alert.id}`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full severity-${alert.severity}`}></div>
                  <span className="text-foreground font-medium">{alert.title}</span>
                  <span className="text-muted-foreground">{alert.timeAgo}</span>
                </div>
                <p className="text-muted-foreground ml-4">
                  {alert.description}
                  {alert.fatalities > 0 && ` - ${alert.fatalities} fatalities`}
                </p>
              </div>
            ))}
            
            {recentAlerts.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4" data-testid="no-alerts">
                No recent alerts available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
