import { useState, useEffect } from "react";
import { ConflictEvent } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface ConflictMapProps {
  events: ConflictEvent[];
  selectedEvent?: ConflictEvent;
  onEventSelect: (eventId: string) => void;
  onEventDeselect: () => void;
  isLoading: boolean;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  severity: string;
  event: ConflictEvent;
}

export function ConflictMap({ 
  events, 
  selectedEvent, 
  onEventSelect, 
  onEventDeselect, 
  isLoading 
}: ConflictMapProps) {
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const markers = events.map(event => ({
      id: event.id,
      lat: parseFloat(event.latitude),
      lng: parseFloat(event.longitude),
      severity: event.severity,
      event,
    }));
    setMapMarkers(markers);
  }, [events]);

  useEffect(() => {
    setShowPopup(!!selectedEvent);
  }, [selectedEvent]);

  const handleMarkerClick = (marker: MapMarker, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    onEventSelect(marker.id);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    onEventDeselect();
  };

  const getSeveritySize = (severity: string) => {
    switch (severity) {
      case 'critical': return 'w-4 h-4';
      case 'high': return 'w-3 h-3';
      case 'medium': return 'w-2 h-2';
      default: return 'w-2 h-2';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex-1 relative map-container" data-testid="map-container">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center" data-testid="loading-overlay">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="text-sm text-muted-foreground">Loading conflict data...</div>
          </div>
        </div>
      )}

      {/* Map container with world map background */}
      <div 
        className="w-full h-full bg-cover bg-center relative"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1446776877081-d282a0f896e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
        }}
        data-testid="map-background"
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]"></div>
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-20 space-y-2" data-testid="map-controls">
          <Button size="sm" variant="secondary" data-testid="button-zoom-in">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Button>
          <Button size="sm" variant="secondary" data-testid="button-zoom-out">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
          </Button>
          <Button size="sm" variant="secondary" data-testid="button-reset-view">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 z-20" data-testid="map-legend">
          <h4 className="text-sm font-semibold text-foreground mb-3">Conflict Severity</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full severity-critical"></div>
              <span className="text-xs text-foreground">Critical (50+ fatalities)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full severity-high"></div>
              <span className="text-xs text-foreground">High (10-49)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full severity-medium"></div>
              <span className="text-xs text-foreground">Medium (1-9)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full severity-low"></div>
              <span className="text-xs text-foreground">Low (No fatalities)</span>
            </div>
          </div>
        </div>

        {/* Conflict markers positioned on the map */}
        {mapMarkers.map((marker) => {
          // Convert lat/lng to approximate pixel positions (this is a simplified approach)
          // In a real application, you would use a proper mapping library like React-Leaflet
          const x = ((marker.lng + 180) / 360) * 100;
          const y = ((90 - marker.lat) / 180) * 100;
          
          return (
            <div
              key={marker.id}
              className={`absolute conflict-marker ${getSeveritySize(marker.severity)} z-10 severity-${marker.severity}`}
              style={{ 
                left: `${x}%`, 
                top: `${y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => handleMarkerClick(marker, e)}
              data-testid={`conflict-marker-${marker.id}`}
            >
              <div className={`pulse absolute inset-0 rounded-full severity-${marker.severity} opacity-50`}></div>
            </div>
          );
        })}

        {/* Event Details Popup */}
        {showPopup && selectedEvent && (
          <div 
            className="absolute bg-card border border-border rounded-lg p-4 shadow-xl z-30 w-80"
            style={{
              left: `${popupPosition.x}px`,
              top: `${popupPosition.y - 200}px`,
              transform: 'translateX(-50%)'
            }}
            data-testid="event-popup"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground" data-testid="popup-title">
                  {selectedEvent.eventType} in {selectedEvent.location}
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClosePopup}
                  data-testid="button-close-popup"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-foreground" data-testid="popup-date">
                    {formatDate(selectedEvent.eventDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-foreground" data-testid="popup-location">
                    {selectedEvent.location}, {selectedEvent.country}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Type:</span>
                  <span className="text-foreground" data-testid="popup-event-type">
                    {selectedEvent.eventType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fatalities:</span>
                  <span className="text-destructive font-medium" data-testid="popup-fatalities">
                    {selectedEvent.fatalities || 0}
                  </span>
                </div>
                {selectedEvent.actor1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actors:</span>
                    <span className="text-foreground text-right" data-testid="popup-actors">
                      {selectedEvent.actor1}
                      {selectedEvent.actor2 && ` vs. ${selectedEvent.actor2}`}
                    </span>
                  </div>
                )}
              </div>
              
              {selectedEvent.notes && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground" data-testid="popup-notes">
                    {selectedEvent.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
