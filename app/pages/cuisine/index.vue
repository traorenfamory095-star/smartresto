<script setup>
useHead({ title: 'Cuisine' })

const notifier = useNotifier()
const { chargerTickets, changerStatutLigne, changerStatutCommande } = useCuisine()
const { data: tickets, pending, error, refresh } = await useAsyncData(
  'cuisine-tickets',
  chargerTickets,
  { default: () => [] },
)

const occupé = ref(false)

async function executer(action, messageSucces) {
  if (occupé.value) return
  occupé.value = true

  try {
    try {
      await action()
      notifier.succes(messageSucces)
    } catch (erreur) {
      notifier.erreur(erreur)
    }
    try {
      await refresh()
    } catch (erreur) {
      notifier.erreur(erreur)
    }
  } finally {
    occupé.value = false
  }
}

function mettreAJourLigne(id, statut) {
  const libelle = statut === 'prete' ? 'Ligne marquée prête.' : 'Préparation de la ligne démarrée.'
  return executer(() => changerStatutLigne(id, statut), libelle)
}

function mettreAJourCommande(id, statut) {
  const libelle = statut === 'prete' ? 'Commande marquée prête.' : 'Préparation de la commande démarrée.'
  return executer(() => changerStatutCommande(id, statut), libelle)
}
</script>

<template>
  <section>
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-head">Cuisine</h1>
        <p class="mt-2 text-sm text-mut">Tickets à préparer et commandes prêtes pour le service.</p>
      </div>
      <UiBouton variante="secondaire" :disabled="pending || occupé" @click="refresh">
        Actualiser
      </UiBouton>
    </header>

    <UiCarte class="mt-5 border-acc/30 bg-soft text-sm text-mut">
      Les tickets affichent toutes les lignes de commande, y compris les boissons, car les données ne définissent
      pas de poste de préparation.
    </UiCarte>

    <div class="mt-6">
      <UiEtat
        :chargement="pending"
        :erreur="error"
        :vide="!tickets?.length"
        message-vide="Aucun ticket à préparer pour le moment."
        @reessayer="refresh"
      >
        <div class="grid gap-5 xl:grid-cols-2">
          <CuisineTicket
            v-for="ticket in tickets"
            :key="ticket.id"
            :ticket="ticket"
            :occupé="occupé"
            @changer-ligne="mettreAJourLigne"
            @changer-commande="mettreAJourCommande"
          />
        </div>
      </UiEtat>
    </div>
  </section>
</template>
