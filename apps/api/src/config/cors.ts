export type RuntimeEnvironment = "development" | "test" | "production";

const vercelProject = "acc-pocket-api";
const vercelTeam = "saadignity94-gmailcoms-projects";
const localDevelopmentPorts = new Set(["4173", "5173"]);

function parsedOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.pathname === "/" && !url.search && !url.hash ? url : null;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(origin: string | undefined, configuredOrigin: string, environment: RuntimeEnvironment) {
  if (!origin) return true;
  const candidate = parsedOrigin(origin);
  const configured = parsedOrigin(configuredOrigin);
  if (!candidate || !configured) return false;
  if (candidate.origin === configured.origin) return true;

  if (environment !== "production" && candidate.protocol === "http:" && localDevelopmentPorts.has(candidate.port) && ["localhost", "127.0.0.1"].includes(candidate.hostname)) return true;

  const previewSuffix = `-${vercelTeam}.vercel.app`;
  return candidate.protocol === "https:"
    && candidate.port === ""
    && candidate.hostname.startsWith(`${vercelProject}-`)
    && candidate.hostname.endsWith(previewSuffix)
    && candidate.hostname.length > vercelProject.length + previewSuffix.length;
}

export function createCorsOriginValidator(configuredOrigin: string, environment: RuntimeEnvironment) {
  return (origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) => callback(null, isAllowedOrigin(origin, configuredOrigin, environment));
}
