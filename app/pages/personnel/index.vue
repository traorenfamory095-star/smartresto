<script setup>
const api = useApi()
const { succes, erreur } = useNotifier()

const ROLES = [
  { valeur: 'admin', libelle: 'Admin' },
  { valeur: 'gerant', libelle: 'Gérant' },
  { valeur: 'serveur', libelle: 'Serveur' },
  { valeur: 'cuisinier', libelle: 'Cuisinier' },
  { valeur: 'caissier', libelle: 'Caissier' }
]

const employes = ref([])
const chargement = ref(true)
const erreurMsg = ref('')
const recherche = ref('')
const filtreRole = ref('')
const avertissement = ref(false)
const enCours = ref(new Set())

const btnPrimaire =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#f15a00] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.2)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]'

const libelleRole = (r) => ROLES.find(x => x.valeur === r)?.libelle ?? r
const classeRole = (r) =>
  r === 'admin' || r === 'gerant'
    ? 'bg-orange-500/[0.12] text-orange-500'
    : r === 'cuisinier'
      ? 'bg-white/[0.08] text-white'
      : 'bg-[#252525] text-neutral-300'

const initiales = (nom = '') => {
  const mots = nom.trim().split(/\s+/).filter(Boolean)
  if (!mots.length) return '?'
  return (mots.length === 1 ? mots[0].slice(0, 2) : mots[0][0] + mots[mots.length - 1][0]).toUpperCase()
}

const liste = computed(() => {
  const q = recherche.value.trim().toLowerCase()
  return employes.value
    .filter(e => !filtreRole.value || e.role === filtreRole.value)
    .filter(e => !q || e.nom.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
})

const nbAdminsActifs = computed(() => employes.value.filter(e => e.role === 'admin' && e.actif).length)

async function charger() {
  chargement.value = true
  erreurMsg.value = ''
  try {
    const data = await api.lire('/employes')
    employes.value = Array.isArray(data) ? data : []
  } catch (e) {
    erreurMsg.value = e.message || 'Erreur inconnue.'
  } finally {
    chargement.value = false
  }
}

async function basculer(employe) {
  if (enCours.value.has(employe.id)) return
  // Règle métier : le dernier administrateur actif ne peut pas être désactivé
  if (employe.role === 'admin' && employe.actif && nbAdminsActifs.value === 1) {
    avertissement.value = true
    return
  }
  avertissement.value = false
  enCours.value.add(employe.id)
  try {
    const actif = !employe.actif
    await api.modifier(`/employes/${employe.id}`, { actif })
    employe.actif = actif
    succes(actif ? 'Compte activé' : 'Compte désactivé')
  } catch (e) {
    erreur(e.message)
  } finally {
    enCours.value.delete(employe.id)
  }
}

onMounted(charger)
</script>

<template>
  <main class="space-y-5">
    <h1 class="sr-only">Personnel</h1>

    <div class="flex flex-wrap items-center gap-3">
      <label class="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/[0.13] bg-[#111] px-3.5 text-neutral-500 focus-within:border-orange-500 sm:min-w-[260px]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
        </svg>
        <span class="sr-only">Rechercher un employé</span>
        <input v-model="recherche" type="search" placeholder="Rechercher un employé..." class="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-500" />
      </label>
      <label>
        <span class="sr-only">Filtrer par rôle</span>
        <select v-model="filtreRole" class="h-11 min-w-[160px] rounded-xl border border-white/[0.13] bg-[#0e0e0e] px-3.5 text-sm text-white outline-none [color-scheme:dark] focus:border-orange-500">
          <option value="">Tous les rôles</option>
          <option v-for="r in ROLES" :key="r.valeur" :value="r.valeur">{{ r.libelle }}</option>
        </select>
      </label>
      <NuxtLink to="/personnel/nouveau" :class="btnPrimaire" class="w-full sm:w-auto">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Nouvel employé
      </NuxtLink>
    </div>

    <div v-if="avertissement" class="flex items-center gap-3 rounded-[14px] border border-red-500/30 bg-red-500/[0.08] px-4 py-3.5 text-red-400" role="alert">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M17 15a6 6 0 0 1 5 6" />
      </svg>
      <p class="flex-1 text-xs"><b class="mb-0.5 block text-[13px]">Action impossible</b>Impossible de désactiver le dernier administrateur.</p>
      <button type="button" aria-label="Fermer l'avertissement" class="rounded-md px-2 text-lg leading-none transition hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400" @click="avertissement = false">×</button>
    </div>

    <section class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur">
      <h2 class="mb-5 text-sm font-semibold text-white">{{ employes.length }} membre(s) du personnel</h2>

      <p v-if="chargement" class="py-12 text-center text-sm text-neutral-400" role="status">Chargement du personnel…</p>

      <div v-else-if="erreurMsg" class="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-4 text-sm text-red-300" role="alert">
        <p class="font-semibold">Impossible de charger le personnel.</p>
        <p class="mt-1 text-neutral-400">{{ erreurMsg }}</p>
        <button type="button" class="mt-3 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" @click="charger">Réessayer</button>
      </div>

      <div v-else-if="liste.length">
        <div class="hidden grid-cols-[1.5fr_0.7fr_0.8fr_0.5fr] gap-4 px-2 pb-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:grid">
          <span>Employé</span><span>Rôle</span><span>Statut</span><span class="sr-only">Action</span>
        </div>
        <ul>
          <li
            v-for="e in liste"
            :key="e.id"
            class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 border-t border-white/[0.06] px-2 py-3 md:grid-cols-[1.5fr_0.7fr_0.8fr_0.5fr]"
          >
            <div class="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
              <span class="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-orange-500/[0.12] text-[11px] font-bold text-orange-500">{{ initiales(e.nom) }}</span>
              <span class="min-w-0">
                <b class="block truncate text-[13px] text-white">{{ e.nom }}</b>
                <small class="mt-0.5 block truncate text-[11px] text-neutral-500">{{ e.email }}</small>
              </span>
            </div>

            <span class="w-fit rounded-full px-2.5 py-1.5 text-[11px] font-semibold" :class="classeRole(e.role)">{{ libelleRole(e.role) }}</span>

            <label class="inline-flex cursor-pointer items-center gap-2 justify-self-end md:justify-self-start">
              <input type="checkbox" role="switch" class="peer sr-only" :checked="e.actif" :disabled="enCours.has(e.id)" :aria-label="`Compte de ${e.nom}`" @change="basculer(e)" />
              <span class="relative h-[19px] w-[34px] rounded-full bg-[#333] transition after:absolute after:left-[3px] after:top-[3px] after:h-[13px] after:w-[13px] after:rounded-full after:bg-neutral-500 after:transition-all peer-checked:bg-green-500/25 peer-checked:after:left-[18px] peer-checked:after:bg-green-500 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-400 peer-disabled:opacity-50" />
              <em class="text-[11px] not-italic text-neutral-400">{{ e.actif ? 'Actif' : 'Inactif' }}</em>
            </label>

            <NuxtLink :to="`/personnel/${e.id}`" class="col-span-2 rounded-md text-xs font-semibold text-orange-500 transition hover:text-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 md:col-span-1 md:justify-self-end">
              Modifier
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div v-else class="py-12 text-center">
        <p class="font-semibold text-white">{{ employes.length ? 'Aucun résultat' : 'Aucun employé enregistré' }}</p>
        <p class="mt-1 text-sm text-neutral-400">{{ employes.length ? 'Modifiez votre recherche ou le filtre de rôle.' : 'Ajoutez le premier membre de votre équipe.' }}</p>
      </div>
    </section>
  </main>
</template>