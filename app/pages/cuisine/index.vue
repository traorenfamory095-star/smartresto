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
const maintenant = ref(0)
let intervalleActualisation

const colonnes = computed(() => [
  {
    statut: 'en_attente',
    titre: 'À préparer',
    tickets: (tickets.value ?? []).filter((ticket) => ticket.statut === 'en_attente'),
  },
  {
    statut: 'en_preparation',
    titre: 'En préparation',
    tickets: (tickets.value ?? []).filter((ticket) => ticket.statut === 'en_preparation'),
  },
  {
    statut: 'prete',
    titre: 'Prêtes',
    tickets: (tickets.value ?? []).filter((ticket) => ticket.statut === 'prete'),
  },
])

const tempsMoyen = computed(() => {
  if (!maintenant.value) return '—'

  const durées = (tickets.value ?? [])
    .map((ticket) => Date.parse(ticket.creeLe))
    .filter(Number.isFinite)
    .map((date) => Math.max(0, maintenant.value - date))

  if (!durées.length) return '—'
  const minutes = Math.round(durées.reduce((total, durée) => total + durée, 0) / durées.length / 60000)
  if (minutes < 60) return `${minutes} min`

  const heures = Math.floor(minutes / 60)
  if (heures < 24) return `${heures} h ${minutes % 60} min`
  return `${Math.floor(heures / 24)} j ${heures % 24} h`
})

async function actualiser() {
  maintenant.value = Date.now()
  try {
    await refresh()
  } catch (erreur) {
    notifier.erreur(erreur)
  }
}

onMounted(() => {
  maintenant.value = Date.now()
  intervalleActualisation = setInterval(() => {
    maintenant.value = Date.now()
    if (!pending.value && !occupé.value) void actualiser()
  }, 10_000)
})

onBeforeUnmount(() => clearInterval(intervalleActualisation))

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
  <section class="space-y-6 text-white">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Cuisine</h1>
        <p class="mt-2 text-sm text-[#a3a3a3]">Suivi des commandes en temps réel.</p>
      </div>
      <UiBouton variante="secondaire" :disabled="pending || occupé" @click="actualiser">
        Actualiser
      </UiBouton>
    </header>

    <section
      class="grid gap-4 rounded-3xl border border-[#292929] bg-[#141414] p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3"
      aria-label="Résumé de la cuisine"
    >
      <p class="text-lg font-semibold text-[#f97316]">{{ tickets?.length ?? 0 }} commandes actives</p>
      <p class="text-sm text-[#a3a3a3]">
        Temps moyen :
        <span class="font-semibold text-white">{{ tempsMoyen }}</span>
      </p>
      <p class="flex items-center gap-2 text-sm text-[#a3a3a3] sm:col-span-2 xl:col-span-1">
        <span class="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
        Actualisation automatique toutes les 10 s
      </p>
    </section>

    <div>
      <UiEtat
        :chargement="pending && !tickets?.length"
        :erreur="error"
        :vide="!tickets?.length"
        message-vide="Aucune commande active pour le moment."
        @reessayer="actualiser"
      >
        <div class="grid items-start gap-5 xl:grid-cols-3">
          <section
            v-for="colonne in colonnes"
            :key="colonne.statut"
            class="min-w-0 space-y-4"
            :aria-labelledby="`cuisine-${colonne.statut}`"
          >
            <header class="flex items-center justify-between">
              <h2 :id="`cuisine-${colonne.statut}`" class="text-lg font-semibold">{{ colonne.titre }}</h2>
              <span class="rounded-full bg-white/10 px-3 py-1 text-sm text-[#a3a3a3]">
                {{ colonne.tickets.length }}
              </span>
            </header>

            <CuisineTicket
              v-for="ticket in colonne.tickets"
              :key="ticket.id"
              :ticket="ticket"
              :occupé="occupé"
              :maintenant="maintenant"
              @changer-ligne="mettreAJourLigne"
              @changer-commande="mettreAJourCommande"
            />

            <p
              v-if="!colonne.tickets.length"
              class="rounded-2xl border border-dashed border-[#333] px-4 py-6 text-center text-sm text-[#737373]"
            >
              Aucune commande
            </p>
          </section>
        </div>
      </UiEtat>
    </div>
  </section>
</template>
