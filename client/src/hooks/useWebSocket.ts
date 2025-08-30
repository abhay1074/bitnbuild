import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: 'conflict_alert' | 'analysis_update' | 'heartbeat';
  data: any;
  timestamp: string;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    const connect = () => {
      try {
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('Connected to conflict monitoring WebSocket');
          setIsConnected(true);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('Disconnected from conflict monitoring WebSocket');
          setIsConnected(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setTimeout(connect, 3000);
      }
    };

    const handleMessage = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'conflict_alert':
          toast({
            title: '🚨 Critical Conflict Alert',
            description: `${message.data.alert} - ${message.data.location}`,
            variant: 'destructive',
          });
          // Refresh conflict data
          queryClient.invalidateQueries({ queryKey: ['/api/conflict-events'] });
          queryClient.invalidateQueries({ queryKey: ['/api/conflict-stats'] });
          break;

        case 'analysis_update':
          toast({
            title: '🤖 AI Analysis Updated',
            description: `New insights available for ${message.data.eventCount} recent events`,
          });
          // Refresh AI analysis data
          queryClient.invalidateQueries({ queryKey: ['/api/ai-analysis'] });
          queryClient.invalidateQueries({ queryKey: ['/api/regional-analysis'] });
          break;

        case 'heartbeat':
          setClientCount(message.data.clientCount || 0);
          break;

        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient, toast]);

  return {
    isConnected,
    clientCount,
  };
}