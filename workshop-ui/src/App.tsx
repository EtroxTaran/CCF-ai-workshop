import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { BeamerApp } from "@/pages/BeamerApp";
import { ParticipantApp } from "@/pages/ParticipantApp";

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
      {isBeamer ? <BeamerApp /> : <ParticipantApp />}
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
