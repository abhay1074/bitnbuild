import { useState } from "react";
import { ConflictStats, ConflictFilters } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConflictSidebarProps {
  stats?: ConflictStats;
  hotspots: Array<{ country: string; region: string; eventCount: number; severity: string }>;
  filters: ConflictFilters;
  onFilterChange: (filters: ConflictFilters) => void;
  onFocusRegion: (country: string) => void;
  showMobile: boolean;
  onCloseMobile: () => void;
}

const severityLevels = [
  { id: 'critical', label: 'Critical (50+ fatalities)', color: 'severity-critical' },
  { id: 'high', label: 'High (10-49 fatalities)', color: 'severity-high' },
  { id: 'medium', label: 'Medium (1-9 fatalities)', color: 'severity-medium' },
  { id: 'low', label: 'Low (No fatalities)', color: 'severity-low' },
];

const eventTypes = [
  { id: 'Battles', label: 'Battles', icon: '💥' },
  { id: 'Explosions/Remote violence', label: 'Explosions/Remote violence', icon: '💣' },
  { id: 'Protests', label: 'Protests', icon: '✊' },
  { id: 'Violence against civilians', label: 'Violence against civilians', icon: '👤' },
  { id: 'Riots', label: 'Riots', icon: '🔥' },
  { id: 'Strategic developments', label: 'Strategic developments', icon: '📋' },
];

const timeRanges = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
];

export function ConflictSidebar({ 
  stats, 
  hotspots, 
  filters, 
  onFilterChange, 
  onFocusRegion, 
  showMobile, 
  onCloseMobile 
}: ConflictSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState("90d");

  const updateFilters = (updates: Partial<ConflictFilters>) => {
    onFilterChange({ ...filters, ...updates });
  };

  const handleSeverityChange = (severity: string, checked: boolean) => {
    const currentSeverities = filters.severity || [];
    const newSeverities = checked 
      ? [...currentSeverities, severity as any]
      : currentSeverities.filter(s => s !== severity);
    updateFilters({ severity: newSeverities });
  };

  const handleEventTypeChange = (eventType: string, checked: boolean) => {
    const currentTypes = filters.eventTypes || [];
    const newTypes = checked 
      ? [...currentTypes, eventType]
      : currentTypes.filter(t => t !== eventType);
    updateFilters({ eventTypes: newTypes });
  };

  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }
    
    updateFilters({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  const sidebarContent = (
    <div className="space-y-6" data-testid="sidebar-content">
      {/* Conflict Overview Stats */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground" data-testid="text-overview-title">
          Conflict Overview
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background p-3 rounded-lg border border-border" data-testid="stat-total-events">
            <div className="text-2xl font-bold text-destructive">
              {stats?.totalEvents?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-muted-foreground">Active Events</div>
          </div>
          <div className="bg-background p-3 rounded-lg border border-border" data-testid="stat-total-fatalities">
            <div className="text-2xl font-bold text-accent">
              {stats?.totalFatalities?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-muted-foreground">Total Fatalities</div>
          </div>
          <div className="bg-background p-3 rounded-lg border border-border" data-testid="stat-affected-countries">
            <div className="text-2xl font-bold text-primary">
              {stats?.affectedCountries || '0'}
            </div>
            <div className="text-xs text-muted-foreground">Countries</div>
          </div>
          <div className="bg-background p-3 rounded-lg border border-border" data-testid="stat-recent-events">
            <div className="text-2xl font-bold text-severity-medium">
              {stats?.recentEvents || '0'}
            </div>
            <div className="text-xs text-muted-foreground">Last 24h</div>
          </div>
        </div>
      </div>

      {/* Severity Filters */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground" data-testid="text-severity-title">
          Conflict Severity
        </h3>
        <div className="space-y-2">
          {severityLevels.map((level) => (
            <label key={level.id} className="flex items-center space-x-3 cursor-pointer" data-testid={`filter-severity-${level.id}`}>
              <Checkbox
                checked={filters.severity?.includes(level.id as any) || false}
                onCheckedChange={(checked) => handleSeverityChange(level.id, checked as boolean)}
              />
              <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
              <span className="text-sm text-foreground">{level.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {stats?.severityCounts?.[level.id as keyof typeof stats.severityCounts] || 0}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Event Type Filters */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground" data-testid="text-event-types-title">
          Event Types
        </h3>
        <div className="space-y-2">
          {eventTypes.map((type) => (
            <label key={type.id} className="flex items-center space-x-3 cursor-pointer" data-testid={`filter-event-type-${type.id.toLowerCase().replace(/\s+/g, '-')}`}>
              <Checkbox
                checked={filters.eventTypes?.includes(type.id) || false}
                onCheckedChange={(checked) => handleEventTypeChange(type.id, checked as boolean)}
              />
              <span className="text-sm w-4">{type.icon}</span>
              <span className="text-sm text-foreground">{type.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {stats?.eventTypeCounts?.[type.id] || 0}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Geographic Filters */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground" data-testid="text-geographic-title">
          Geographic Filter
        </h3>
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Search countries, regions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            data-testid="input-search-location"
          />
          
          <Select onValueChange={(value) => updateFilters({ region: value === "all" ? undefined : value })}>
            <SelectTrigger data-testid="select-region">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="Europe">Europe</SelectItem>
              <SelectItem value="Africa">Africa</SelectItem>
              <SelectItem value="Asia">Asia</SelectItem>
              <SelectItem value="Middle East">Middle East</SelectItem>
              <SelectItem value="Americas">Americas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground" data-testid="text-time-period-title">
          Time Period
        </h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => updateFilters({ startDate: e.target.value })}
              data-testid="input-start-date"
            />
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => updateFilters({ endDate: e.target.value })}
              data-testid="input-end-date"
            />
          </div>
          
          <div className="flex space-x-1">
            {timeRanges.map((range) => (
              <Button
                key={range.id}
                size="sm"
                variant={selectedTimeRange === range.id ? "default" : "secondary"}
                onClick={() => handleTimeRangeChange(range.id)}
                data-testid={`button-time-range-${range.id}`}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Hotspots */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground" data-testid="text-hotspots-title">
          Current Hotspots
        </h3>
        <div className="space-y-2">
          {hotspots.slice(0, 5).map((hotspot) => (
            <div
              key={hotspot.country}
              className="bg-background p-3 rounded-lg border border-border cursor-pointer hover:bg-background/80 transition-colors"
              onClick={() => onFocusRegion(hotspot.country)}
              data-testid={`hotspot-${hotspot.country.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">{hotspot.country}</div>
                  <div className="text-xs text-muted-foreground">{hotspot.region}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-destructive">{hotspot.eventCount}</div>
                  <div className={`w-2 h-2 rounded-full severity-${hotspot.severity}`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-80 bg-card border-r border-border p-4 overflow-y-auto hidden lg:block" data-testid="sidebar-desktop">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {showMobile && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" data-testid="sidebar-mobile-overlay">
          <div className="absolute right-0 top-0 w-80 h-full bg-card border-l border-border p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCloseMobile}
                data-testid="button-close-mobile-menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
