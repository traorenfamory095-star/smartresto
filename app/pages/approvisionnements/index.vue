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
  <section>
    <div class="flex justify-between mb-4">
      <h1 class="text-2xl font-bold">Approvisionnements</h1>
      <NuxtLink to="/approvisionnements/nouveau" class="px-4 py-2 rounded bg-slate-900 text-white">+ Nouveau</NuxtLink>
    </div>
    <p v-if="chargement">Chargement…</p>
    <template v-else>
      <ul v-if="appros.length" class="space-y-2">
        <li v-for="a in appros" :key="a.id" class="border rounded p-3 flex justify-between items-center">
          <div>
            <strong>#{{ a.id }}</strong> — {{ nomF(a.fournisseurId) }} — {{ a.dateCommande || '—' }}
            <br /><span class="text-sm">{{ infoStatut('approvisionnement', a.statut).libelle }} · {{ formaterPrix(calculerTotalAppro(Array.isArray(a.lignes) ? a.lignes : [])) }}</span>
          </div>
          <button v-if="a.statut === 'commande'" class="px-3 py-1 rounded bg-green-600 text-white text-sm disabled:opacity-50"
            :disabled="enCours.has(a.id)" @click="recevoir(a)">
            {{ enCours.has(a.id) ? 'Réception…' : 'Marquer comme reçu' }}
          </button>
        </li>
      </ul>
      <p v-else class="text-slate-500">Aucun approvisionnement.</p>
    </template>
  </section>
</template>
