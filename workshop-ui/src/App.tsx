import { BeamerApp } from "@/pages/BeamerApp";
import { ParticipantApp } from "@/pages/ParticipantApp";

export function App() {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const isBeamer = path.startsWith("/beamer") || hash.startsWith("#/beamer");
  return isBeamer ? <BeamerApp /> : <ParticipantApp />;
}

export default App;
