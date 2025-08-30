interface ConflictHeaderProps {
  onRefreshData: () => void;
  isRefreshing: boolean;
  lastUpdate?: string;
  isConnected?: boolean;
  clientCount?: number;
}

export function ConflictHeader({ onRefreshData, isRefreshing, lastUpdate, isConnected, clientCount }: ConflictHeaderProps) {
  const formatLastUpdate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <header className="bg-card border-b border-border px-4 py-3 lg:px-6" data-testid="header-main">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">
              Global Conflict Monitor
            </h1>
          </div>
          <div className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
            <span>ACLED API</span>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-severity-low animate-pulse' : 'bg-muted'}`} data-testid="status-indicator-live"></div>
            <span>{isConnected ? 'Live' : 'Offline'}</span>
            {clientCount && clientCount > 0 && (
              <span className="text-xs">({clientCount} monitoring)</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">Last Update:</span>
            <span className="text-foreground font-medium" data-testid="text-last-update">
              {formatLastUpdate(lastUpdate)}
            </span>
          </div>
          
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            data-testid="button-refresh"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isRefreshing ? "Refreshing..." : "Refresh Data"}</span>
          </button>
          
          <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground p-2 rounded-md transition-colors" data-testid="button-settings">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
