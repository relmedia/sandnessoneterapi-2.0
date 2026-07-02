import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Sandnessoneterapi",
  version: packageJson.version,
  copyright: `© ${currentYear}, Sandnessoneterapi.`,
  meta: {
    title: "Sandnessoneterapi",
    description: "Sandnessoneterapi administrasjonspanel.",
  },
};
