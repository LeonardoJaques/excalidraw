import { useEffect, useRef, useState } from "react";

const STATE_URL = "/auth/api/state";
const LOGIN_URL = "/auth/";
const IDLE_POLL_MS = 60 * 1000;
const LOCKED_POLL_MS = 3 * 1000;

const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await fetch(STATE_URL, { credentials: "same-origin" });
    if (!response.ok) {
      return false;
    }
    const { data } = (await response.json()) as {
      data: { authentication_level: number };
    };
    return data.authentication_level > 0;
  } catch {
    // network hiccup: don't lock the user out over a single failed check
    return true;
  }
};

// Authelia's forward-auth cookie can expire (or go inactive) while the user
// is just drawing, since the canvas itself makes no network requests. The
// next explicit action (e.g. clicking "Salvar") would silently hit an
// expired session and fail. This polls session state and blocks interaction
// with an in-place re-login overlay instead of letting a save fail or a
// hard redirect wipe unsaved work.
export const SessionGuard = () => {
  const [locked, setLocked] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const schedule = (ms: number) => {
      if (cancelled) {
        return;
      }
      timeoutRef.current = setTimeout(tick, ms);
    };

    const tick = async () => {
      const authenticated = await isAuthenticated();
      if (cancelled) {
        return;
      }
      setLocked(!authenticated);
      schedule(authenticated ? IDLE_POLL_MS : LOCKED_POLL_MS);
    };

    tick();

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!locked) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--island-bg-color, #fff)",
          borderRadius: "8px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          padding: "1rem",
        }}
      >
        <div style={{ fontSize: "0.9rem", textAlign: "center" }}>
          Sessão expirada. Entre novamente para continuar — o desenho não foi
          perdido.
        </div>
        <iframe
          title="Reautenticação"
          src={LOGIN_URL}
          style={{ width: "420px", height: "560px", border: "none" }}
        />
      </div>
    </div>
  );
};
