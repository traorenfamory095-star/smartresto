export function usePersonnel() {
  const { lire, creer } = useApi()

  async function obtenirPersonnel() {
    const employes = await lire('/employes')

    return employes.map((employe) => ({
      id: employe.id,
      nom: employe.nom,
      email: employe.email,
      role: employe.role,
      actif: employe.actif,
    }))
  }
  async function creerEmploye(donnees) {
  const nom = String(donnees.nom ?? '').trim()
  const email = String(donnees.email ?? '').trim().toLowerCase()
  const motDePasse = String(donnees.motDePasse ?? '')

  if (!nom) {
    throw new Error('Le nom est obligatoire.')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('L’adresse e-mail est invalide.')
  }

  if (!motDePasse.trim()) {
    throw new Error('Le mot de passe est obligatoire.')
  }

  if (!ROLES.includes(donnees.role)) {
    throw new Error('Le rôle sélectionné est invalide.')
  }

  const employes = await lire('/employes')

  const emailExiste = employes.some(
    (employe) =>
      String(employe.email).trim().toLowerCase() === email,
  )

  if (emailExiste) {
    throw new Error('Cette adresse e-mail est déjà utilisée.')
  }

  await creer('/employes', {
    nom,
    email,
    motDePasse,
    role: donnees.role,
    actif: donnees.actif === true,
    creeLe: new Date().toISOString(),
  })
}

return { obtenirPersonnel, creerEmploye }
}