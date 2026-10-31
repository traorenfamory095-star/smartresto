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

  // Charger toutes les données de l'API (port 3001)
  const chargerDonnees = async () => {
    chargement.value = true
    erreur.value = null
    try {
      const [resCmd, resFac, resLignes, resPlats, resCat, resEmp, resPaiements] = await Promise.all([
        $fetch('http://localhost:3001/commandes').catch(() => []),
        $fetch('http://localhost:3001/factures').catch(() => []),
        $fetch('http://localhost:3001/lignesCommande').catch(() => []),
        $fetch('http://localhost:3001/plats').catch(() => []),
        $fetch('http://localhost:3001/categories').catch(() => []),
        $fetch('http://localhost:3001/employes').catch(() => []),
        $fetch('http://localhost:3001/paiements').catch(() => [])
      ])

      commandes.value = Array.isArray(resCmd) ? resCmd : (resCmd?.data || [])
      factures.value = Array.isArray(resFac) ? resFac : (resFac?.data || [])
      lignesCommande.value = Array.isArray(resLignes) ? resLignes : (resLignes?.data || [])
      plats.value = Array.isArray(resPlats) ? resPlats : (resPlats?.data || [])
      categories.value = Array.isArray(resCat) ? resCat : (resCat?.data || [])
      employes.value = Array.isArray(resEmp) ? resEmp : (resEmp?.data || [])
      paiements.value = Array.isArray(resPaiements) ? resPaiements : (resPaiements?.data || [])

      console.log("Données chargées - Commandes:", commandes.value.length, "| Paiements:", paiements.value.length)
    } catch (err) {
      erreur.value = "Erreur lors de la récupération des rapports via l'API."
      console.error(err)
    } finally {
      chargement.value = false
    }
  }

  const formaterDateISO = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0]
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0]
  }

  // Filtrage temporel des commandes basé sur la VRAIE date du système
  const commandesFiltrees = computed(() => {
    if (!commandes.value || !Array.isArray(commandes.value)) return []
    if (commandes.value.length === 0) return []

    const referenceDate = new Date()
    referenceDate.setHours(23, 59, 59)

    return commandes.value.filter(cmd => {
      const dateStr = cmd?.creeLe || cmd?.date || cmd?.createdAt
      if (!dateStr) return true

      const dateCmd = new Date(dateStr)
      if (isNaN(dateCmd.getTime())) return true

      const diffTemps = referenceDate - dateCmd
      const diffJours = diffTemps / (1000 * 60 * 60 * 24)

      if (periode.value === 'aujourdhui') {
        return dateCmd.toDateString() === referenceDate.toDateString()
      } else if (periode.value === '7jours') {
        return diffJours >= 0 && diffJours <= 7
      } else if (periode.value === '30jours') {
        return diffJours >= 0 && diffJours <= 30
      } else if (periode.value === 'personnalise' && dateDebut.value && dateFin.value) {
        const dDebut = new Date(dateDebut.value)
        const dFin = new Date(dateFin.value)
        dFin.setHours(23, 59, 59)
        return dateCmd >= dDebut && dateCmd <= dFin
      }

      return true
    })
  })

  // Filtrage direct des paiements basé sur la VRAIE date du système
  const paiementsFiltres = computed(() => {
    const listePaiements = Array.isArray(paiements.value) ? paiements.value : []
    if (listePaiements.length === 0) return []

    const referenceDate = new Date()
    referenceDate.setHours(23, 59, 59)

    return listePaiements.filter(p => {
      const dateStr = p?.date || p?.creeLe
      if (!dateStr) return true

      const datePaiement = new Date(dateStr)
      if (isNaN(datePaiement.getTime())) return true

      const diffTemps = referenceDate - datePaiement
      const diffJours = diffTemps / (1000 * 60 * 60 * 24)

      if (periode.value === 'aujourdhui') {
        return datePaiement.toDateString() === referenceDate.toDateString()
      } else if (periode.value === '7jours') {
        return diffJours >= 0 && diffJours <= 7
      } else if (periode.value === '30jours') {
        return diffJours >= 0 && diffJours <= 30
      } else if (periode.value === 'personnalise' && dateDebut.value && dateFin.value) {
        const dDebut = new Date(dateDebut.value)
        const dFin = new Date(dateFin.value)
        dFin.setHours(23, 59, 59)
        return datePaiement >= dDebut && datePaiement <= dFin
      }

      return true
    })
  })

  // Libellé dynamique
  const libellePeriode = computed(() => {
    const maxDate = new Date()
    const options = { day: 'numeric', month: 'short', year: 'numeric' }

    if (periode.value === 'aujourdhui') {
      const dateStr = maxDate.toLocaleDateString('fr-FR', options)
      return `Aujourd'hui (${dateStr})`
    } 
    
    if (periode.value === '7jours') {
      const minDate = new Date(maxDate)
      minDate.setDate(minDate.getDate() - 7)
      return `${minDate.toLocaleDateString('fr-FR', options)} → ${maxDate.toLocaleDateString('fr-FR', options)}`
    } 
    
    if (periode.value === '30jours') {
      const minDate = new Date(maxDate)
      minDate.setDate(minDate.getDate() - 30)
      return `${minDate.toLocaleDateString('fr-FR', options)} → ${maxDate.toLocaleDateString('fr-FR', options)}`
    } 
    
    if (periode.value === 'personnalise' && dateDebut.value && dateFin.value) {
      return `${dateDebut.value} → ${dateFin.value}`
    }

    const minDate = new Date(maxDate)
    minDate.setDate(minDate.getDate() - 30)
    return `${minDate.toLocaleDateString('fr-FR', options)} → ${maxDate.toLocaleDateString('fr-FR', options)}`
  })

  // Chiffre d'affaires total basé strictement sur les paiements filtrés de l'API
  const chiffreAffairesTotal = computed(() => {
    const sourcePaiements = paiementsFiltres.value
    
    const total = sourcePaiements.reduce((acc, p) => {
      const montant = Number(p?.montant || p?.total || 0)
      return acc + (isNaN(montant) ? 0 : montant)
    }, 0)

    return total
  })

  const nombreCommandes = computed(() => {
    return commandesFiltrees.value.length
  })

  const ticketMoyen = computed(() => {
    const nb = nombreCommandes.value
    if (nb === 0) return 0
    const tm = chiffreAffairesTotal.value / nb
    return isNaN(tm) ? 0 : tm
  })

  const nombreCouvertsTotal = computed(() => {
    const total = commandesFiltrees.value.reduce((acc, cmd) => {
      const nb = Number(cmd?.nombreCouverts || cmd?.nbPersonnes || 2)
      return acc + (isNaN(nb) ? 2 : nb)
    }, 0)
    return total
  })

  // CA par jour basé sur les paiements filtrés de l'API
  const caParJour = computed(() => {
    const groupes = {}
    const sourcePaiements = paiementsFiltres.value

    sourcePaiements.forEach(p => {
      const dateStr = p?.date || p?.creeLe || new Date().toISOString()
      const key = formaterDateISO(dateStr)
      const montant = Number(p?.montant || p?.total || 0)
      groupes[key] = (groupes[key] || 0) + (isNaN(montant) ? 0 : montant)
    })

    const resultats = Object.keys(groupes).sort().map(dateIso => {
      const d = new Date(dateIso)
      const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
      const valTotale = Number(groupes[dateIso])
      return {
        date: dateIso,
        libelle: jours[d.getDay()] || 'Jeu',
        total: isNaN(valTotale) ? 0 : valTotale
      }
    })

    return resultats
  })

  // Top des plats brut (sans aucune correction, uniquement les données de l'API) avec la ligne "Autres plats"
  const topPlats = computed(() => {
    const idsCommandesFiltrees = new Set(commandesFiltrees.value.map(c => String(c.id)))
    const lignesFiltrees = lignesCommande.value.filter(l => idsCommandesFiltrees.has(String(l.commandeId || l.idCommande)))

    const statsPlats = {}

    if (lignesFiltrees.length > 0) {
      lignesFiltrees.forEach(ligne => {
        const platId = ligne.platId || ligne.idPlat || ligne.nom
        const qte = Number(ligne.quantite || ligne.qte || 1)
        const prix = Number(ligne.prix || ligne.prixUnitaire || 10)
        const revenuLigne = qte * (isNaN(prix) ? 10 : prix)

        const platObj = plats.value.find(p => String(p.id) === String(platId))
        const nomPlat = platObj?.nom || ligne.nom || `Plat #${platId}`

        if (!statsPlats[nomPlat]) {
          statsPlats[nomPlat] = { nom: nomPlat, quantite: 0, revenu: 0 }
        }
        statsPlats[nomPlat].quantite += isNaN(qte) ? 1 : qte
        statsPlats[nomPlat].revenu += isNaN(revenuLigne) ? 0 : revenuLigne
      })

      // Trier tous les plats par revenu décroissant
      const tousLesPlats = Object.values(statsPlats).sort((a, b) => b.revenu - a.revenu)

      // Extraire le Top 5
      const top5 = tousLesPlats.slice(0, 5)

      // Calculer le reste pour "Autres plats" à partir des données API brutes
      const platsRestants = tousLesPlats.slice(5)
      const quantiteAutres = platsRestants.reduce((acc, p) => acc + p.quantite, 0)
      const revenuAutres = platsRestants.reduce((acc, p) => acc + p.revenu, 0)

      if (platsRestants.length > 0) {
        top5.push({
          nom: 'Autres plats',
          quantite: quantiteAutres,
          revenu: revenuAutres
        })
      }

      return top5
    }

    return []
  })

  // Ventes par catégorie reliées à la période
  const ventesParCategorie = computed(() => {
    const listeCat = Array.isArray(categories.value) ? categories.value : []
    const totalGlobal = Number(chiffreAffairesTotal.value) || 1

    const resultat = listeCat.map((cat, idx) => {
      const totalCat = Number(cat?.total || cat?.montant || 0)
      const pourcent = totalGlobal > 0 ? Math.round((totalCat / totalGlobal) * 100) : 0

      return {
        nom: cat?.nom || `Catégorie #${idx + 1}`,
        total: isNaN(totalCat) ? 0 : totalCat,
        pourcentage: isNaN(pourcent) ? 0 : Math.min(100, Math.max(0, pourcent))
      }
    })

    return resultat
  })

  // Top serveurs basé strictement sur l'API
  const topServeurs = computed(() => {
    const statsServeurs = {}
    const cmdFiltrees = commandesFiltrees.value
    const paiementsFiltresList = paiementsFiltres.value

    const listeEmp = Array.isArray(employes.value) ? employes.value : []
    listeEmp.forEach(emp => {
      const idEmp = String(emp.id)
      const nomComplet = emp?.nom || emp?.prenom || `Employé #${idEmp}`
      statsServeurs[idEmp] = {
        id: emp.id,
        nom: nomComplet,
        nbCommandes: 0,
        ca: 0
      }
    })

    cmdFiltrees.forEach(cmd => {
      const empId = String(cmd.employeId || cmd.serveurId || cmd.userId || '')
      if (empId && statsServeurs[empId]) {
        statsServeurs[empId].nbCommandes += 1

        const paiementAssocie = paiementsFiltresList.find(p => String(p.commandeId || p.idCommande) === String(cmd.id))
        if (paiementAssocie) {
          const montantPaiement = Number(paiementAssocie.montant || paiementAssocie.total || 0)
          statsServeurs[empId].ca += isNaN(montantPaiement) ? 0 : montantPaiement
        }
      }
    })

    const resultat = Object.values(statsServeurs).map(serv => {
      const mots = serv.nom.split(' ')
      const initiales = mots.length > 1 && mots[0] && mots[1] ? `${mots[0][0]}${mots[1][0]}`.toUpperCase() : 'SM'
      return {
        ...serv,
        initiales
      }
    }).sort((a, b) => b.ca - a.ca)

    if (resultat.every(s => s.nbCommandes === 0) && listeEmp.length > 0) {
      return listeEmp.map((emp, idx) => {
        const nomComplet = emp?.nom || emp?.prenom || `Employé #${idx + 1}`
        const mots = nomComplet.split(' ')
        const initiales = mots.length > 1 && mots[0] && mots[1] ? `${mots[0][0]}${mots[1][0]}`.toUpperCase() : 'SM'
        return {
          id: emp?.id || idx,
          nom: nomComplet,
          initiales: initiales,
          nbCommandes: Number(emp?.commandes || 0),
          ca: Number(emp?.ca || 0)
        }
      })
    }

    return resultat
  })

  // Ventes par mode de paiement
  const ventesParPaiement = computed(() => {
    const res = { especes: 0, mobile_money: 0, carte: 0 }
    const sourcePaiements = paiementsFiltres.value

    sourcePaiements.forEach(p => {
      const mode = String(p?.mode || p?.modePaiement || 'especes').toLowerCase()
      const montant = Number(p?.montant || p?.total || 0)
      const valSecurisee = isNaN(montant) ? 0 : montant

      if (mode.includes('mobile') || mode.includes('orange') || mode.includes('mpesa')) {
        res.mobile_money += valSecurisee
      } else if (mode.includes('carte') || mode.includes('cb') || mode.includes('visa')) {
        res.carte += valSecurisee
      } else {
        res.especes += valSecurisee
      }
    })

    return {
      especes: Number(res.especes) || 0,
      mobile_money: Number(res.mobile_money) || 0,
      carte: Number(res.carte) || 0
    }
  })

  const exporterCSV = () => {
    let csv = 'ID Paiement;Date;Mode;Montant ($)\n'
    const sourcePaiements = paiementsFiltres.value
    sourcePaiements.forEach(p => {
      const idP = p?.id || 1
      const dateP = p?.date || new Date().toISOString()
      const modeP = p?.mode || 'especes'
      const montantP = Number(p?.montant || 0)
      csv += `${idP};"${dateP}";"${modeP}";${isNaN(montantP) ? 0 : montantP}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `rapport_paiements_${periode.value}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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