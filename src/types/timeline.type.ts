export type TimelineEventType =
  | "medicine_added"
  | "medicine_taken"
  | "medicine_skipped"
  | "medicine_missed"
  | "prescription_uploaded"
  | "appointment"
  | "ai_conversation"
  | "profile_updated";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  date: string;
  refId: string;
}

export interface TimelineQuery {
  page: number;
  pageSize: number;
  types?: TimelineEventType[];
  from?: Date;
  to?: Date;
}

export interface PaginatedTimeline {
  items: TimelineEvent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}
