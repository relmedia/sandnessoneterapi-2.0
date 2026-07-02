import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { getBookOrderById } from "@/lib/book-order-email";
import { getVippsNumberDisplay, getVippsPaymentInstructions } from "@/lib/vipps-number";

type PageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function BookOrderSuccessPage({ searchParams }: PageProps) {
  const { order: orderId } = await searchParams;
  const vippsNumber = getVippsNumberDisplay();

  if (!orderId) {
    notFound();
  }

  const order = await getBookOrderById(orderId);
  if (!order) {
    notFound();
  }

  const instructions = getVippsPaymentInstructions(order.totalNok, order.bookTitle ?? "Bok");
  const isPaid = order.status === "paid";

  return (
    <article className="py-16 md:py-24">
      <div className="container-wide section-padding mx-auto max-w-2xl">
        <div className="rounded-2xl border border-stone/10 bg-white p-8 shadow-sm md:p-10">
          <div className="mb-6 flex items-center gap-3 text-sage-dark">
            <CheckCircle2 className="size-8 shrink-0" aria-hidden />
            <h1 className="text-heading-page">{isPaid ? "Bestilling bekreftet" : "Takk for bestillingen"}</h1>
          </div>

          {isPaid ? (
            <p className="text-body-lg">
              Betalingen{order.bookTitle ? ` for ${order.bookTitle}` : ""} er mottatt. Vi sender boken til
              adressen du oppga så snart som mulig.
            </p>
          ) : (
            <>
              <p className="text-body-lg">
                Hei {order.name}, bestillingen{order.bookTitle ? ` av ${order.bookTitle}` : ""} er mottatt.
                Fullfør betalingen med Vipps for at vi skal sende boken.
              </p>

              <div className="mt-8 rounded-2xl border border-[#ff5b24]/20 bg-[#ff5b24]/5 p-6">
                <p className="mb-1 font-sans text-xs font-medium tracking-[0.2em] text-[#ff5b24] uppercase">
                  Betal med Vipps
                </p>
                <p className="text-heading-page mb-4">{order.totalNok.toLocaleString("nb-NO")} kr</p>
                <p className="mb-6 font-sans text-2xl font-medium tracking-wide text-stone">
                  {vippsNumber}
                </p>
                <ol className="text-body-sm space-y-3">
                  {instructions.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-stone text-xs text-cream">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <p className="text-body-sm mt-6">
                Du får også betalingsinstruksjoner på e-post. Vi sender boken når betalingen er mottatt.
              </p>
            </>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/boker"
              className="inline-flex rounded-full bg-stone px-6 py-3 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark"
            >
              Tilbake til bøker
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-full border border-stone/20 px-6 py-3 font-sans text-sm font-normal tracking-wide text-stone transition-colors hover:border-sage hover:text-sage-dark"
            >
              Til forsiden
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
