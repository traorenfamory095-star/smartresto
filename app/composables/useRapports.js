import { ref, computed } from 'vue'

export function useRapports() {
  const periode = ref('30jours')
  const dateDebut = ref('')
  const dateFin = ref('')

  const chargement = ref(false)
  const erreur = ref(null)

  const commandes = ref([])
  const factures = ref([])
  const lignesCommande = ref([])
  const plats = ref([])
  const categories = ref([])
  const employes = ref([])
  const paiements = ref([])

  // Charger les données depuis les endpoints API du backend
  const chargerDonnees = async () => {
    chargement.value = true
    erreur.value = null
    try {
      const [resCmd, resFac, resLignes, resPlats, resCat, resEmp, resPaiements] = await Promise.all([
        $fetch('/api/commandes').catch(() => []),
        $fetch('/api/factures').catch(() => []),
        $fetch('/api/lignes-commande').catch(() => []),
        $fetch('/api/plats').catch(() => []),
        $fetch('/api/categories').catch(() => []),
        $fetch('/api/employes').catch(() => []),
        $fetch('/api/paiements').catch(() => [])
      ])

      commandes.value = Array.isArray(resCmd) ? resCmd : (resCmd.data || [])
      factures.value = Array.isArray(resFac) ? resFac : (resFac.data || [])
      lignesCommande.value = Array.isArray(resLignes) ? resLignes : (resLignes.data || [])
      plats.value = Array.isArray(resPlats) ? resPlats : (resPlats.data || [])
      categories.value = Array.isArray(resCat) ? resCat : (resCat.data || [])
      employes.value = Array.isArray(resEmp) ? resEmp : (resEmp.data || [])
      paiements.value = Array.isArray(resPaiements) ? resPaiements : (resPaiements.data || [])

    } catch (err) {
      erreur.value = "Erreur lors de la récupération des rapports via l'API."
      console.error(err)
    } finally {
      chargement.value = false
    }
  }

  // Helper pour formater les dates en YYYY-MM-DD
  const formaterDateISO = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().split('T')[0]
  }

  // Filtrage des commandes selon la période sélectionnée
  const commandesFiltrees = computed(() => {
    const aujourdhui = new Date()
    
    return commandes.value.filter(cmd => {
      const statutPaye = cmd.statut === 'payee' || cmd.statut === 'terminee' || cmd.statut === 'validee' || cmd.statut === 'confirmee'
      if (!statutPaye) return false

      const dateCmdStr = cmd.creeLe || cmd.date || cmd.createdAt
      if (!dateCmdStr) return false
      
      const dateCmd = new Date(dateCmdStr)
      const dateCmdISO = formaterDateISO(dateCmdStr)

      if (periode.value === 'aujourdhui') {
        return dateCmdISO === formaterDateISO(aujourdhui)
      }

      if (periode.value === '7jours') {
        const ilYa7Jours = new Date()
        ilYa7Jours.setDate(aujourdhui.getDate() - 7)
        return dateCmd >= ilYa7Jours
      }

      if (periode.value === '30jours') {
        const ilYa30Jours = new Date()
        ilYa30Jours.setDate(aujourdhui.getDate() - 30)
        return dateCmd >= ilYa30Jours
      }

      if (periode.value === 'personnalise') {
        if (!dateDebut.value || !dateFin.value) return true
        return dateCmdISO >= dateDebut.value && dateCmdISO <= dateFin.value
      }

      return true
    })
  })

  // KPIs Financiers
  const chiffreAffairesTotal = computed(() => {
    return commandesFiltrees.value.reduce((acc, cmd) => {
      const montant = Number(cmd.total || cmd.montant || 0)
      return acc + (isNaN(montant) ? 0 : montant)
    }, 0)
  })

  const nombreCommandes = computed(() => commandesFiltrees.value.length)

  const ticketMoyen = computed(() => {
    if (nombreCommandes.value === 0) return 0
    const tm = chiffreAffairesTotal.value / nombreCommandes.value
    return isNaN(tm) ? 0 : tm
  })

  const nombreCouvertsTotal = computed(() => {
    return commandesFiltrees.value.reduce((acc, cmd) => {
      const nb = Number(cmd.nombreCouverts || cmd.nbPersonnes || cmd.couverts || 1)
      return acc + (isNaN(nb) ? 0 : nb)
    }, 0)
  })

  // Groupement du Chiffre d'affaires par jour
  const caParJour = computed(() => {
    const groupes = {}
    
    commandesFiltrees.value.forEach(cmd => {
      const dateStr = cmd.creeLe || cmd.date || cmd.createdAt
      const key = formaterDateISO(dateStr)
      if (!key) return

      const montant = Number(cmd.total || cmd.montant || 0)
      groupes[key] = (groupes[key] || 0) + (isNaN(montant) ? 0 : montant)
    })

    return Object.keys(groupes).sort().map(dateIso => {
      const d = new Date(dateIso)
      const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
      return {
        date: dateIso,
        libelle: jours[d.getDay()] || dateIso,
        total: groupes[dateIso]
      }
    })
  })

  // Top 5 des Plats vendus
  const topPlats = computed(() => {
    const idsCommandesValides = new Set(commandesFiltrees.value.map(c => c.id))
    const statsPlats = {}

    lignesCommande.value.forEach(ligne => {
      if (idsCommandesValides.has(ligne.commandeId)) {
        const platId = ligne.platId
        const qte = Number(ligne.quantite || 1)
        const prix = Number(ligne.prixUnitaire || ligne.prix || 0)

        if (!statsPlats[platId]) {
          statsPlats[platId] = { quantite: 0, revenu: 0 }
        }
        statsPlats[platId].quantite += qte
        statsPlats[platId].revenu += qte * prix
      }
    })

    return Object.keys(statsPlats)
      .map(platId => {
        const platInfo = plats.value.find(p => String(p.id) === String(platId))
        return {
          id: platId,
          nom: platInfo ? platInfo.nom : `Plat #${platId}`,
          quantite: statsPlats[platId].quantite,
          revenu: statsPlats[platId].revenu
        }
      })
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 5)
  })

  // Ventes par catégorie
  const ventesParCategorie = computed(() => {
    const idsCommandesValides = new Set(commandesFiltrees.value.map(c => c.id))
    const totauxCat = {}

    lignesCommande.value.forEach(ligne => {
      if (idsCommandesValides.has(ligne.commandeId)) {
        const platInfo = plats.value.find(p => String(p.id) === String(ligne.platId))
        const catId = platInfo ? platInfo.categorieId : 'autres'
        const qte = Number(ligne.quantite || 1)
        const prix = Number(ligne.prixUnitaire || ligne.prix || 0)

        totauxCat[catId] = (totauxCat[catId] || 0) + (qte * prix)
      }
    })

    const totalGlobal = chiffreAffairesTotal.value || 1

    return categories.value.map(cat => {
      const total = totauxCat[cat.id] || 0
      return {
        nom: cat.nom,
        total,
        pourcentage: Math.min(100, Math.round((total / totalGlobal) * 100))
      }
    })
  })

  // Ventes par serveur
  const topServeurs = computed(() => {
    const statsServeurs = {}

    commandesFiltrees.value.forEach(cmd => {
      const empId = cmd.employeId || cmd.serveurId
      if (!empId) return

      const montant = Number(cmd.total || cmd.montant || 0)
      if (!statsServeurs[empId]) {
        statsServeurs[empId] = { nbCommandes: 0, ca: 0 }
      }
      statsServeurs[empId].nbCommandes += 1
      statsServeurs[empId].ca += isNaN(montant) ? 0 : montant
    })

    return Object.keys(statsServeurs)
      .map(empId => {
        const emp = employes.value.find(e => String(e.id) === String(empId))
        const nomComplet = emp ? `${emp.prenom || ''} ${emp.nom || ''}`.trim() : `Serveur #${empId}`
        const initiales = emp ? `${(emp.prenom || 'S')[0]}${(emp.nom || '')[0] || ''}`.toUpperCase() : 'S'

        return {
          id: empId,
          nom: nomComplet,
          initiales,
          nbCommandes: statsServeurs[empId].nbCommandes,
          ca: statsServeurs[empId].ca
        }
      })
      .sort((a, b) => b.ca - a.ca)
  })

  // Répartition par mode de paiement
  const ventesParPaiement = computed(() => {
    const res = { especes: 0, mobile_money: 0, carte: 0 }
    const idsCommandesValides = new Set(commandesFiltrees.value.map(c => c.id))

    if (paiements.value.length > 0) {
      paiements.value.forEach(p => {
        if (idsCommandesValides.has(p.commandeId)) {
          const mode = (p.mode || p.methode || 'especes').toLowerCase()
          const montant = Number(p.montant || 0)
          if (res[mode] !== undefined) {
            res[mode] += montant
          } else {
            res.especes += montant
          }
        }
      })
    } else {
      commandesFiltrees.value.forEach(cmd => {
        const mode = (cmd.modePaiement || 'especes').toLowerCase()
        const montant = Number(cmd.total || 0)
        if (res[mode] !== undefined) {
          res[mode] += montant
        } else {
          res.especes += montant
        }
      })
    }

    return res
  })

  // Formateur de date en français
  const formaterDateCourte = (dateObj) => {
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '')
  }

  // Plage de dates dynamique pour l'affichage dans l'en-tête
  const libellePeriode = computed(() => {
    const aujourdhui = new Date()
    let debut = new Date()

    if (periode.value === 'aujourdhui') {
      return formaterDateCourte(aujourdhui)
    }

    if (periode.value === '7jours') {
      debut.setDate(aujourdhui.getDate() - 7)
      return `${formaterDateCourte(debut)} → ${formaterDateCourte(aujourdhui)}`
    }

    if (periode.value === '30jours') {
      debut.setDate(aujourdhui.getDate() - 30)
      return `${formaterDateCourte(debut)} → ${formaterDateCourte(aujourdhui)}`
    }

    if (periode.value === 'personnalise' && dateDebut.value && dateFin.value) {
      return `${formaterDateCourte(new Date(dateDebut.value))} → ${formaterDateCourte(new Date(dateFin.value))}`
    }

    return "Sélectionnez une période"
  })

  // Export CSV
  const exporterCSV = () => {
    let csv = 'ID Commande;Date;Statut;Nombre Couverts;Total ($)\n'

    commandesFiltrees.value.forEach(cmd => {
      const dateStr = cmd.creeLe || cmd.date || ''
      const total = cmd.total || 0
      const couverts = cmd.nombreCouverts || cmd.nbPersonnes || 1
      csv += `${cmd.id};"${dateStr}";"${cmd.statut}";${couverts};${total}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `rapport_ventes_${periode.value}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Charger automatiquement au montage
  chargerDonnees()

  return {
    periode,
    dateDebut,
    dateFin,
    libellePeriode,
    chargement,
    erreur,
    chargerDonnees,
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