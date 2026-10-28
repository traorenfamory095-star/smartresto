export function usePersonnel() {
  const { lire } = useApi()

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

  return { obtenirPersonnel }
}