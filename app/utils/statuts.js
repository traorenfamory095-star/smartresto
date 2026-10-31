// Libellés et tons des statuts, partagés par tous les modules. Propriétaire : Traoré (socle).
// Valeurs = celles des fichiers db/*.json. Le ton choisit la couleur du badge (voir <UiBadge>).

export const STATUTS = {
  commande: {
    en_attente: { libelle: 'En attente', ton: 'neutre' },
    en_preparation: { libelle: 'En préparation', ton: 'accent' },
    prete: { libelle: 'Prête', ton: 'succes' },
    servie: { libelle: 'Servie', ton: 'clair' },
    payee: { libelle: 'Payée', ton: 'sombre' },
    annulee: { libelle: 'Annulée', ton: 'erreur' },
  },
  // statutCuisine d'une ligne de commande
  ligneCuisine: {
    en_attente: { libelle: 'À préparer', ton: 'neutre' },
    en_preparation: { libelle: 'En préparation', ton: 'accent' },
    prete: { libelle: 'Prête', ton: 'succes' },
  },
  facture: {
    emise: { libelle: 'Émise', ton: 'accent' },
    payee: { libelle: 'Payée', ton: 'succes' },
    annulee: { libelle: 'Annulée', ton: 'erreur' },
  },
  approvisionnement: {
    commande: { libelle: 'Commandé', ton: 'accent' },
    recue: { libelle: 'Reçu', ton: 'succes' },
    a_verifier: { libelle: 'À vérifier', ton: 'erreur' },
  },
  reservation: {
    confirmee: { libelle: 'Confirmée', ton: 'succes' },
    annulee: { libelle: 'Annulée', ton: 'erreur' },
  },
}

// infoStatut('commande', 'prete') -> { libelle: 'Prête', ton: 'succes' }
// Un statut inconnu s'affiche tel quel en gris : la page ne plante jamais.
export function infoStatut(type, statut) {
  return STATUTS[type]?.[statut] ?? { libelle: statut ?? '—', ton: 'neutre' }
}

// Cycle de vie d'une commande (CONTRIBUTING.md, section 3) :
// en_attente -> en_preparation -> prete -> servie -> payee, et annulee avant « payee ».
export const ORDRE_COMMANDE = ['en_attente', 'en_preparation', 'prete', 'servie', 'payee']

// transitionCommandeValide('prete', 'servie') -> true ; ('en_attente', 'prete') -> false
// Chaque module garde le droit d'écrire seulement SES transitions (CONTRIBUTING.md, section 2) :
// cette fonction ne dit que si le passage respecte le cycle.
export function transitionCommandeValide(de, vers) {
  if (vers === 'annulee') return ORDRE_COMMANDE.slice(0, -1).includes(de)
  const i = ORDRE_COMMANDE.indexOf(de)
  const j = ORDRE_COMMANDE.indexOf(vers)
  return i !== -1 && j !== -1 && j === i + 1
}
