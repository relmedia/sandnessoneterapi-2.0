import type { Metadata } from "next";

import { getPage } from "@/lib/content";
import { bodyToHtml } from "@/lib/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Salgsvilkår",
  description: "Salgsvilkår for kjøp av kurs og bøker hos Sandnes Soneterapi.",
};

export default async function SalgsvilkarPage() {
  const page = await getPage("salgsvilkar");
  const bodyHtml = page ? bodyToHtml(page.body) : null;

  return (
    <div className="py-16 md:py-24">
      <div className="container-narrow section-padding mx-auto">
        <p className="text-label mb-4">Juridisk</p>
        <h1 className="text-heading-display mb-12">{page?.title ?? "Salgsvilkår"}</h1>

        {bodyHtml ? (
          <div className="prose-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        ) : (
          <div className="prose-content">
            <p>Sist oppdatert: {new Date().getFullYear()}</p>

            <h2>1. Selger</h2>
            <p>
              Sandnes Soneterapi v/Terje Horpestad
              <br />
              Industrigata 1, 4307 Sandnes
              <br />
              E-post: terje@sandnessoneterapi.no
              <br />
              Telefon: 450 36 557
            </p>

            <h2>2. Hva vilkårene gjelder for</h2>
            <p>
              Disse salgsvilkårene gjelder ved kjøp av kurs og bøker via nettsiden sandnessoneterapi.no.
              Timebestilling for behandling er en forespørsel om avtale og reguleres ikke som netthandel på samme
              måte som betalte kjøp.
            </p>

            <h2>3. Priser og betaling</h2>
            <p>
              Kurs og bøker betales med Vipps MobilePay. Beløpet reserveres ved betaling og belastes når
              bestillingen er bekreftet. Frakt for bøker kommer i tillegg der dette er oppgitt ved kjøp.
            </p>

            <h2>4. Kurs</h2>
            <ul>
              <li>Påmelding er bindende når betaling er gjennomført.</li>
              <li>Avbestilling og refusjon følger reglene som er oppgitt på kurssiden og i bekreftelses-e-posten.</li>
              <li>Kurset kan avlyses ved for få påmeldte. Du får da full refusjon via samme betalingsmetode.</li>
            </ul>

            <h2>5. Bøker</h2>
            <ul>
              <li>Bøker sendes til oppgitt leveringsadresse etter mottatt betaling.</li>
              <li>Normal leveringstid er inntil 5–7 virkedager med mindre annet er avtalt.</li>
              <li>
                Du har 14 dagers angrerett ved fjernkjøp, jf. angrerettloven. Retur må skje uten unødig skade på
                varen. Du dekker returfrakt med mindre annet følger av loven.
              </li>
            </ul>

            <h2>6. Reklamasjon</h2>
            <p>
              Mangel ved vare eller tjeneste meldes til selger så snart som mulig. Vi følger reglene i
              forbrukerkjøpsloven og annen relevant lovgivning.
            </p>

            <h2>7. Personopplysninger</h2>
            <p>
              Behandling av personopplysninger beskrives i <a href="/personvern">personvernerklæringen</a>.
            </p>

            <h2>8. Tvister</h2>
            <p>
              Partene skal søke å løse tvister i minnelighet. Klager kan også rettes til Forbrukertilsynet.
              Verneting er Sandnes tingrett der annet ikke følger av ufravikelig lov.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
