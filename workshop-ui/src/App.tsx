import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "sonner";

const BeamerApp = lazy(() => import("@/pages/BeamerApp").then((m) => ({ default: m.BeamerApp })));
const ParticipantApp = lazy(() =>
  import("@/pages/ParticipantApp").then((m) => ({ default: m.ParticipantApp }))
);

function detectIsBeamer(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.pathname.startsWith("/beamer") ||
    window.location.hash.startsWith("#/beamer")
  );
}

export function App() {
  const [isBeamer, setIsBeamer] = useState<boolean>(detectIsBeamer);

  useEffect(() => {
    const sync = () => setIsBeamer(detectIsBeamer());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-background p-6 text-sm text-muted-foreground">
            Prompt-Werkstatt wird geladen…
          </div>
        }
      >
        {isBeamer ? <BeamerApp /> : <ParticipantApp />}
      </Suspense>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ className: "font-sans" }}
      />
    </>
  );
}

export default App;
