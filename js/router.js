export const ROUTES = Object.freeze({
  home: "home",
  multiplication: "multiplication",
  multiplicationSession: "multiplication-session",
  modes: "modes",
  modesCompetitive: "modes/competitive",
  modesChill: "modes/chill",
  modesScience: "modes/science",
  modesScienceFacts: "modes/science/facts",
  modesBracelets: "modes/bracelets",
  leaderboard: "leaderboard",
  teacher: "teacher",
  collection: "collection",
  settings: "settings"
});

export function startRouter(onRouteChange) {
  const handleRouteChange = () => {
    onRouteChange(getRouteFromHash());
  };

  window.addEventListener("hashchange", handleRouteChange);
  handleRouteChange();

  return () => {
    window.removeEventListener("hashchange", handleRouteChange);
  };
}

export function navigate(route) {
  const safeRoute = normalizeRoute(route);
  window.location.hash = safeRoute;
}

export function getRouteFromHash(hash = window.location.hash) {
  const route = hash.replace("#", "").replace(/^\/+/, "").trim();
  return normalizeRoute(route);
}

export function normalizeRoute(route) {
  return Object.values(ROUTES).includes(route) ? route : ROUTES.home;
}
