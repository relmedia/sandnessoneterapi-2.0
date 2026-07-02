export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type BookingRequest = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  message: string | null;
  status: BookingStatus;
  cancel_token: string;
  confirm_token: string | null;
  confirmed_at: string | null;
  created_at: string;
  cancelled_at: string | null;
};

export type CourseRegistration = {
  id: string;
  course_id: string | null;
  course_title: string;
  course_slug: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  session_label: string | null;
  message: string | null;
  status: BookingStatus;
  created_at: string;
  cancelled_at: string | null;
};

export type AvailabilityDay = {
  id: string;
  date: string;
  is_closed: boolean;
  slots: string[];
};

export const BOOKING_TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
] as const;
