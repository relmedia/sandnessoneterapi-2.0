import { NextResponse, type NextRequest } from "next/server";

import { isEmailConfigured, sendCourseRegistrationEmails } from "@/lib/booking-email";
import { createBookingClient } from "@/lib/booking-store";
import { getCourseSessionLabels, validateCourseRegistrationPayload } from "@/lib/course-registration";
import { getCourseBySlug } from "@/lib/content";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const validation = validateCourseRegistrationPayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { courseSlug, firstName, lastName, email, phone, sessionLabel, message } = validation.value;

  const course = await getCourseBySlug(courseSlug);
  if (!course || course.active === false) {
    return NextResponse.json({ error: "Kurset ble ikke funnet." }, { status: 404 });
  }

  // Resolve the chosen course date against the course's actual dates.
  const sessionLabels = getCourseSessionLabels(course);
  let chosenSession: string | null = null;
  if (sessionLabels.length > 0) {
    if (sessionLabels.length === 1) {
      chosenSession = sessionLabels[0];
    } else if (sessionLabel && sessionLabels.includes(sessionLabel)) {
      chosenSession = sessionLabel;
    } else {
      return NextResponse.json({ error: "Velg en kursdato." }, { status: 400 });
    }
  }

  const supabase = createBookingClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Påmelding er ikke aktivert ennå. Ring oss for å melde deg på." },
      { status: 503 },
    );
  }

  const record = {
    course_id: course.id,
    course_title: course.title,
    course_slug: course.slug,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone.replace(/\D/g, ""),
    session_label: chosenSession,
    message: message ?? null,
    status: "pending",
  };

  let { error } = await supabase.from("course_registrations").insert(record);
  if (error && /session_label/i.test(error.message)) {
    // Column not migrated yet (supabase/course-sessions.sql) – save without it.
    const { session_label: _label, ...withoutLabel } = record;
    void _label;
    ({ error } = await supabase.from("course_registrations").insert(withoutLabel));
  }

  if (error) {
    console.error("[course-registration] Insert failed:", error);
    return NextResponse.json({ error: "Kunne ikke lagre påmeldingen. Prøv igjen." }, { status: 500 });
  }

  let emailsSent = false;
  if (await isEmailConfigured()) {
    const result = await sendCourseRegistrationEmails(
      {
        firstName,
        lastName,
        email,
        phone,
        courseTitle: course.title,
        sessionLabel: chosenSession,
        price: course.price,
        message,
      },
      null,
    );
    emailsSent = result.customerSent;
  } else {
    console.warn("[course-registration] Email not configured. Set RESEND_API_KEY and EMAIL_FROM to enable.");
  }

  return NextResponse.json({
    ok: true,
    message: emailsSent
      ? "Påmeldingen er sendt. Du får bekreftelse på e-post, og Terje tar kontakt for å bekrefte plassen."
      : "Påmeldingen er sendt. Terje tar kontakt for å bekrefte plassen.",
    emailsSent,
  });
}
