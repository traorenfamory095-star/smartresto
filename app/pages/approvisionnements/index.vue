<script setup>
import { calculerTotalAppro } from '~/composables/useFournisseurs'
import { formaterPrix } from '~/utils/format'
import { infoStatut } from '~/utils/statuts'

const { listerAppro, receptionner } = useFournisseurs()
const api = useApi()
const { succes, erreur } = useNotifier()
const appros = ref([])
const fournisseurs = ref([])
const chargement = ref(true)
const enCours = ref(new Set())

async function charger() {
  try {
    const [a, f] = await Promise.all([listerAppro(), api.lire('/fournisseurs')])
    appros.value = Array.isArray(a) ? a : []
    fournisseurs.value = Array.isArray(f) ? f : []
  } catch (e) {
    erreur(e.message)
  } finally {
    chargement.value = false
  }
}

async function recevoir(a) {
  if (enCours.value.has(a.id)) return
  enCours.value.add(a.id)
  try {
    await receptionner(a)
    succes('Approvisionnement reçu')
    await charger()
  } catch (e) {
    erreur(e.message)
    await charger()
  } finally {
    enCours.value.delete(a.id)
  }
}

const nomF = (id) => fournisseurs.value.find(f => String(f.id) === String(id))?.nom ?? `#${id}`
onMounted(charger)
</script>

<template>
  <main class="space-y-6">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-orange-600">Gestion des achats</p>
        <h1 class="mt-1 text-3xl font-bold text-gray-900">Approvisionnements</h1>
        <p class="mt-2 text-sm text-gray-500">Suivez vos commandes et réceptionnez les livraisons.</p>
      </div>
      <NuxtLink
        to="/approvisionnements/nouveau"
        class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        <span aria-hidden="true" class="mr-2 text-lg leading-none">+</span>
        Nouvel approvisionnement
      </NuxtLink>
    </header>

    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p class="text-sm text-gray-500">Commandes enregistrées</p>
        <p class="mt-2 text-3xl font-bold text-gray-900">{{ appros.length }}</p>
        <p class="mt-1 text-sm text-gray-500">Toutes périodes confondues</p>
      </div>
      <div class="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
        <p class="text-sm font-medium text-orange-800">À réceptionner</p>
        <p class="mt-2 text-3xl font-bold text-orange-800">{{ appros.filter(a => a.statut === 'commande').length }}</p>
        <p class="mt-1 text-sm text-orange-700">Commandes en attente de livraison</p>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <h2 class="font-semibold text-gray-900">Historique des commandes</h2>
          <p class="mt-1 text-sm text-gray-500">La réception met à jour le stock et son journal.</p>
        </div>
        <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{{ appros.length }}</span>
      </div>
      <p v-if="chargement" class="p-10 text-center text-sm text-gray-500" role="status">Chargement des approvisionnements…</p>
      <ul v-else-if="appros.length" class="divide-y divide-gray-100">
        <li v-for="a in appros" :key="a.id" class="flex flex-col gap-4 px-5 py-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-start gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-700">#{{ a.id }}</span>
            <div class="min-w-0">
              <p class="truncate font-semibold text-gray-900">{{ nomF(a.fournisseurId) }}</p>
              <p class="mt-1 text-sm text-gray-500">Commandé le {{ a.dateCommande || '—' }} · {{ Array.isArray(a.lignes) ? a.lignes.length : 0 }} ligne(s)</p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  :class="a.statut === 'recue' ? 'bg-emerald-100 text-emerald-800' : a.statut === 'a_verifier' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'"
                >
                  {{ infoStatut('approvisionnement', a.statut).libelle }}
                </span>
                <span class="text-sm font-semibold text-gray-700">{{ formaterPrix(calculerTotalAppro(Array.isArray(a.lignes) ? a.lignes : [])) }}</span>
              </div>
            </div>
          </div>
          <button
            v-if="a.statut === 'commande'"
            type="button"
            class="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:shrink-0"
            :disabled="enCours.has(a.id)"
            @click="recevoir(a)"
          >
            {{ enCours.has(a.id) ? 'Réception en cours…' : 'Marquer comme reçu' }}
          </button>
          <p v-else-if="a.dateReception" class="text-sm text-gray-500 sm:shrink-0">Reçu le {{ a.dateReception }}</p>
        </li>
      </ul>
      <div v-else class="px-5 py-12 text-center">
        <p class="font-semibold text-gray-900">Aucun approvisionnement enregistré</p>
        <p class="mt-1 text-sm text-gray-500">Créez une commande pour commencer à suivre vos achats.</p>
      </div>
    </section>
  </main>
</template>
