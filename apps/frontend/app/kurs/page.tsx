import type { Metadata } from "next";

import { getCourses, getSettings } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";

import { KursList } from "./kurs-list";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Kurs",
  description: "Kommende kurs i soneterapi med Terje Horpestad.",
};

export default async function KursPage() {
  const [courses, settings] = await Promise.all([getCourses(), getSettings()]);

  return (
    <div className="py-16 md:py-24">
      <div className="container-wide section-padding mx-auto">
        <p className="text-label mb-4">Utdanning</p>
        <h1 className="text-heading-display mb-4">Kurs</h1>
        <p className="text-body-lg mb-10 max-w-xl">
          Terje Horpestad har utdannet soneterapeuter i over 20 år. Her finner du kommende kurs.
        </p>

        <KursList courses={courses} telDisplay={formatPhone(settings.phone)} telLink={telHref(settings.phone)} />
      </div>
    </div>
  );
}
