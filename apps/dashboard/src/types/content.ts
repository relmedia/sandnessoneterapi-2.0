export type Service = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  body: string | null;
  image_url: string | null;
  image_alt: string | null;
  order: number | null;
};

export type CourseSession = {
  start: string;
  end: string | null;
  start_time: string | null;
  end_time: string | null;
  capacity?: number | null;
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  sessions: CourseSession[] | null;
  location: string | null;
  price: number | null;
  short_description: string | null;
  body: string | null;
  image_url: string | null;
  active: boolean | null;
};

export type Page = {
  id: string;
  title: string;
  slug: string;
  body: string | null;
};

export type Book = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  isbn: string | null;
  published_date: string | null;
  price: number | null;
  pages: number | null;
  description: string | null;
  order: number | null;
  order_online: boolean | null;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  body: string | null;
};

export type EmailSettings = {
  id: string;
  resend_api_key: string | null;
  email_from: string | null;
  booking_admin_email: string | null;
};

export const emptyEmailSettings: EmailSettings = {
  id: "singleton",
  resend_api_key: null,
  email_from: null,
  booking_admin_email: null,
};

export type SiteSettings = {
  id: string;
  title: string | null;
  tagline: string | null;
  hero_heading: string | null;
  hero_body: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  nnh: boolean | null;
  facebook_url: string | null;
  meta_description: string | null;
};

export const emptySettings: SiteSettings = {
  id: "singleton",
  title: "",
  tagline: "",
  hero_heading: "",
  hero_body: "",
  phone: "",
  email: "",
  address: "",
  nnh: false,
  facebook_url: "",
  meta_description: "",
};
