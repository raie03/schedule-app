export interface Event {
    id: string;
    title: string;
    description: string;
    dates: Date[];
    performances: Performance[];
    responses?: Response[];
    created_at: string;
    updated_at: string;
  }
  
  export interface Date {
    id: number;
    event_id: string;
    value: string;
  }
  
  export interface Performance {
    id: number;
    event_id: string;
    title: string;
    description: string;
  }
  
  export interface Response {
    id: number;
    event_id: string;
    name: string;
    answers: ResponseAnswer[];
    performances: UserPerformance[];
    created_at: string;
  }
  
  export interface ResponseAnswer {
    id: number;
    response_id: number;
    date_id: number;
    status: 'available' | 'maybe' | 'unavailable';
  }
  
  export interface UserPerformance {
    id: number;
    response_id: number;
    performance_id: number;
  }
  
  export interface ConflictReport {
    date: Date;
    performances: Performance[];
    conflicting_users: string[];
  }
  
  export interface CreateEventRequest {
    title: string;
    description: string;
    dates: string[];
    performances: { title: string; description: string }[];
  }
  
  export interface CreateResponseRequest {
    name: string;
    answers: Record<number, 'available' | 'maybe' | 'unavailable'>;
    performances: number[]; // Array of performance IDs
  }
  
  export interface ConflictAnalysisRequest {
    date_ids?: number[]; // Optional
  }
  
  export interface PerformanceScore {
    performance_id: number;
    date_id: number;
    available_count: number;
    conflict_count: number;
  }

  // 改善後
  export interface PerformanceScore {
    performance_id: number;
    date_id: number;
    performance_name: string;
    date_value: string;
    available_count: number;
    maybe_count: number;
    total_count: number;
    conflict_count: number;
    weighted_score: number;
    conflicting_users: string[];
  }
  
  export interface ScheduleMetrics {
    total_weighted_score: number;
    total_conflicts: number;
    total_available: number;
    total_maybe: number;
    performance_count: number;
    scheduled_performances: number;
    computation_time_ms: number;
  }
  
  export interface OptimalScheduleResponse {
    suggested_schedule: PerformanceScore[];
    metrics: ScheduleMetrics;
  }