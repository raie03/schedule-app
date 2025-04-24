import axios from 'axios';
import { 
  CreateEventRequest, 
  CreateResponseRequest, 
  Event, 
  Response,
  ConflictAnalysisRequest,
  ConflictReport,
  PerformanceScore,
  OptimalScheduleResponse,
} from '../../types/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createEvent = async (data: CreateEventRequest): Promise<Event> => {
  const response = await api.post<Event>('/events', data);
  return response.data;
};

export const getEvent = async (id: string): Promise<Event> => {
  const response = await api.get<Event>(`/events/${id}`);
  return response.data;
};

export const addResponse = async (eventId: string, data: CreateResponseRequest): Promise<void> => {
  await api.post(`/events/${eventId}/responses`, data);
};

export const getResponses = async (eventId: string): Promise<Response[]> => {
  const response = await api.get<Response[]>(`/events/${eventId}/responses`);
  return response.data;
};

export const analyzeConflicts = async (
  eventId: string, 
  data?: ConflictAnalysisRequest
): Promise<{ conflicts: ConflictReport[] }> => {
  const response = await api.post<{ conflicts: ConflictReport[] }>(
    `/events/${eventId}/conflicts/analyze`, 
    data || {}
  );
  return response.data;
};

// export const suggestOptimalSchedule = async (
//   eventId: string
// ): Promise<{ suggested_schedule: PerformanceScore[] }> => {
//   const response = await api.get<{ suggested_schedule: PerformanceScore[] }>(
//     `/events/${eventId}/schedule/suggest`
//   );
//   return response.data;
// };

export const suggestOptimalSchedule = async (
    eventId: string
  ): Promise<OptimalScheduleResponse> => {
    const response = await api.get<OptimalScheduleResponse>(`/events/${eventId}/optimal-schedule`);
    return response.data;
  };