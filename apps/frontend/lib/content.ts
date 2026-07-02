import { createSupabaseClient } from "./supabase";

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

// Fallbacks keep the site working before RLS is opened / the DB is reachable.
export const fallbackSettings: SiteSettings = {
  id: "singleton",
  title: "Sandnes Soneterapi",
  tagline: "40 års erfaring – Terje Horpestad",
  hero_heading: "Naturlig helse gjennom berøring",
  hero_body:
    "Terje Horpestad er godkjent soneterapeut med over 40 års daglig erfaring. Han tilbyr soneterapi, øreakupunktur og tankefeltterapi i Sandnes.",
  phone: "45036557",
  email: null,
  address: "Industrigata 1, 4307 Sandnes",
  nnh: true,
  facebook_url: "https://www.facebook.com/Sandnes-Soneterapi-212595643716/",
  meta_description:
    "Soneterapeut Terje Horpestad – soneterapi, øreakupunktur og tankefeltterapi i Sandnes.",
};

export const fallbackServices: Service[] = [
  {
    id: "svc-1",
    title: "Soneterapi",
    slug: "soneterapi",
    short_description:
      "Refleksologi på føttene som påvirker hele kroppen gjennom sonekartet. Terje har 40 års daglig erfaring.",
    body: null,
    image_url: null,
    image_alt: null,
    order: 1,
  },
  {
    id: "svc-2",
    title: "Øreakupunktur",
    slug: "oreakupunktur",
    short_description: "Stimulering av akupunkturpunkter i øret for balanse og velvære.",
    body: null,
    image_url: null,
    image_alt: null,
    order: 2,
  },
  {
    id: "svc-3",
    title: "Tankefeltterapi",
    slug: "tankefeltterapi",
    short_description: "Behandling av negative tanke- og følelsesmønstre via energisystemet.",
    body: null,
    image_url: null,
    image_alt: null,
    order: 3,
  },
];

export const fallbackCourses: Course[] = [];

export const fallbackPages: Record<string, Page> = {
  "om-meg": {
    id: "page-om-meg",
    title: "Om meg",
    slug: "om-meg",
    body: "<p>Terje Horpestad har gjennom 35 års daglig erfaring med soneterapibehandlinger utviklet et unikt og detaljert sonesystem som har resultert i 3 fagbøker i soneterapi og 1 stk fagbok i tankefeltterapi.</p><p>I 1998 startet han Soneterapiskolen hvor han har vært lærer og rektor. Skolen har vært godkjent av Norske Naturterapeuters Hovedorganisasjon siden 1998.</p><p>Terje er eksaminert soneterapeut v/Naturheilschule i 1986. Han har videreutdanning i fotsoneterapi v/Charles Ersdal. I tillegg til eksamener fra Naturheilschule i øreakupunktur, urtemedisin, anatomi og fysiologi. Eksamen i tankefeltterapi: Alternativet i Stavanger.</p><p>Sandnes Soneterapi har bedriftsavtaler med flere større bedrifter i Rogaland (blandt annet Coop på Bryne). Terje har tidligere i flere år vært leder i forskningskomiteen til NNH.</p><h2>Bøker utgitt av Terje</h2><ul><li><em>Ny kunnskap i Soneterapi</em> — ISBN 978-82-997412-2-4</li><li><em>New knowledge in reflexotherapy</em> — ISBN 978-82-997412-5-5</li><li><em>Tankefeltterapi, akupunktur og meridianlære</em> — ISBN 978-82-997412-4-8</li><li><em>Soneterapi i tekst og bilder</em> — ISBN 978-82-997412-8-6</li></ul><h2>Kurser som Terje har undervist i</h2><ul><li>Faglærer ved Sirius Naturterapeutiske skole i Haugesund</li><li>Faglærer i soneterapi i Tromsø på Akademiet Helbred</li><li>Fagkurs i soneterapi for terapeuter i Sandnes, Oslo og Tromsø</li><li>Grunnkurs i soneterapi for elever som ønsker å lære soneterapi i lokalene til Sandnes Soneterapi</li></ul>",
  },
  priser: {
    id: "page-priser",
    title: "Priser",
    slug: "priser",
    body: "<p>Ta kontakt på telefon for gjeldende priser og bestilling av time.</p>",
  },
};

export const fallbackBooks: Book[] = [
  {
    id: "book-1",
    title: "Soneterapi i tekst og bilder",
    slug: "soneterapi-i-tekst-og-bilder",
    cover_image_url: null,
    isbn: "978-82-997412-9-3",
    published_date: "2019-02-19",
    price: null,
    pages: 54,
    description: null,
    order: 1,
    order_online: false,
  },
  {
    id: "book-2",
    title: "Ny kunnskap i soneterapi",
    slug: "ny-kunnskap-i-soneterapi",
    cover_image_url: null,
    isbn: null,
    published_date: null,
    price: null,
    pages: null,
    description: null,
    order: 2,
    order_online: false,
  },
  {
    id: "book-3",
    title: "Tankefeltterapi, akupunktur og meridianlære",
    slug: "tankefeltterapi-akupunktur-og-meridianlaere",
    cover_image_url: null,
    isbn: null,
    published_date: null,
    price: null,
    pages: null,
    description: null,
    order: 3,
    order_online: false,
  },
];

function byOrder(a: Service, b: Service) {
  return (a.order ?? 0) - (b.order ?? 0);
}

export async function getServices(): Promise<Service[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return fallbackServices;

  const { data, error } = await supabase
    .from("services")
    .select("id, title, slug, short_description, body, image_url, image_alt, order");

  if (error || !data || data.length === 0) return fallbackServices;
  return (data as Service[]).slice().sort(byOrder);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const services = await getServices();
  return services.find((service) => service.slug === slug) ?? null;
}

async function selectCourses(supabase: NonNullable<ReturnType<typeof createSupabaseClient>>) {
  // select(*) so optional columns (image_url, sessions) never break the query.
  const { data, error } = await supabase.from("courses").select("*");
  return error ? null : data;
}

function normalizeCourse(course: Course): Course {
  return {
    ...course,
    image_url: course.image_url ?? null,
    sessions: Array.isArray(course.sessions) ? course.sessions : null,
  };
}

export async function getCourses(): Promise<Course[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return fallbackCourses;

  const data = await selectCourses(supabase);
  if (!data) return fallbackCourses;

  return (data as Course[])
    .map(normalizeCourse)
    .filter((c) => c.active !== false)
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return fallbackCourses.find((c) => c.slug === slug) ?? null;

  const data = await selectCourses(supabase);
  if (!data) return null;
  const match = (data as Course[]).find((c) => c.slug === slug);
  return match ? normalizeCourse(match) : null;
}

export async function getSettings(): Promise<SiteSettings> {
  const supabase = createSupabaseClient();
  if (!supabase) return fallbackSettings;

  const { data, error } = await supabase.from("settings").select("*").limit(1).maybeSingle();

  if (error || !data) return fallbackSettings;
  return data as SiteSettings;
}

export async function getPage(slug: string): Promise<Page | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return fallbackPages[slug] ?? null;

  const { data, error } = await supabase
    .from("pages")
    .select("id, title, slug, body")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return fallbackPages[slug] ?? null;
  return data as Page;
}

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

  const order_online =
    "order_online" in row
      ? row.order_online === true
      : typeof price === "number" && price > 0;

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
    order_online,
  };
}

async function selectBooks(supabase: NonNullable<ReturnType<typeof createSupabaseClient>>) {
  let result = await supabase.from("books").select(BOOK_COLUMNS_WITH_ORDER_ONLINE);
  if (result.error?.code === "42703") {
    result = await supabase.from("books").select(BOOK_COLUMNS_BASE);
  }
  return result;
}

export async function getBooks(): Promise<Book[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return fallbackBooks;

  const { data, error } = await selectBooks(supabase);

  if (error || !data || data.length === 0) return fallbackBooks;
  return data
    .map((row) => normalizeBook(row as Record<string, unknown>))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return fallbackBooks.find((book) => book.slug === slug) ?? null;
  }

  let { data, error } = await supabase
    .from("books")
    .select(BOOK_COLUMNS_WITH_ORDER_ONLINE)
    .eq("slug", slug)
    .maybeSingle();

  if (error?.code === "42703") {
    ({ data, error } = await supabase
      .from("books")
      .select(BOOK_COLUMNS_BASE)
      .eq("slug", slug)
      .maybeSingle());
  }

  if (error || !data) return null;
  return normalizeBook(data as Record<string, unknown>);
}

export async function getArticles(): Promise<Article[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, published_at, excerpt, cover_image_url, body");

  if (error || !data) return [];
  return (data as Article[])
    .slice()
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    const articles = await getArticles();
    return articles.find((article) => article.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, published_at, excerpt, cover_image_url, body")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as Article;
}
