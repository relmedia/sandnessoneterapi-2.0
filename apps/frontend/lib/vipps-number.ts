const DEFAULT_VIPPS_NUMBER = "572429";

export function getVippsNumber(): string {
  return (process.env.NEXT_PUBLIC_VIPPS_NUMBER?.trim() || DEFAULT_VIPPS_NUMBER).replace(/^#/, "");
}

export function getVippsNumberDisplay(): string {
  return `#${getVippsNumber()}`;
}

export function getVippsPaymentInstructions(totalNok: number, bookTitle: string): string[] {
  return [
    "Åpne Vipps-appen på mobilen.",
    `Søk etter ${getVippsNumberDisplay()} eller «Sandnes Soneterapi».`,
    `Betal ${totalNok.toLocaleString("nb-NO")} kr.`,
    `Skriv gjerne «${bookTitle}» i meldingsfeltet.`,
  ];
}
