export const CARD_RARITIES = Object.freeze({
  COMMON: "common",
  RARE: "rare",
  EPIC: "epic",
  MASTERY: "mastery"
});

export const TABLE_UNIVERSES = Object.freeze({
  2: { name: "Forêt des Duos", emoji: "🌲" },
  3: { name: "Îles Triangulaires", emoji: "🏝️" },
  4: { name: "Robots Carrés", emoji: "🤖" },
  5: { name: "Fête Foraine", emoji: "🎡" },
  6: { name: "Grotte aux Cristaux", emoji: "💎" },
  7: { name: "Château Mystérieux", emoji: "🏰" },
  8: { name: "Espace Multiplié", emoji: "🚀" },
  9: { name: "Dragons Malins", emoji: "🐉" },
  10: { name: "Ville Futuriste", emoji: "🌆" },
  mix: { name: "Royaume des Champions", emoji: "👑" }
});

export const COLLECTIBLE_CARDS = Object.freeze([
  // Table de 2 — Forêt des Duos
  card("t2-c1", 2, "common", "Renard Duo", "Gardien des paires", "Il adore compter par deux.", "🦊"),
  card("t2-c2", 2, "common", "Hibou Pair", "Veilleur nocturne", "Il voit les paires dans l'ombre.", "🦉"),
  card("t2-c3", 2, "common", "Lapin Sauteur", "Bondisseur agile", "Il saute de deux en deux.", "🐇"),
  card("t2-c4", 2, "common", "Écureuil Malin", "Collecteur de noisettes", "Toujours par paires.", "🐿️"),
  card("t2-r1", 2, "rare", "Cerf Doré", "Noble de la forêt", "Ses bois brillent la nuit.", "🦌"),
  card("t2-r2", 2, "rare", "Loup Jumelé", "Chef de meute", "Il court toujours en duo.", "🐺"),
  card("t2-e1", 2, "epic", "Phénix des Duos", "Créature légendaire", "Renaît toujours par paires.", "🔥"),
  card("t2-m1", 2, "mastery", "Esprit de la Forêt", "Maître des Duos", "Tu maîtrises la table de 2 !", "🌳"),

  // Table de 3 — Îles Triangulaires
  card("t3-c1", 3, "common", "Tortue Triangle", "Nageuse tranquille", "Sa carapace a trois faces.", "🐢"),
  card("t3-c2", 3, "common", "Crabe Triple", "Danseur du sable", "Trois pinces, trois fois plus fort.", "🦀"),
  card("t3-c3", 3, "common", "Mouette Tri", "Voyageuse des îles", "Elle survole trois îles.", "🕊️"),
  card("t3-c4", 3, "common", "Poisson Prisme", "Éclaireur des fonds", "Ses écailles reflètent la lumière.", "🐠"),
  card("t3-r1", 3, "rare", "Pieuvre Tricolore", "Gardienne du récif", "Trois tentacules magiques.", "🐙"),
  card("t3-r2", 3, "rare", "Dauphin Solaire", "Surfeur des vagues", "Il fait des sauts triples.", "🐬"),
  card("t3-e1", 3, "epic", "Kraken des Triangles", "Titan sous-marin", "Il commande les courants.", "🦑"),
  card("t3-m1", 3, "mastery", "Roi des Îles", "Maître du Triple", "Tu maîtrises la table de 3 !", "👑"),

  // Table de 4 — Robots Carrés
  card("t4-c1", 4, "common", "Robo-Carré", "Assistant joyeux", "Quatre boulons, quatre côtés.", "🤖"),
  card("t4-c2", 4, "common", "Drone Pixel", "Éclaireur aérien", "Vol en formation carrée.", "📡"),
  card("t4-c3", 4, "common", "Bot Engrenage", "Mécanicien rapide", "Quatre roues dentées.", "⚙️"),
  card("t4-c4", 4, "common", "Écran Bleu", "Calculateur fidèle", "Quatre coins lumineux.", "💻"),
  card("t4-r1", 4, "rare", "Cyber Félin", "Chasseur numérique", "Griffes en titane carré.", "🐱"),
  card("t4-r2", 4, "rare", "Gardien Chrome", "Protecteur des données", "Bouclier à quatre faces.", "🛡️"),
  card("t4-e1", 4, "epic", "Titan Mécanique", "Colosse de métal", "Sa puissance est au carré.", "🦾"),
  card("t4-m1", 4, "mastery", "Cœur Quantique", "Maître des Carrés", "Tu maîtrises la table de 4 !", "💠"),

  // Table de 5 — Fête Foraine
  card("t5-c1", 5, "common", "Clown Joyeux", "Amuseur de foules", "Cinq balles en l'air.", "🤡"),
  card("t5-c2", 5, "common", "Barbe à Papa", "Tourbillon sucré", "Cinq couches de douceur.", "🍭"),
  card("t5-c3", 5, "common", "Étoile Filante", "Lumière du manège", "Cinq branches scintillantes.", "⭐"),
  card("t5-c4", 5, "common", "Ours en Peluche", "Prix du stand", "Le lot préféré des enfants.", "🧸"),
  card("t5-r1", 5, "rare", "Magicien Cinq", "Illusionniste expert", "Cinq tours en un clin d'œil.", "🎩"),
  card("t5-r2", 5, "rare", "Grande Roue", "Reine de la fête", "Cinq tours grandioses.", "🎡"),
  card("t5-e1", 5, "epic", "Feu d'Artifice", "Spectacle final", "Cinq explosions de couleurs.", "🎆"),
  card("t5-m1", 5, "mastery", "Maître de Piste", "Champion forain", "Tu maîtrises la table de 5 !", "🎪"),

  // Table de 6 — Grotte aux Cristaux
  card("t6-c1", 6, "common", "Cristal Bleu", "Gemme des cavernes", "Six facettes lumineuses.", "🔷"),
  card("t6-c2", 6, "common", "Chauve-souris", "Exploratrice de l'ombre", "Six sens pour voler.", "🦇"),
  card("t6-c3", 6, "common", "Luciole", "Étoile souterraine", "Six éclats dans le noir.", "✨"),
  card("t6-c4", 6, "common", "Stalactite Vive", "Gardienne de pierre", "Six gouttes par minute.", "🪨"),
  card("t6-r1", 6, "rare", "Golem de Quartz", "Sentinelle ancienne", "Six cristaux de pouvoir.", "🗿"),
  card("t6-r2", 6, "rare", "Araignée Gemme", "Tisseuse brillante", "Six pattes diamantées.", "🕷️"),
  card("t6-e1", 6, "epic", "Dragon Cristallin", "Souffle de lumière", "Six souffles magiques.", "💎"),
  card("t6-m1", 6, "mastery", "Cœur de Grotte", "Maître Cristallin", "Tu maîtrises la table de 6 !", "🏔️"),

  // Table de 7 — Château Mystérieux
  card("t7-c1", 7, "common", "Fantôme Gentil", "Esprit farceur", "Sept étages à hanter.", "👻"),
  card("t7-c2", 7, "common", "Chat Noir", "Gardien du couloir", "Sept vies mystérieuses.", "🐈‍⬛"),
  card("t7-c3", 7, "common", "Armure Animée", "Chevalier fantôme", "Sept pièces de fer.", "⚔️"),
  card("t7-c4", 7, "common", "Chandelier", "Éclaireur enchanté", "Sept flammes dansantes.", "🕯️"),
  card("t7-r1", 7, "rare", "Sorcier du Donjon", "Mage des sept", "Sept sorts puissants.", "🧙"),
  card("t7-r2", 7, "rare", "Licorne Nocturne", "Créature noble", "Sept étoiles dans sa crinière.", "🦄"),
  card("t7-e1", 7, "epic", "Roi Spectral", "Maître du château", "Sept couronnes fantômes.", "👑"),
  card("t7-m1", 7, "mastery", "Clé du Mystère", "Maître Mystérieux", "Tu maîtrises la table de 7 !", "🔑"),

  // Table de 8 — Espace Multiplié
  card("t8-c1", 8, "common", "Astéroïde Huit", "Voyageur spatial", "Huit cratères lunaires.", "☄️"),
  card("t8-c2", 8, "common", "Robot Spatial", "Copilote fidèle", "Huit fonctions stellaires.", "🛸"),
  card("t8-c3", 8, "common", "Étoile Octale", "Lueur de l'infini", "Huit branches cosmiques.", "🌟"),
  card("t8-c4", 8, "common", "Alien Ami", "Visiteur pacifique", "Huit tentacules amicaux.", "👽"),
  card("t8-r1", 8, "rare", "Nova Pourpre", "Explosion stellaire", "Huit ondes lumineuses.", "🌌"),
  card("t8-r2", 8, "rare", "Capitaine Cosmos", "Navigateur suprême", "Huit galaxies explorées.", "🧑‍🚀"),
  card("t8-e1", 8, "epic", "Trou Noir Sage", "Gardien de l'univers", "Huit dimensions maîtrisées.", "🕳️"),
  card("t8-m1", 8, "mastery", "Cœur Stellaire", "Maître de l'Espace", "Tu maîtrises la table de 8 !", "🪐"),

  // Table de 9 — Dragons Malins
  card("t9-c1", 9, "common", "Dragonnet Rouge", "Apprenti cracheur", "Neuf flammes timides.", "🔥"),
  card("t9-c2", 9, "common", "Dragon Vert", "Gardien des bois", "Neuf écailles moussues.", "🐲"),
  card("t9-c3", 9, "common", "Salamandre", "Danseuse de lave", "Neuf pas brûlants.", "🦎"),
  card("t9-c4", 9, "common", "Œuf Mystère", "Futur dragon", "Neuf jours avant l'éclosion.", "🥚"),
  card("t9-r1", 9, "rare", "Dragon d'Or", "Sage millénaire", "Neuf trésors cachés.", "🐉"),
  card("t9-r2", 9, "rare", "Vouivre Étoilée", "Serpent céleste", "Neuf constellations.", "🌠"),
  card("t9-e1", 9, "epic", "Dragon Ancestral", "Père des flammes", "Neuf souffles de sagesse.", "🐉"),
  card("t9-m1", 9, "mastery", "Couronne de Feu", "Maître Dragon", "Tu maîtrises la table de 9 !", "👑"),

  // Table de 10 — Ville Futuriste
  card("t10-c1", 10, "common", "Taxi Volant", "Transport rapide", "Dix étages en un éclair.", "🚕"),
  card("t10-c2", 10, "common", "Hologramme", "Guide urbain", "Dix messages lumineux.", "📱"),
  card("t10-c3", 10, "common", "Arbre Néon", "Nature augmentée", "Dix feuilles brillantes.", "🌴"),
  card("t10-c4", 10, "common", "Robot Facteur", "Livreur infaillible", "Dix colis par seconde.", "📦"),
  card("t10-r1", 10, "rare", "Tour Plasma", "Merveille d'énergie", "Dix étages de puissance.", "🏢"),
  card("t10-r2", 10, "rare", "IA Gardienne", "Protectrice de la cité", "Dix algorithmes parfaits.", "🧠"),
  card("t10-e1", 10, "epic", "Cité Infinie", "Vision du futur", "Dix dimensions connectées.", "🌃"),
  card("t10-m1", 10, "mastery", "Architecte du Futur", "Maître Futuriste", "Tu maîtrises la table de 10 !", "🏙️"),

  // Mode Mix — Royaume des Champions
  card("mix-c1", "mix", "common", "Éclaireur Royal", "Serviteur fidèle", "Champion de tous les mondes.", "⚡"),
  card("mix-c2", "mix", "common", "Héraut", "Messager du roi", "Il annonce tes victoires.", "📯"),
  card("mix-r1", "mix", "rare", "Chevalier d'Élite", "Guerrier mixte", "Maître de toutes les tables.", "🗡️"),
  card("mix-e1", "mix", "epic", "Roi des Champions", "Légende vivante", "Seul le meilleur le gagne.", "🏆")
]);

export const BADGES = Object.freeze([
  badge("first-session", "Premier entraînement", "Terminer ta première session.", "🎒", "firstSession"),
  badge("five-streak", "Série de 5", "5 bonnes réponses d'affilée.", "🔥", "fiveStreak"),
  badge("perfect-session", "Session parfaite", "Aucune erreur dans une session.", "💯", "perfectSession"),
  badge("first-rare-card", "Carte rare !", "Obtenir ta première carte rare.", "✨", "firstRareCard"),
  badge("first-epic-card", "Carte épique !", "Obtenir ta première carte épique.", "🌟", "firstEpicCard"),
  badge("ten-sessions", "10 sessions", "Terminer 10 sessions.", "🏅", "tenSessions"),
  badge("fifty-correct", "50 réussites", "50 bonnes réponses au total.", "📚", "fiftyCorrect"),
  badge("hundred-correct", "100 réussites", "100 bonnes réponses au total.", "🎓", "hundredCorrect"),
  badge("table-2-mastered", "Table de 2 ✓", "Maîtriser la table de 2.", "🌲", "tableMastered"),
  badge("table-3-mastered", "Table de 3 ✓", "Maîtriser la table de 3.", "🏝️", "tableMastered"),
  badge("table-4-mastered", "Table de 4 ✓", "Maîtriser la table de 4.", "🤖", "tableMastered"),
  badge("table-5-mastered", "Table de 5 ✓", "Maîtriser la table de 5.", "🎡", "tableMastered"),
  badge("table-6-mastered", "Table de 6 ✓", "Maîtriser la table de 6.", "💎", "tableMastered"),
  badge("table-7-mastered", "Table de 7 ✓", "Maîtriser la table de 7.", "🏰", "tableMastered"),
  badge("table-8-mastered", "Table de 8 ✓", "Maîtriser la table de 8.", "🚀", "tableMastered"),
  badge("table-9-mastered", "Table de 9 ✓", "Maîtriser la table de 9.", "🐉", "tableMastered"),
  badge("table-10-mastered", "Table de 10 ✓", "Maîtriser la table de 10.", "🌆", "tableMastered"),
  badge("easy-tables-mastered", "Tables faciles ✓", "Maîtriser les tables de 2, 5 et 10.", "⭐", "easyTablesMastered"),
  badge("all-tables-mastered", "Toutes les tables !", "Maîtriser toutes les tables.", "🏆", "allTablesMastered")
]);

function card(id, table, rarity, name, title, description, emoji) {
  return Object.freeze({ id, table, rarity, name, title, description, emoji });
}

function badge(id, name, description, emoji, condition) {
  return Object.freeze({ id, name, description, emoji, condition });
}
