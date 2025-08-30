# Overview

This is a Global Conflict Monitor application that visualizes and tracks conflict events worldwide. The system integrates with the ACLED (Armed Conflict Location & Event Data) API to provide real-time conflict data visualization through an interactive dashboard. The application features a React frontend with TypeScript, an Express.js backend, and uses Drizzle ORM with PostgreSQL for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Library**: Radix UI components with shadcn/ui design system
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Data Visualization**: Custom React components for map visualization and charts

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with endpoints for conflict events, statistics, AI analysis, and real-time monitoring
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Data Storage**: In-memory storage implementation with interface for future PostgreSQL migration
- **AI Integration**: OpenAI GPT-5 powered analysis system for conflict insights and strategic recommendations
- **Real-time Monitoring**: WebSocket-based monitoring system with automatic AI-powered alerts
- **External API Integration**: ACLED API client for fetching conflict data
- **Session Management**: Express session handling with PostgreSQL session store

## Database Schema
- **Users Table**: Authentication with username/password
- **Conflict Events Table**: Comprehensive conflict data including location, severity, actors, and metadata
- **Data Types**: Decimal precision for coordinates, timestamps for events, enumerated severity levels

## Key Design Patterns
- **AI Analysis Layer**: OpenAI GPT-5 integration for intelligent conflict pattern analysis and strategic insights
- **WebSocket Real-time Monitoring**: Live monitoring system with automatic alert generation for critical events
- **Repository Pattern**: Storage interface abstraction allows switching between in-memory and PostgreSQL implementations
- **Data Transformation Layer**: Converts ACLED API format to internal schema with AI-enhanced severity classification
- **Component Composition**: Modular React components for dashboard, map, sidebar, AI insights panel, and visualization panels
- **Real-time Updates**: Multi-layered refresh mechanism with ACLED API integration and WebSocket live updates

## Authentication & Authorization
- **Session-based Authentication**: Express sessions with secure cookie configuration
- **User Management**: Basic user registration and login system
- **Database Sessions**: PostgreSQL-backed session storage for production scalability

# External Dependencies

## Third-party Services
- **ACLED API**: Primary data source for global conflict events requiring API key authentication
- **Neon Database**: PostgreSQL hosting service for production database
- **Replit**: Development and deployment environment with specific plugins and configurations

## Key Libraries
- **Database**: Drizzle ORM, Drizzle Kit for migrations, @neondatabase/serverless for PostgreSQL connection
- **UI Components**: Comprehensive Radix UI primitives, Lucide React icons, date-fns for date handling
- **Development Tools**: Vite with React plugin, TypeScript, ESBuild for production builds
- **State Management**: TanStack React Query for server state, Wouter for routing
- **Styling**: Tailwind CSS, class-variance-authority for component variants, clsx for conditional classes

## Development Configuration
- **Build System**: Vite for frontend, ESBuild for backend bundling
- **Type Safety**: Shared TypeScript types between frontend and backend
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Session Storage**: connect-pg-simple for PostgreSQL session management