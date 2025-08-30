import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConflictHeader } from "@/components/conflict-header";
import { ConflictSidebar } from "@/components/conflict-sidebar";
import { ConflictMap } from "@/components/conflict-map";
import { DataVisualizationPanel } from "@/components/data-visualization-panel";
import { AIInsightsPanel } from "@/components/ai-insights-panel";
import { ConflictFilters, ConflictEvent, ConflictStats } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ConflictFilters>({ limit: 1000 });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isConnected, clientCount } = useWebSocket();

  // Fetch conflict events
  const { data: events = [], isLoading: eventsLoading } = useQuery<ConflictEvent[]>({
    queryKey: ['/api/conflict-events', filters],
    enabled: true,
  });

  // Fetch conflict statistics
  const { data: stats } = useQuery<ConflictStats>({
    queryKey: ['/api/conflict-stats', filters],
    enabled: true,
  });

  // Fetch hotspots
  const { data: hotspots = [] } = useQuery<Array<{ country: string; region: string; eventCount: number; severity: string }>>({
    queryKey: ['/api/conflict-hotspots'],
    enabled: true,
  });

  // Fetch selected event details
  const { data: selectedEvent } = useQuery<ConflictEvent>({
    queryKey: ['/api/conflict-events', selectedEventId],
    enabled: !!selectedEventId,
  });

  // Refresh data mutation
  const refreshMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/refresh-data'),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conflict-events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conflict-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conflict-hotspots'] });
      toast({
        title: "Data refreshed successfully",
        description: `Loaded ${data.eventsLoaded || 0} new events from ACLED API`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to refresh data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRefreshData = () => {
    refreshMutation.mutate();
  };

  const handleFilterChange = (newFilters: ConflictFilters) => {
    setFilters(newFilters);
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleEventDeselect = () => {
    setSelectedEventId(null);
  };

  const handleFocusRegion = (country: string) => {
    setFilters(prev => ({
      ...prev,
      countries: [country],
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <ConflictHeader
        onRefreshData={handleRefreshData}
        isRefreshing={refreshMutation.isPending}
        lastUpdate={undefined}
        isConnected={isConnected}
        clientCount={clientCount}
        data-testid="conflict-header"
      />
      
      <div className="flex flex-1 h-[calc(100vh-73px)]">
        <ConflictSidebar
          stats={stats}
          hotspots={hotspots}
          filters={filters}
          onFilterChange={handleFilterChange}
          onFocusRegion={handleFocusRegion}
          showMobile={showMobileMenu}
          onCloseMobile={() => setShowMobileMenu(false)}
          data-testid="conflict-sidebar"
        />
        
        <main className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <ConflictMap
              events={events}
              selectedEvent={selectedEvent}
              onEventSelect={handleEventSelect}
              onEventDeselect={handleEventDeselect}
              isLoading={eventsLoading}
              data-testid="conflict-map"
            />
            
            <DataVisualizationPanel
              events={events}
              stats={stats}
              data-testid="data-visualization-panel"
            />
          </div>
          
          {/* AI Insights Panel */}
          <div className="w-80 bg-card border-l border-border p-4 overflow-y-auto" data-testid="ai-insights-sidebar">
            <AIInsightsPanel filters={filters} />
          </div>
        </main>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setShowMobileMenu(true)}
        className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-3 rounded-full shadow-lg lg:hidden z-50"
        data-testid="button-mobile-menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>
    </div>
  );
}
