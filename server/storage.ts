import { type User, type InsertUser, type ConflictEvent, type InsertConflictEvent, type ConflictFilters, type ConflictStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conflict event methods
  getConflictEvents(filters?: ConflictFilters): Promise<ConflictEvent[]>;
  getConflictEvent(id: string): Promise<ConflictEvent | undefined>;
  createConflictEvent(event: InsertConflictEvent): Promise<ConflictEvent>;
  updateConflictEvent(id: string, event: Partial<ConflictEvent>): Promise<ConflictEvent | undefined>;
  deleteConflictEvent(id: string): Promise<boolean>;
  bulkCreateConflictEvents(events: InsertConflictEvent[]): Promise<ConflictEvent[]>;
  getConflictStats(filters?: ConflictFilters): Promise<ConflictStats>;
  getHotspots(limit?: number): Promise<Array<{ country: string; region: string; eventCount: number; severity: string }>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conflictEvents: Map<string, ConflictEvent>;

  constructor() {
    this.users = new Map();
    this.conflictEvents = new Map();
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add some sample conflict events for demonstration
    const sampleEvents = [
      {
        eventDate: new Date('2025-08-29'),
        country: 'Ukraine',
        region: 'Europe',
        location: 'Kharkiv',
        latitude: '49.9935',
        longitude: '36.2304',
        eventType: 'Battles',
        subEventType: 'Armed clash',
        actor1: 'Military Forces of Ukraine',
        actor2: 'Military Forces of Russia',
        fatalities: 12,
        notes: 'Intense fighting reported in eastern districts',
        source: 'Multiple sources',
        sourceScale: 'National',
        severity: 'high'
      },
      {
        eventDate: new Date('2025-08-29'),
        country: 'Israel',
        region: 'Middle East',
        location: 'Gaza',
        latitude: '31.5017',
        longitude: '34.4668',
        eventType: 'Explosions/Remote violence',
        subEventType: 'Air/drone strike',
        actor1: 'Israeli Defense Forces',
        actor2: 'Hamas',
        fatalities: 8,
        notes: 'Airstrike on suspected militant position',
        source: 'Military reports',
        sourceScale: 'Regional',
        severity: 'medium'
      },
      {
        eventDate: new Date('2025-08-28'),
        country: 'Myanmar',
        region: 'Asia',
        location: 'Yangon',
        latitude: '16.8661',
        longitude: '96.1951',
        eventType: 'Protests',
        subEventType: 'Peaceful protest',
        actor1: 'Protesters (Myanmar)',
        actor2: null,
        fatalities: 0,
        notes: 'Pro-democracy demonstration dispersed peacefully',
        source: 'Local media',
        sourceScale: 'Local',
        severity: 'low'
      },
      {
        eventDate: new Date('2025-08-27'),
        country: 'Sudan',
        region: 'Africa',
        location: 'Khartoum',
        latitude: '15.5007',
        longitude: '32.5599',
        eventType: 'Violence against civilians',
        subEventType: 'Attack',
        actor1: 'Rapid Support Forces',
        actor2: null,
        fatalities: 25,
        notes: 'Attack on civilian area during clashes',
        source: 'UN reports',
        sourceScale: 'International',
        severity: 'critical'
      },
      {
        eventDate: new Date('2025-08-26'),
        country: 'Syria',
        region: 'Middle East',
        location: 'Aleppo',
        latitude: '36.2021',
        longitude: '37.1343',
        eventType: 'Battles',
        subEventType: 'Armed clash',
        actor1: 'Syrian Armed Forces',
        actor2: 'Opposition forces',
        fatalities: 6,
        notes: 'Border skirmish reported',
        source: 'Regional news',
        sourceScale: 'Regional',
        severity: 'medium'
      }
    ];

    sampleEvents.forEach(eventData => {
      const id = randomUUID();
      const event = {
        ...eventData,
        id,
        region: eventData.region || null,
        subEventType: eventData.subEventType || null,
        actor1: eventData.actor1 || null,
        actor2: eventData.actor2 || null,
        notes: eventData.notes || null,
        source: eventData.source || null,
        sourceScale: eventData.sourceScale || null,
        fatalities: eventData.fatalities || null,
        lastUpdated: new Date(),
      };
      this.conflictEvents.set(id, event);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConflictEvents(filters?: ConflictFilters): Promise<ConflictEvent[]> {
    let events = Array.from(this.conflictEvents.values());

    if (filters) {
      if (filters.severity && filters.severity.length > 0) {
        events = events.filter(event => filters.severity!.includes(event.severity as any));
      }
      
      if (filters.eventTypes && filters.eventTypes.length > 0) {
        events = events.filter(event => filters.eventTypes!.includes(event.eventType));
      }
      
      if (filters.countries && filters.countries.length > 0) {
        events = events.filter(event => filters.countries!.includes(event.country));
      }
      
      if (filters.region) {
        events = events.filter(event => event.region === filters.region);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        events = events.filter(event => new Date(event.eventDate) >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        events = events.filter(event => new Date(event.eventDate) <= endDate);
      }
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    
    // Apply limit
    const limit = filters?.limit || 1000;
    return events.slice(0, limit);
  }

  async getConflictEvent(id: string): Promise<ConflictEvent | undefined> {
    return this.conflictEvents.get(id);
  }

  async createConflictEvent(insertEvent: InsertConflictEvent): Promise<ConflictEvent> {
    const id = randomUUID();
    const event: ConflictEvent = {
      ...insertEvent,
      id,
      region: insertEvent.region ?? null,
      subEventType: insertEvent.subEventType ?? null,
      actor1: insertEvent.actor1 ?? null,
      actor2: insertEvent.actor2 ?? null,
      notes: insertEvent.notes ?? null,
      source: insertEvent.source ?? null,
      sourceScale: insertEvent.sourceScale ?? null,
      fatalities: insertEvent.fatalities ?? null,
      lastUpdated: new Date(),
    };
    this.conflictEvents.set(id, event);
    return event;
  }

  async updateConflictEvent(id: string, updateData: Partial<ConflictEvent>): Promise<ConflictEvent | undefined> {
    const existingEvent = this.conflictEvents.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent: ConflictEvent = {
      ...existingEvent,
      ...updateData,
      lastUpdated: new Date(),
    };
    this.conflictEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteConflictEvent(id: string): Promise<boolean> {
    return this.conflictEvents.delete(id);
  }

  async bulkCreateConflictEvents(insertEvents: InsertConflictEvent[]): Promise<ConflictEvent[]> {
    const events: ConflictEvent[] = [];
    for (const insertEvent of insertEvents) {
      const event = await this.createConflictEvent(insertEvent);
      events.push(event);
    }
    return events;
  }

  async getConflictStats(filters?: ConflictFilters): Promise<ConflictStats> {
    const events = await this.getConflictEvents(filters);
    
    const totalEvents = events.length;
    const totalFatalities = events.reduce((sum, event) => sum + (event.fatalities || 0), 0);
    const affectedCountries = new Set(events.map(event => event.country)).size;
    
    // Recent events (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentEvents = events.filter(event => new Date(event.eventDate) >= oneDayAgo).length;
    
    // Severity counts
    const severityCounts = {
      low: events.filter(e => e.severity === 'low').length,
      medium: events.filter(e => e.severity === 'medium').length,
      high: events.filter(e => e.severity === 'high').length,
      critical: events.filter(e => e.severity === 'critical').length,
    };
    
    // Event type counts
    const eventTypeCounts: Record<string, number> = {};
    events.forEach(event => {
      eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;
    });
    
    return {
      totalEvents,
      totalFatalities,
      affectedCountries,
      recentEvents,
      severityCounts,
      eventTypeCounts,
    };
  }

  async getHotspots(limit = 10): Promise<Array<{ country: string; region: string; eventCount: number; severity: string }>> {
    const events = Array.from(this.conflictEvents.values());
    const countryStats = new Map<string, { region: string; events: ConflictEvent[] }>();
    
    events.forEach(event => {
      const key = event.country;
      if (!countryStats.has(key)) {
        countryStats.set(key, { region: event.region || '', events: [] });
      }
      countryStats.get(key)!.events.push(event);
    });
    
    const hotspots = Array.from(countryStats.entries()).map(([country, data]) => {
      const eventCount = data.events.length;
      const severityPriority = { critical: 4, high: 3, medium: 2, low: 1 };
      const topSeverity = data.events.reduce((max, event) => {
        const currentPriority = severityPriority[event.severity as keyof typeof severityPriority] || 0;
        const maxPriority = severityPriority[max as keyof typeof severityPriority] || 0;
        return currentPriority > maxPriority ? event.severity : max;
      }, 'low');
      
      return {
        country,
        region: data.region,
        eventCount,
        severity: topSeverity,
      };
    });
    
    // Sort by event count descending
    hotspots.sort((a, b) => b.eventCount - a.eventCount);
    
    return hotspots.slice(0, limit);
  }
}

export const storage = new MemStorage();
