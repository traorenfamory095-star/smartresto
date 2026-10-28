export function usePersonnel() {
  const { lire, creer, modifier } = useApi()

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

async function obtenirEmploye(id) {
  const employe = await lire(`/employes/${encodeURIComponent(id)}`)

  return {
    id: employe.id,
    nom: employe.nom,
    email: employe.email,
    role: employe.role,
    actif: employe.actif,
  }
}

async function modifierEmploye(id, donnees) {
  const nom = String(donnees.nom ?? '').trim()
  const email = String(donnees.email ?? '').trim().toLowerCase()

  if (!nom) {
    throw new Error('Le nom est obligatoire.')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('L’adresse e-mail est invalide.')
  }

  if (!ROLES.includes(donnees.role)) {
    throw new Error('Le rôle sélectionné est invalide.')
  }

  const employes = await lire('/employes')
  const memeId = (employe) => String(employe.id) === String(id)
  const employeActuel = employes.find(memeId)

  if (!employeActuel) {
    throw new Error('Cet employé n’existe plus.')
  }

  const emailExiste = employes.some(
    (employe) =>
      !memeId(employe) &&
      String(employe.email).trim().toLowerCase() === email,
  )

  if (emailExiste) {
    throw new Error('Cette adresse e-mail est déjà utilisée.')
  }

  const adminsActifs = employes.filter(
    (employe) => employe.role === 'admin' && employe.actif === true,
  )

  const retireDernierAdmin =
    employeActuel.role === 'admin' &&
    employeActuel.actif === true &&
    adminsActifs.length === 1 &&
    (donnees.role !== 'admin' || donnees.actif !== true)

  if (retireDernierAdmin) {
    throw new Error(
      'Impossible de désactiver le dernier administrateur actif ou de changer son rôle.',
    )
  }

  // PATCH conserve le mot de passe et la date de création.
  await modifier(`/employes/${encodeURIComponent(id)}`, {
    nom,
    email,
    role: donnees.role,
    actif: donnees.actif === true,
  })
}

return {
  obtenirPersonnel,
  creerEmploye,
  obtenirEmploye,
  modifierEmploye,
}
}