export function getChillRewardLabel(session) {
  if (session?.modeId === "garden") {
    return `${session.flowers || 0} fleurs ont poussé 🌷`;
  }

  if (session?.modeId === "mascot-snack") {
    return `${session.snacks || 0} friandises offertes 🍪`;
  }

  return "On joue tranquillement 🌸";
}

export function getChillMascotMessage(session) {
  if (session?.modeId === "garden") {
    return "Chaque bonne réponse fait grandir ton jardin.";
  }

  if (session?.modeId === "mascot-snack") {
    return "La mascotte t'encourage, même quand tu hésites.";
  }

  return "Pas de chrono ici.";
}
