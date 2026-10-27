export function useTables(){
    const { lire } = useApi()
    async function recupererTables() {
        return await lire('/tables')
    }
    async function recupererCommandes() {
        return await lire('/commandes')
    }
    async function recupererReservations() {
        return await lire('/reservations')
    }
    return{
        recupererTables,
        recupererCommandes,
        recupererReservations
    }
}