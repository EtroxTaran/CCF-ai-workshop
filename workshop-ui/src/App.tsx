import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_MODULE_ID } from "@/lib/moduleLoader";

const BeamerApp = lazy(() => import("@/pages/BeamerApp").then((m) => ({ default: m.BeamerApp })));
const ParticipantApp = lazy(() =>
  import("@/pages/ParticipantApp").then((m) => ({ default: m.ParticipantApp }))
);
const ModuleHubPage = lazy(() =>
  import("@/pages/ModuleHubPage").then((m) => ({ default: m.ModuleHubPage }))
);

type AppRoute =
  | { kind: "hub" }
  | { kind: "beamer"; moduleId: string }
  | { kind: "participant"; moduleId: string };

function parseAppRoute(): AppRoute {
  if (typeof window === "undefined") {
    return { kind: "participant", moduleId: DEFAULT_MODULE_ID };
  }
  const hash = window.location.hash;
  if (/^#\/hub(?:[/?#]|$)/.test(hash)) {
    return { kind: "hub" };
  }
  const modBeamer = hash.match(/^#\/m\/([^/?#]+)\/beamer(?:[/?#]|$)/);
  if (modBeamer) {
    return { kind: "beamer", moduleId: decodeURIComponent(modBeamer[1]) };
  }
  const modPart = hash.match(/^#\/m\/([^/?#]+)/);
  if (modPart) {
    return { kind: "participant", moduleId: decodeURIComponent(modPart[1]) };
  }
  if (/^#\/beamer(?:[/?#]|$)/.test(hash)) {
    return { kind: "beamer", moduleId: DEFAULT_MODULE_ID };
  }
  if (
    (!hash || hash === "#") &&
    (window.location.pathname === "/beamer" || window.location.pathname.startsWith("/beamer/"))
  ) {
    return { kind: "beamer", moduleId: DEFAULT_MODULE_ID };
  }
  return { kind: "participant", moduleId: DEFAULT_MODULE_ID };
}

export function App() {
  const [route, setRoute] = useState<AppRoute>(parseAppRoute);

  useEffect(() => {
    const sync = () => setRoute(parseAppRoute());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-background p-6 text-sm text-muted-foreground">
            Prompt-Werkstatt wird geladen…
          </div>
        }
      >
        {route.kind === "hub" ? (
          <ModuleHubPage />
        ) : route.kind === "beamer" ? (
          <BeamerApp key={`beamer-${route.moduleId}`} moduleId={route.moduleId} />
        ) : (
          <ParticipantApp key={`part-${route.moduleId}`} moduleId={route.moduleId} />
        )}
      </Suspense>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ className: "font-sans" }}
      />
    </TooltipProvider>
  );
}

export default App;
