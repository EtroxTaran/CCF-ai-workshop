---
status: accepted
---

# Deklarative SVG/Framer-Motion-Animatics & Bühnen-Web-Audio statt Video-MP4s und Browser-TTS

Für maximale visuelle Führung ohne Bundle-Aufblähung setzen wir auf 5 interaktive SVG/Framer-Motion-Animatics, animierte 60fps-Chat-/Terminal-Walkthrough-Player, annotierte UI-Hotspot-Karten (mit optionalen `public/guides/*.webp`-Drop-in-Slots für eigene Screenshots), eine eingebaute interaktive Vorher/Nachher-Ergebnisvorschau sowie eine 15-Sekunden-Spotlight-Tour. Audio beschränkt sich auf stumm vorbelegte Web-Audio-API-Signale (1-Min.-Hinweis & 00:00-Gong) auf der Trainer-Bühne.

## Considered Options

- **Schwere Bildschirm-Videos (MP4/WebM) + Lottie:** Multi-MB-Assets, unscharf auf 4K-Projektoren, veralten bei jedem UI-Update von Claude/ChatGPT und erschweren Offline-Caching.
- **Browser-TTS (`window.speechSynthesis`) oder gesprochene MP3-Voiceovers am Teilnehmer-Laptop:** Windows-Offline-Stimmen verstümmeln Fachbegriffe; im vollen Workshop-Raum ohne Kopfhörer hört fast niemand Audio am Laptop.
- **Deklarative Animatics + Walkthrough-Player + Hotspot-Karten + Bühnen-Gong (gewählt):** Gestochen scharf auf 390 px bis 4K, 100 % offline ohne neue Dependencies, pausierbar und direkt an den aktuellen Zustand der App gekoppelt.
