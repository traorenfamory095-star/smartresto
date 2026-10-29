export function useFactures() {
  const { lire, creer, modifier } = useApi()

  function listerFactures(parametres = {}) {
    return lire('/factures', parametres)
  }

  function obtenirFacture(id) {
    return lire(`/factures/${id}`)
  }

  function listerPaiements(factureId) {
    return lire('/paiements', { factureId })
  }

  function creerFacture(donnees) {
    return creer('/factures', donnees)
  }

  function modifierFacture(id, donnees) {
    return modifier(`/factures/${id}`, donnees)
  }

  function creerPaiement(donnees) {
    return creer('/paiements', donnees)
  }

  function marquerCommandePayee(commandeId) {
    return modifier(`/commandes/${commandeId}`, {
      statut: 'payee',
    })
  }

  function totalPaiements(paiements = []) {
    const total = paiements.reduce((somme, paiement) => {
      return somme + Number(paiement.montant || 0)
    }, 0)

    return Math.round(total * 100) / 100
  }

  function resteAPayer(totalFacture, paiements = []) {
    const reste =
      Number(totalFacture) - totalPaiements(paiements)

    return Math.max(
      0,
      Math.round(reste * 100) / 100
    )
  }

  function listerCommandes(parametres = {}) {
    return lire('/commandes', parametres)
  }

  function listerLignesCommande(commandeId) {
    return lire('/lignesCommande', {
      commandeId,
    })
  }

  function arrondirMonnaie(montant) {
    return Math.round(Number(montant) * 100) / 100
  }

  function calculerMontants(
    lignes = [],
    remisePourcentage = 0,
    tauxTaxe = 16
  ) {
    const sousTotal = arrondirMonnaie(
      lignes.reduce((somme, ligne) => {
        return (
          somme +
          Number(ligne.prixUnitaire) *
            Number(ligne.quantite)
        )
      }, 0)
    )

    const pourcentage = Math.max(
      0,
      Math.min(
        100,
        Number(remisePourcentage) || 0
      )
    )

    const remise = arrondirMonnaie(
      (sousTotal * pourcentage) / 100
    )

    const baseTaxable = arrondirMonnaie(
      sousTotal - remise
    )

    const taxe = arrondirMonnaie(
      (baseTaxable * Number(tauxTaxe)) / 100
    )

    const total = arrondirMonnaie(
      baseTaxable + taxe
    )

    return {
      sousTotal,
      remise,
      taxe,
      total,
    }
  }

  function genererNumeroFacture(
    factures = [],
    annee = new Date().getFullYear()
  ) {
    const prefixe = `F-${annee}-`

    const sequences = factures
      .map((facture) => facture.numero)
      .filter((numero) =>
        numero?.startsWith(prefixe)
      )
      .map((numero) =>
        Number(numero.split('-').at(-1))
      )
      .filter((numero) =>
        Number.isInteger(numero)
      )

    const prochaineSequence =
      sequences.length > 0
        ? Math.max(...sequences) + 1
        : 1

    return `${prefixe}${String(
      prochaineSequence
    ).padStart(4, '0')}`
  }

  return {
    listerFactures,
    obtenirFacture,
    listerPaiements,
    listerCommandes,
    listerLignesCommande,

    creerFacture,
    modifierFacture,
    creerPaiement,
    marquerCommandePayee,

    totalPaiements,
    resteAPayer,
    calculerMontants,
    genererNumeroFacture,
  }
}