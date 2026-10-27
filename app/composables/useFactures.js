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
    const reste = Number(totalFacture) - totalPaiements(paiements)

    return Math.max(0, Math.round(reste * 100) / 100)
    }

  return {
    listerFactures,
    obtenirFacture,
    listerPaiements,
    creerFacture,
    modifierFacture,
    creerPaiement,
    marquerCommandePayee,
    totalPaiements,
    resteAPayer,
  }
}