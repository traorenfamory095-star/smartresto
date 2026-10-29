// composables/useRapports.js
function useRapports() {
  const { $api } = useNuxtApp()

  const periode = ref('7jours')
  const dateDebut = ref('')
  const dateFin = ref('')
  const chargement = ref(false)
  const erreur = ref(null)

  const commandes = ref([])
  const lignesCommande = ref([])
  const plats = ref([])
  const categories = ref([])
  const employes = ref([])
  const factures = ref([])
  const paiements = ref([])

  const chargerDonnees = async () => {
    chargement.value = true
    erreur.value = null
    try {
      const safeFetch = async (url) => {
        try {
          return await $api(url)
        } catch (e) {
          console.warn(`Impossible de charger l'endpoint ${url}:`, e)
          return []
        }
      }

      const [resCmd, resLignes, resPlats, resCat, resEmp, resFac, resPai] = await Promise.all([
        safeFetch('/commandes?statut=payee'),
        safeFetch('/lignesCommande'),
        safeFetch('/plats'),
        safeFetch('/categories'),
        safeFetch('/employes'),
        safeFetch('/factures'),
        safeFetch('/paiements')
      ])

      commandes.value = Array.isArray(resCmd) ? resCmd : []
      lignesCommande.value = Array.isArray(resLignes) ? resLignes : []
      plats.value = Array.isArray(resPlats) ? resPlats : []
      categories.value = Array.isArray(resCat) ? resCat : []
      employes.value = Array.isArray(resEmp) ? resEmp : []
      factures.value = Array.isArray(resFac) ? resFac : []
      paiements.value = Array.isArray(resPai) ? resPai : []
    } catch (err) {
      erreur.value = "Erreur lors du chargement des données de rapports."
      console.error(err)
    } finally {
      chargement.value = false
    }
  }

  // Calcul des dates de début et fin selon la période sélectionnée
  const datesActuelles = computed(() => {
    const maintenant = new Date()
    let debut = new Date()
    let fin = new Date()

    if (periode.value === 'aujourdhui') {
      debut = new Date(maintenant)
      fin = new Date(maintenant)
    } else if (periode.value === '7jours') {
      debut.setDate(maintenant.getDate() - 7)
    } else if (periode.value === '30jours') {
      debut.setDate(maintenant.getDate() - 30)
    } else if (periode.value === 'personnalise' && dateDebut.value && dateFin.value) {
      debut = new Date(dateDebut.value)
      fin = new Date(dateFin.value)
    }
    return { debut, fin }
  })

  // Libellé formaté pour l'affichage (ex: "01 oct. 2026 → 21 oct. 2026")
  const libellePeriode = computed(() => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' }
    const { debut, fin } = datesActuelles.value
    const dStr = debut.toLocaleDateString('fr-FR', options)
    const fStr = fin.toLocaleDateString('fr-FR', options)
    return `${dStr} → ${fStr}`
  })

  const commandesFiltrees = computed(() => {
    const { debut, fin } = datesActuelles.value
    fin.setHours(23, 59, 59)

    return commandes.value.filter(cmd => {
      const dateCmd = new Date(cmd.creeLe || cmd.date || Date.now())
      if (periode.value === 'aujourdhui') {
        return dateCmd.toDateString() === debut.toDateString()
      }
      return dateCmd >= debut && dateCmd <= fin
    })
  })

  const chiffreAffairesTotal = computed(() => {
    return commandesFiltrees.value.reduce((acc, cmd) => {
      const fac = factures.value.find(f => f.commandeId === cmd.id)
      return acc + (fac ? Number(fac.total) : Number(cmd.total || 0))
    }, 0)
  })

  const nombreCommandes = computed(() => commandesFiltrees.value.length)

  const nombreCouvertsTotal = computed(() => {
    return commandesFiltrees.value.reduce((acc, cmd) => acc + (Number(cmd.nbCouverts || cmd.couverts) || 1), 0)
  })

  const ticketMoyen = computed(() => {
    if (nombreCommandes.value === 0) return 0
    return chiffreAffairesTotal.value / nombreCommandes.value
  })

  const caParJour = computed(() => {
    const mapJours = {}
    commandesFiltrees.value.forEach(cmd => {
      const d = new Date(cmd.creeLe || cmd.date || Date.now())
      const jourStr = d.toISOString().split('T')[0]
      const libelle = d.toLocaleDateString('fr-FR', { weekday: 'short' })
      const fac = factures.value.find(f => f.commandeId === cmd.id)
      const montant = fac ? Number(fac.total) : Number(cmd.total || 0)
      if (!mapJours[jourStr]) mapJours[jourStr] = { libelle, total: 0 }
      mapJours[jourStr].total += montant
    })
    return Object.keys(mapJours).sort().map(date => ({ date, ...mapJours[date] }))
  })

  const topPlats = computed(() => {
    const idsFiltres = new Set(commandesFiltrees.value.map(c => c.id))
    const mapPlats = {}
    lignesCommande.value.forEach(ligne => {
      if (idsFiltres.has(ligne.commandeId)) {
        if (!mapPlats[ligne.platId]) {
          mapPlats[ligne.platId] = { qte: 0, revenu: 0 }
        }
        mapPlats[ligne.platId].qte += Number(ligne.quantite || 1)
        mapPlats[ligne.platId].revenu += Number(ligne.quantite || 1) * Number(ligne.prixUnitaire || ligne.prix || 0)
      }
    })
    return Object.keys(mapPlats).map(platId => {
      const plat = plats.value.find(p => p.id == platId)
      return {
        nom: plat ? plat.nom : 'Plat inconnu',
        quantite: mapPlats[platId].qte,
        revenu: mapPlats[platId].revenu
      }
    }).sort((a, b) => b.revenu - a.revenu).slice(0, 5)
  })

  const ventesParCategorie = computed(() => {
    const idsFiltres = new Set(commandesFiltrees.value.map(c => c.id))
    const mapCat = {}
    let totalGlobal = 0
    lignesCommande.value.forEach(l => {
      if (idsFiltres.has(l.commandeId)) {
        const p = plats.value.find(x => x.id == l.platId)
        if (p) {
          const cat = categories.value.find(c => c.id == p.categorieId)
          const nomCat = cat ? cat.nom : 'Autres'
          const montant = Number(l.quantite || 1) * Number(l.prixUnitaire || l.prix || 0)
          if (!mapCat[nomCat]) mapCat[nomCat] = 0
          mapCat[nomCat] += montant
          totalGlobal += montant
        }
      }
    })
    return Object.keys(mapCat).map(nom => ({
      nom,
      total: mapCat[nom],
      pourcentage: totalGlobal > 0 ? Math.round((mapCat[nom] / totalGlobal) * 100) : 0
    })).sort((a, b) => b.total - a.total)
  })

  const topServeurs = computed(() => {
    const mapEmp = {}
    commandesFiltrees.value.forEach(c => {
      const empId = c.employeId || c.serveurId
      const fac = factures.value.find(f => f.commandeId === c.id)
      const montant = fac ? Number(fac.total) : Number(c.total || 0)
      if (empId) {
        if (!mapEmp[empId]) mapEmp[empId] = { nb: 0, ca: 0 }
        mapEmp[empId].nb += 1
        mapEmp[empId].ca += montant
      }
    })
    return Object.keys(mapEmp).map(id => {
      const e = employes.value.find(x => x.id == id)
      const nomComplet = e ? `${e.prenom || ''} ${e.nom || ''}`.trim() : 'Serveur'
      const initiales = nomComplet.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SV'
      return {
        nom: nomComplet,
        initiales,
        nbCommandes: mapEmp[id].nb,
        ca: mapEmp[id].ca
      }
    }).sort((a, b) => b.ca - a.ca).slice(0, 3)
  })

  const ventesParPaiement = computed(() => {
    const idsFiltres = new Set(commandesFiltrees.value.map(c => c.id))
    const idsFacFiltrees = new Set(factures.value.filter(f => idsFiltres.has(f.commandeId)).map(f => f.id))
    const modes = { especes: 0, mobile_money: 0, carte: 0 }
    paiements.value.forEach(p => {
      if (idsFacFiltrees.has(p.factureId)) {
        if (modes[p.mode] !== undefined) {
          modes[p.mode] += Number(p.montant || 0)
        }
      }
    })
    return modes
  })

  const exporterCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID Commande,Date,Couverts,Total (USD)\n"
    commandesFiltrees.value.forEach(cmd => {
      const fac = factures.value.find(f => f.commandeId === cmd.id)
      const total = fac ? fac.total : (cmd.total || 0)
      csvContent += `${cmd.id},${cmd.creeLe || cmd.date || ''},${cmd.nbCouverts || 1},${total}\n`
    })
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `rapport_ventes_${periode.value}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    periode,
    dateDebut,
    dateFin,
    libellePeriode,
    chargement,
    erreur,
    chargerDonnees,
    commandesFiltrees,
    chiffreAffairesTotal,
    nombreCommandes,
    nombreCouvertsTotal,
    ticketMoyen,
    caParJour,
    topPlats,
    ventesParCategorie,
    topServeurs,
    ventesParPaiement,
    exporterCSV
  }
}

export { useRapports }