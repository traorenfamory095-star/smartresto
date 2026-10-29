import { ref, computed } from 'vue'

// Import direct des données locales du dossier db/
import commandesData from '../../db/commandes.json'
import facturesData from '../../db/factures.json'
import lignesCommandeData from '../../db/lignesCommande.json'
import platsData from '../../db/plats.json'
import categoriesData from '../../db/categories.json'
import employesData from '../../db/employes.json'
import paiementsData from '../../db/paiements.json'

export function useRapports() {
  const periode = ref('30jours') // Par défaut 30 jours pour voir du contenu immédiatement
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

  // Charger les données directement sans API externe
  const chargerDonnees = () => {
    chargement.value = true
    erreur.value = null
    try {
      commandes.value = Array.isArray(commandesData) ? commandesData : []
      factures.value = Array.isArray(facturesData) ? facturesData : []
      lignesCommande.value = Array.isArray(lignesCommandeData) ? lignesCommandeData : []
      plats.value = Array.isArray(platsData) ? platsData : []
      categories.value = Array.isArray(categoriesData) ? categoriesData : []
      employes.value = Array.isArray(employesData) ? employesData : []
      paiements.value = Array.isArray(paiementsData) ? paiementsData : []
    } catch (err) {
      erreur.value = "Erreur lors du chargement des données des rapports."
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

  // Filtrage des commandes payées selon la période sélectionnée
  const commandesFiltrees = computed(() => {
    const aujourdhui = new Date()
    
    return commandes.value.filter(cmd => {
      // Règle métier : Seules les commandes payées ou validées comptent (exclut annulées)
      const statutPaye = cmd.statut === 'payee' || cmd.statut === 'terminee' || cmd.statut === 'validee'
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

  // Groupement du Chiffre d'affaires par jour (Barres)
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

  // Export CSV sans dépendance externe
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

  const libellePeriode = computed(() => {
    if (periode.value === 'aujourdhui') return "Aujourd'hui"
    if (periode.value === '7jours') return '7 derniers jours'
    if (periode.value === '30jours') return '30 derniers jours'
    return 'Période personnalisée'
  })

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