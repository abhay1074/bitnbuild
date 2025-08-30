import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { conflictFiltersSchema, type ConflictFilters } from "@shared/schema";
import { aiAnalyzer } from "./ai-analysis";
import { z } from "zod";

// ACLED API configuration
const ACLED_BASE_URL = 'https://api.acleddata.com/acled/read';
const ACLED_EMAIL = process.env.ACLED_EMAIL || '';
const ACLED_KEY = process.env.ACLED_KEY || '';

interface ACLEDEvent {
  data_date: string;
  event_date: string;
  country: string;
  region: string;
  location: string;
  latitude: string;
  longitude: string;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  actor2: string;
  fatalities: string;
  notes: string;
  source: string;
  source_scale: string;
}

function determineSeverity(fatalities: number): 'low' | 'medium' | 'high' | 'critical' {
  if (fatalities >= 50) return 'critical';
  if (fatalities >= 10) return 'high';
  if (fatalities >= 1) return 'medium';
  return 'low';
}

function convertACLEDEvent(acledEvent: ACLEDEvent) {
  const fatalities = parseInt(acledEvent.fatalities) || 0;
  return {
    eventDate: new Date(acledEvent.event_date),
    country: acledEvent.country,
    region: acledEvent.region,
    location: acledEvent.location,
    latitude: acledEvent.latitude,
    longitude: acledEvent.longitude,
    eventType: acledEvent.event_type,
    subEventType: acledEvent.sub_event_type,
    actor1: acledEvent.actor1,
    actor2: acledEvent.actor2,
    fatalities,
    notes: acledEvent.notes,
    source: acledEvent.source,
    sourceScale: acledEvent.source_scale,
    severity: determineSeverity(fatalities),
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get conflict events with filtering
  app.get("/api/conflict-events", async (req, res) => {
    try {
      // Use safe parsing with defaults
      const filters = { limit: 1000 };
      const events = await storage.getConflictEvents(filters);
      res.json(events);
    } catch (error) {
      console.error('Filter parsing error:', error);
      // Fallback to default filters
      const events = await storage.getConflictEvents({ limit: 1000 });
      res.json(events);
    }
  });

  // Get conflict statistics
  app.get("/api/conflict-stats", async (req, res) => {
    try {
      const parseResult = conflictFiltersSchema.partial().safeParse(req.query);
      const filters = parseResult.success ? { limit: 1000, ...parseResult.data } : { limit: 1000 };
      const stats = await storage.getConflictStats(filters);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to fetch conflict statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get conflict hotspots
  app.get("/api/conflict-hotspots", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const hotspots = await storage.getHotspots(limit);
      res.json(hotspots);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch conflict hotspots",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Refresh data from ACLED API
  app.post("/api/refresh-data", async (req, res) => {
    try {
      if (!ACLED_EMAIL || !ACLED_KEY) {
        return res.status(500).json({ 
          message: "ACLED API credentials not configured. Please set ACLED_EMAIL and ACLED_KEY environment variables." 
        });
      }

      // Calculate date range for last 90 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const params = new URLSearchParams({
        email: ACLED_EMAIL,
        key: ACLED_KEY,
        event_date: `${startDate.toISOString().split('T')[0]}|${endDate.toISOString().split('T')[0]}`,
        format: 'json',
        limit: '5000'
      });

      const response = await fetch(`${ACLED_BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`ACLED API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(`ACLED API returned unsuccessful response: ${JSON.stringify(data)}`);
      }

      // Clear existing events and insert new ones
      const events = data.data.map(convertACLEDEvent);
      await storage.bulkCreateConflictEvents(events);

      const stats = await storage.getConflictStats();
      
      res.json({ 
        message: "Data refreshed successfully",
        eventsLoaded: events.length,
        lastUpdate: new Date().toISOString(),
        stats
      });
    } catch (error) {
      console.error('Error refreshing ACLED data:', error);
      res.status(500).json({ 
        message: "Failed to refresh conflict data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get single conflict event details
  app.get("/api/conflict-events/:id", async (req, res) => {
    try {
      const event = await storage.getConflictEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Conflict event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch conflict event",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // AI Analysis endpoints
  app.get("/api/ai-analysis", async (req, res) => {
    try {
      const parseResult = conflictFiltersSchema.partial().safeParse(req.query);
      const filters = parseResult.success ? { limit: 1000, ...parseResult.data } : { limit: 1000 };
      const events = await storage.getConflictEvents(filters);
      const analysis = await aiAnalyzer.analyzeConflictEvents(events);
      res.json(analysis);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      res.status(500).json({ 
        message: "Failed to generate AI analysis",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/regional-analysis", async (req, res) => {
    try {
      const parseResult = conflictFiltersSchema.partial().safeParse(req.query);
      const filters = parseResult.success ? { limit: 1000, ...parseResult.data } : { limit: 1000 };
      const events = await storage.getConflictEvents(filters);
      const regionalAnalysis = await aiAnalyzer.analyzeRegionalTrends(events);
      res.json(regionalAnalysis);
    } catch (error) {
      console.error('Regional Analysis Error:', error);
      res.status(500).json({ 
        message: "Failed to generate regional analysis",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/generate-alert/:id", async (req, res) => {
    try {
      const event = await storage.getConflictEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Conflict event not found" });
      }
      const alert = await aiAnalyzer.generateConflictAlert(event);
      res.json({ alert });
    } catch (error) {
      console.error('Alert Generation Error:', error);
      res.status(500).json({ 
        message: "Failed to generate alert",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
