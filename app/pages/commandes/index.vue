<script setup>
// Liste des commandes (lecture seule). Propriétaire : Traoré.
useHead({ title: 'Commandes' })

const { chargerListe } = useCommandes()
const { lire } = useApi()

// Deux chargements indépendants, en parallèle.
const [liste, tablesRes] = await Promise.all([
  useAsyncData('commandes-liste', chargerListe),
  useAsyncData('commandes-tables', () => lire('/tables')),
])
const { data: commandes, pending, error, refresh } = liste
const tables = computed(() => tablesRes.data.value ?? [])

const filtres = reactive({ statut: '', tableId: '', date: '', recherche: '' })
const affichees = computed(() => filtrerCommandes(commandes.value ?? [], filtres))
const total = computed(() => totalDuService(affichees.value))
const filtresActifs = computed(() => Object.values(filtres).some(Boolean))
const reinitialiser = () => Object.assign(filtres, { statut: '', tableId: '', date: '', recherche: '' })

const STATUTS_FILTRE = ['en_attente', 'en_preparation', 'prete', 'servie', 'payee', 'annulee']
</script>

<template>
  <section>
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-head">Commandes</h1>
        <p class="mt-1 text-sm text-mut">Suivez et créez les commandes en cours.</p>
      </div>
      <UiBouton to="/commandes/nouvelle" taille="lg">
        <span aria-hidden="true">+</span> Nouvelle commande
      </UiBouton>
    </header>

    <form class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="search" @submit.prevent>
      <UiChamp v-model="filtres.recherche" label="Recherche" type="search" placeholder="N°, table, serveur, note" />
      <UiChamp v-model="filtres.statut" label="Statut" as="select">
        <option value="">Tous les statuts</option>
        <option v-for="s in STATUTS_FILTRE" :key="s" :value="s">{{ infoStatut('commande', s).libelle }}</option>
      </UiChamp>
      <UiChamp v-model="filtres.tableId" label="Table" as="select">
        <option value="">Toutes les tables</option>
        <option v-for="t in tables" :key="t.id" :value="t.id">Table {{ t.numero }}</option>
      </UiChamp>
      <UiChamp v-model="filtres.date" label="Date" type="date" />
    </form>

    <UiCarte grand class="mt-6 p-0!">
      <h2 class="px-6 pt-6 text-lg font-semibold text-head sm:px-8">
        {{ filtres.date ? 'Commandes du jour choisi' : 'Toutes les commandes' }}
      </h2>

      <div class="px-6 pb-6 sm:px-8">
      <UiEtat
        :chargement="pending"
        :erreur="error"
        :vide="!affichees.length"
        :message-vide="filtresActifs ? 'Aucune commande ne correspond à ces filtres.' : 'Aucune commande pour le moment.'"
        @reessayer="refresh"
      >
        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-160 text-sm">
            <caption class="sr-only">Liste des commandes</caption>
            <thead>
              <tr class="text-left text-xs uppercase tracking-widest text-mut">
                <th scope="col" class="px-4 py-3 font-semibold">N°</th>
                <th scope="col" class="px-4 py-3 font-semibold">Table</th>
                <th scope="col" class="px-4 py-3 font-semibold">Serveur</th>
                <th scope="col" class="px-4 py-3 font-semibold">Heure</th>
                <th scope="col" class="px-4 py-3 font-semibold">Total</th>
                <th scope="col" class="px-4 py-3 font-semibold">Statut</th>
                <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <CommandesCommandeRangee v-for="c in affichees" :key="c.id" :commande="c" />
            </tbody>
          </table>
        </div>

        <div class="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-sm text-mut" aria-live="polite">
          <span>
            {{ affichees.length }} commande(s)
            <UiBouton v-if="filtresActifs" variante="discret" taille="sm" @click="reinitialiser">
              Effacer les filtres
            </UiBouton>
          </span>
          <span>Total du service (hors annulées) : <strong class="text-acc">{{ formaterPrix(total) }}</strong></span>
        </div>
      </UiEtat>
      </div>
    </UiCarte>
  </section>
</template>