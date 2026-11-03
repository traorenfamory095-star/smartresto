<script setup>
import { calculerTotalAppro } from '~/composables/useFournisseurs'
import { formaterDate, formaterPrix } from '~/utils/format'
import { infoStatut } from '~/utils/statuts'

const { listerAppro, receptionner } = useFournisseurs()
const api = useApi()
const { succes, erreur } = useNotifier()

const appros = ref([])
const fournisseurs = ref([])
const chargement = ref(true)
const erreurChargement = ref('')
const enCours = ref(new Set())
const recherche = ref('')
const filtreStatut = ref('')

const btnPrimaire =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#f15a00] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.2)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]'

async function charger(initial = false) {
  if (initial) chargement.value = true
  erreurChargement.value = ''
  try {
    const [a, f] = await Promise.all([listerAppro(), api.lire('/fournisseurs')])
    appros.value = Array.isArray(a) ? a : []
    fournisseurs.value = Array.isArray(f) ? f : []
  } catch (e) {
    erreurChargement.value = e.message || 'Impossible de charger les approvisionnements.'
  } finally {
    chargement.value = false
  }
}

async function recevoir(a) {
  if (enCours.value.has(a.id) || a.statut !== 'commande') return
  enCours.value.add(a.id)
  try {
    await receptionner(a)
    succes('Approvisionnement reçu')
  } catch (e) {
    erreur(e.message)
  } finally {
    enCours.value.delete(a.id)
    await charger()
  }
}

const reference = (a) => `APP-${String(a.id).padStart(4, '0')}`
const nomF = (id) => fournisseurs.value.find(f => String(f.id) === String(id))?.nom ?? `#${id}`
const lignesDe = (a) => (Array.isArray(a.lignes) ? a.lignes : [])
const totalDe = (a) => calculerTotalAppro(lignesDe(a))
const dateOuTiret = (d) => (d ? formaterDate(d) : '—')
const livraison = (a) => dateOuTiret(a.statut === 'recue' ? a.dateReception : a.dateLivraisonPrevue)

const liste = computed(() => {
  const q = recherche.value.trim().toLowerCase()
  return appros.value
    .filter(a => !filtreStatut.value || a.statut === filtreStatut.value)
    .filter(a => !q || reference(a).toLowerCase().includes(q) || nomF(a.fournisseurId).toLowerCase().includes(q))
    .sort((x, y) => Number(y.id) - Number(x.id))
})

const classeStatut = (statut) =>
  statut === 'recue'
    ? 'bg-green-500/10 text-green-500'
    : statut === 'a_verifier'
      ? 'bg-red-500/10 text-red-400'
      : 'bg-orange-500/10 text-orange-500'

onMounted(() => charger(true))
</script>

<template>
  <main class="space-y-5">
    <h1 class="sr-only">Approvisionnements</h1>

    <div class="flex flex-wrap items-center gap-3">
      <label class="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/[0.13] bg-[#111] px-3.5 text-neutral-500 focus-within:border-orange-500 sm:min-w-[260px]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
        </svg>
        <span class="sr-only">Rechercher un approvisionnement</span>
        <input
          v-model="recherche"
          type="search"
          placeholder="Rechercher une référence ou un fournisseur…"
          class="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
        />
      </label>
      <label>
        <span class="sr-only">Filtrer par statut</span>
        <select
          v-model="filtreStatut"
          class="h-11 min-w-[160px] rounded-xl border border-white/[0.13] bg-[#0e0e0e] px-3.5 text-sm text-white outline-none [color-scheme:dark] focus:border-orange-500"
        >
          <option value="">Tous les statuts</option>
          <option value="commande">Commandé</option>
          <option value="recue">Reçu</option>
          <option value="a_verifier">À vérifier</option>
        </select>
      </label>
      <NuxtLink to="/approvisionnements/nouveau" :class="btnPrimaire" class="w-full sm:w-auto">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Nouvel approvisionnement
      </NuxtLink>
    </div>

    <section class="overflow-hidden rounded-[20px] border border-white/[0.13] bg-[#141414]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-white">Approvisionnements récents</h2>
        <span class="text-xs text-neutral-400">{{ liste.length }} sur {{ appros.length }}</span>
      </div>

      <p v-if="chargement" class="py-12 text-center text-sm text-neutral-400" role="status">Chargement des approvisionnements…</p>

      <div v-else-if="erreurChargement" class="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-4 text-sm text-red-300" role="alert">
        <p class="font-semibold">{{ erreurChargement }}</p>
        <button type="button" class="mt-3 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" @click="charger(true)">
          Réessayer
        </button>
      </div>

      <div v-else-if="liste.length" class="overflow-x-auto">
        <div class="min-w-[880px]">
          <div class="grid grid-cols-[0.75fr_1.45fr_1fr_1fr_0.75fr_0.7fr_1.15fr] gap-3 px-2 pb-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            <span>Référence</span><span>Fournisseur</span><span>Commande</span><span>Livraison</span><span>Total</span><span>Statut</span><span class="sr-only">Action</span>
          </div>
          <div
            v-for="a in liste"
            :key="a.id"
            class="grid min-h-[58px] grid-cols-[0.75fr_1.45fr_1fr_1fr_0.75fr_0.7fr_1.15fr] items-center gap-3 border-t border-white/[0.06] px-2 py-3 text-sm"
          >
            <b class="text-white">{{ reference(a) }}</b>
            <span class="truncate text-neutral-300">{{ nomF(a.fournisseurId) }}</span>
            <span class="text-neutral-400">{{ dateOuTiret(a.dateCommande) }}</span>
            <span class="text-neutral-400">{{ livraison(a) }}</span>
            <strong class="text-white">{{ formaterPrix(totalDe(a)) }}</strong>
            <span class="rounded-full px-2.5 py-1.5 text-center text-xs font-semibold" :class="classeStatut(a.statut)">
              {{ infoStatut('approvisionnement', a.statut).libelle }}
            </span>
            <button
              v-if="a.statut === 'commande'"
              type="button"
              class="min-h-[36px] rounded-[10px] border border-orange-500/30 bg-orange-500/10 px-2 text-xs font-semibold text-orange-500 transition hover:bg-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-wait disabled:opacity-60"
              :disabled="enCours.has(a.id)"
              @click="recevoir(a)"
            >
              {{ enCours.has(a.id) ? 'Réception…' : 'Marquer comme reçu' }}
            </button>
            <button
              v-else
              type="button"
              disabled
              class="min-h-[36px] cursor-not-allowed rounded-[10px] border border-[#292929] bg-[#1c1c1c] px-2 text-xs font-semibold text-neutral-500"
            >
              {{ a.statut === 'recue' ? 'Réceptionné' : 'À vérifier' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="py-12 text-center">
        <p class="font-semibold text-white">
          {{ appros.length ? 'Aucun résultat' : 'Aucun approvisionnement enregistré' }}
        </p>
        <p class="mt-1 text-sm text-neutral-400">
          {{ appros.length ? 'Modifiez votre recherche ou le filtre de statut.' : 'Créez une commande pour commencer à suivre vos achats.' }}
        </p>
      </div>
    </section>
  </main>
</template>