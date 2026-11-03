// Règles du formulaire de contact. Propriétaire : Traoré (site public).
// Fonctions pures (testables) : la page ne fait qu'afficher leur résultat.

export const SUJETS_CONTACT = [
  { valeur: 'reservation', libelle: 'Question sur une réservation' },
  { valeur: 'evenement', libelle: 'Événement privé' },
  { valeur: 'avis', libelle: 'Partager un avis' },
  { valeur: 'autre', libelle: 'Autre demande' },
]

export const MESSAGE_MIN = 10
export const MESSAGE_MAX = 1000

const MODELE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// validerContact(champs) -> { nom, email, sujet, message }
// Chaque clé contient le texte de l'erreur, ou '' si le champ est correct.
export function validerContact({ nom = '', email = '', sujet = '', message = '' } = {}) {
  const texte = String(message).trim()
  return {
    nom: String(nom).trim().length >= 2 ? '' : 'Indiquez votre nom (2 caractères au minimum).',
    email: MODELE_EMAIL.test(String(email).trim()) ? '' : 'Indiquez une adresse e-mail valide.',
    sujet: SUJETS_CONTACT.some((s) => s.valeur === sujet) ? '' : 'Choisissez un sujet dans la liste.',
    message:
      texte.length < MESSAGE_MIN
        ? `Votre message doit contenir au moins ${MESSAGE_MIN} caractères.`
        : texte.length > MESSAGE_MAX
          ? `Votre message ne doit pas dépasser ${MESSAGE_MAX} caractères.`
          : '',
  }
}

// true si aucune erreur : contactValide(validerContact(champs))
export function contactValide(erreurs) {
  return !Object.values(erreurs).some(Boolean)
}