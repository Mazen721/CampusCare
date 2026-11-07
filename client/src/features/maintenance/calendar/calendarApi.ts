import { api } from '@/lib/api';
import { toQueryString } from '@/lib/queryString';
import type { CalendarResponse, ListCalendarParams } from '@/types/calendar';

export const calendarApi = {
  list(params: ListCalendarParams = {}): Promise<CalendarResponse> {
    return api.get<CalendarResponse>(`/maintenance/calendar${toQueryString(params)}`);
  },
};
