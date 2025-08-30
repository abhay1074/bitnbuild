import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { aiAnalyzer } from './ai-analysis';
import { storage } from './storage';

export interface WebSocketMessage {
  type: 'conflict_alert' | 'analysis_update' | 'heartbeat';
  data: any;
  timestamp: string;
}

export class ConflictMonitoringServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
    this.startRealTimeMonitoring();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected to conflict monitoring');
      this.clients.add(ws);

      // Send initial heartbeat
      this.sendToClient(ws, {
        type: 'heartbeat',
        data: { status: 'connected', clientCount: this.clients.size },
        timestamp: new Date().toISOString()
      });

      ws.on('close', () => {
        console.log('Client disconnected from conflict monitoring');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: WebSocketMessage) {
    this.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  private startRealTimeMonitoring() {
    // Monitor for new high-severity events every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        const recentEvents = await storage.getConflictEvents({
          limit: 50,
          severity: ['high', 'critical'],
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

        if (recentEvents.length > 0) {
          // Generate AI analysis for recent high-severity events
          const analysis = await aiAnalyzer.analyzeConflictEvents(recentEvents);
          
          this.broadcast({
            type: 'analysis_update',
            data: {
              analysis,
              eventCount: recentEvents.length,
              regions: Array.from(new Set(recentEvents.map(e => e.region).filter(Boolean)))
            },
            timestamp: new Date().toISOString()
          });

          // Check for critical events that need immediate alerts
          const criticalEvents = recentEvents.filter(e => e.severity === 'critical');
          for (const event of criticalEvents.slice(0, 3)) { // Limit to prevent spam
            const alert = await aiAnalyzer.generateConflictAlert(event);
            
            this.broadcast({
              type: 'conflict_alert',
              data: {
                event,
                alert,
                severity: event.severity,
                location: `${event.location}, ${event.country}`
              },
              timestamp: new Date().toISOString()
            });
          }
        }

        // Send heartbeat to keep connections alive
        this.broadcast({
          type: 'heartbeat',
          data: { 
            status: 'monitoring', 
            clientCount: this.clients.size,
            lastCheck: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Real-time monitoring error:', error);
      }
    }, 30000); // 30 seconds
  }

  public stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  public getClientCount(): number {
    return this.clients.size;
  }
}