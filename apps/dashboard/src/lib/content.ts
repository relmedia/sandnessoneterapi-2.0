import { createClient } from "@/lib/supabase/server";
import {
  type Article,
  type Book,
  type Course,
  emptyEmailSettings,
  emptySettings,
  type EmailSettings,
  type Page,
  type Service,
  type SiteSettings,
} from "@/types/content";

const SERVICE_COLUMNS = "id, title, slug, short_description, body, image_url, image_alt, order";
const BOOK_COLUMNS_BASE =
  "id, title, slug, cover_image_url, isbn, published_date, price, pages, description, order";
const BOOK_COLUMNS_WITH_ORDER_ONLINE = `${BOOK_COLUMNS_BASE}, order_online`;

function normalizeBook(row: Record<string, unknown>): Book {
  const price =
    typeof row.price === "number"
      ? row.price
      : row.price != null && row.price !== ""
        ? Number(row.price)
        : null;

  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    cover_image_url: (row.cover_image_url as string | null) ?? null,
    isbn: (row.isbn as string | null) ?? null,
    published_date: (row.published_date as string | null) ?? null,
    price: Number.isFinite(price) ? price : null,
    pages: typeof row.pages === "number" ? row.pages : row.pages != null ? Number(row.pages) : null,
    description: (row.description as string | null) ?? null,
    order: typeof row.order === "number" ? row.order : row.order != null ? Number(row.order) : null,
    order_online:
      "order_online" in row
        ? row.order_online === true
        : typeof price === "number" && price > 0,
  };
}

async function selectBooks(supabase: Awaited<ReturnType<typeof createClient>>) {
  let result = await supabase.from("books").select(BOOK_COLUMNS_WITH_ORDER_ONLINE);
  if (result.error?.code === "42703") {
    result = await supabase.from("books").select(BOOK_COLUMNS_BASE);
  }
  return result;
}
const ARTICLE_COLUMNS = "id, title, slug, published_at, excerpt, cover_image_url, body";

export async function getServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("services").select(SERVICE_COLUMNS);
  return ((data as Service[]) ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getService(id: string): Promise<Service | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("services").select(SERVICE_COLUMNS).eq("id", id).maybeSingle();
  return (data as Service) ?? null;
}

async function courseSelect(supabase: Awaited<ReturnType<typeof createClient>>) {
  // select(*) so optional columns (image_url, sessions) never break the query.
  const { data } = await supabase.from("courses").select("*");
  return data as Course[] | null;
}

function normalizeCourse(course: Course): Course {
  return {
    ...course,
    image_url: course.image_url ?? null,
    sessions: Array.isArray(course.sessions) ? course.sessions : null,
  };
}

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const data = await courseSelect(supabase);
  return (data ?? [])
    .slice()
    .map(normalizeCourse)
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));
}

export async function getCourse(id: string): Promise<Course | null> {
  const supabase = await createClient();
  const data = await courseSelect(supabase);
  const match = (data ?? []).find((c) => c.id === id);
  return match ? normalizeCourse(match) : null;
}

export async function getSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
  return { ...emptySettings, ...(data ?? {}) } as SiteSettings;
}

export async function getEmailSettings(): Promise<EmailSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("email_settings").select("*").eq("id", "singleton").maybeSingle();
  return { ...emptyEmailSettings, ...(data ?? {}) } as EmailSettings;
}

export async function getPages(): Promise<Page[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("pages").select("id, title, slug, body");
  return ((data as Page[]) ?? []).slice().sort((a, b) => a.title.localeCompare(b.title, "nb"));
}

export async function getPage(id: string): Promise<Page | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("pages").select("id, title, slug, body").eq("id", id).maybeSingle();
  return (data as Page) ?? null;
}

export async function getBooks(): Promise<Book[]> {
  const supabase = await createClient();
  const { data } = await selectBooks(supabase);
  return (data ?? [])
    .map((row) => normalizeBook(row as Record<string, unknown>))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getBook(id: string): Promise<Book | null> {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("books")
    .select(BOOK_COLUMNS_WITH_ORDER_ONLINE)
    .eq("id", id)
    .maybeSingle();

  if (error?.code === "42703") {
    ({ data } = await supabase.from("books").select(BOOK_COLUMNS_BASE).eq("id", id).maybeSingle());
  }

  return data ? normalizeBook(data as Record<string, unknown>) : null;
}

export async function getArticles(): Promise<Article[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select(ARTICLE_COLUMNS);
  return ((data as Article[]) ?? [])
    .slice()
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

export async function getArticle(id: string): Promise<Article | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select(ARTICLE_COLUMNS).eq("id", id).maybeSingle();
  return (data as Article) ?? null;
}
