export function useTables(){
    const { lire, creer, modifier, supprimer } = useApi()


    // TABLES : lecture et CRUD
    async function recupererTables() {
        return await lire('/tables')
    }
    async function creerTable(donnees) {
        return await creer('/tables', donnees)
    }
    async function modifierTable(id, donnees) {
        return await modifier(`/tables/${id}`, donnees)
    }
    async function supprimerTable(id) {
        return await supprimer(`/tables/${id}`)
    }

    // COMMANNDES : lecture seul pour calculer l'occupation
    async function recupererCommandes() {
        return await lire('/commandes')
    }

    // RESERVATIONS : lecture et CRUD
    async function recupererReservations() {
        return await lire('/reservations')
    }
    async function creerReservation(donnees) {
        return await creer('/reservationns', donnees)
    }
    async function modifierReservation(id, donnees) {
        return await modifier(`/reservations/${id}`, donnees)
    }

    // Annulation logique : on conserve la réservation
    async function annulerReservation(id) {
        return await modifier(`/reservation/${id}`, {statut: 'annulee',})
    }
    return{
        recupererTables,
        creerTable,
        modifierTable,
        supprimerTable,
        recupererCommandes,
        recupererReservations,
        creerReservation,
        modifierReservation,
        annulerReservation,
    }
}