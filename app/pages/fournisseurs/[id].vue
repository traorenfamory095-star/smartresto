<script setup>
import { calculerTotalAppro } from '~/composables/useFournisseurs'
import { formaterDate, formaterPrix } from '~/utils/format'
import { infoStatut } from '~/utils/statuts'

const route = useRoute()
const router = useRouter()
const { lire, modifier, supprimer, listerAppro } = useFournisseurs()
const api = useApi()
const { succes, erreur } = useNotifier()

const categories = ['Poissons', 'Viandes', 'Légumes et fruits', 'Boissons']
const fournisseur = ref(null)
const form = reactive({ nom: '', categorie: '', contact: '', telephone: '', email: '', adresse: '' })
const ingredients = ref([])
const appros = ref([])
const chargement = ref(true)
const erreurMsg = ref('')
const erreurFormulaire = ref('')
const enregistrement = ref(false)
const suppression = ref(false)
const confirmation = ref(false)

const champ =
  'h-11 w-full min-w-0 rounded-xl border border-white/[0.13] bg-[#0e0e0e] px-3.5 text-sm text-white outline-none transition [color-scheme:dark] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'

// Catégories proposées : les 4 du kit + celle du fournisseur si elle est différente
const optionsCategorie = computed(() =>
  form.categorie && !categories.includes(form.categorie) ? [...categories, form.categorie] : categories
)
// Règle métier : un fournisseur qui a des approvisionnements ne se supprime pas
const peutSupprimer = computed(() => appros.value.length === 0)

const initiales = (nom = '') => {
  const mots = nom.trim().split(/\s+/).filter(Boolean)
  if (!mots.length) return '?'
  return (mots.length === 1 ? mots[0].slice(0, 2) : mots[0][0] + mots[mots.length - 1][0]).toUpperCase()
}
const reference = (a) => `APP-${String(a.id).padStart(4, '0')}`
const lignesDe = (a) => (Array.isArray(a.lignes) ? a.lignes : [])
const classeStatut = (statut) =>
  statut === 'recue'
    ? 'bg-green-500/10 text-green-500'
    : statut === 'a_verifier'
      ? 'bg-red-500/10 text-red-400'
      : 'bg-orange-500/10 text-orange-500'

async function charger() {
  chargement.value = true
  erreurMsg.value = ''
  try {
    const id = Number(route.params.id)
    const [f, i, a] = await Promise.all([
      lire(id),
      api.lire('/ingredients', { fournisseurId: id }),
      listerAppro()
    ])
    if (!f) throw new Error('Fournisseur introuvable.')
    fournisseur.value = f
    Object.assign(form, {
      nom: f.nom ?? '',
      categorie: f.categorie ?? '',
      contact: f.contact ?? '',
      telephone: f.telephone ?? '',
      email: f.email ?? '',
      adresse: f.adresse ?? ''
    })
    ingredients.value = Array.isArray(i) ? i : []
    appros.value = (Array.isArray(a) ? a : [])
      .filter(x => String(x.fournisseurId) === String(id))
      .sort((x, y) => Number(y.id) - Number(x.id))
  } catch (e) {
    erreurMsg.value = e.message || 'Erreur inconnue.'
  } finally {
    chargement.value = false
  }
}

watch(form, () => { erreurFormulaire.value = '' }, { deep: true })

async function enregistrer() {
  if (enregistrement.value) return
  const donnees = Object.fromEntries(Object.entries(form).map(([cle, valeur]) => [cle, valeur.trim()]))
  if (!donnees.nom || !donnees.categorie) {
    erreurFormulaire.value = 'Le nom et la catégorie sont obligatoires.'
    return
  }
  enregistrement.value = true
  try {
    await modifier(fournisseur.value.id, { ...fournisseur.value, ...donnees })
    fournisseur.value = { ...fournisseur.value, ...donnees }
    succes('Fournisseur enregistré')
  } catch (e) {
    erreur(e.message)
  } finally {
    enregistrement.value = false
  }
}

async function retirer() {
  if (suppression.value || !peutSupprimer.value) return
  suppression.value = true
  try {
    await supprimer(fournisseur.value.id)
    succes('Fournisseur supprimé')
    router.push('/fournisseurs')
  } catch (e) {
    erreur(e.message)
    suppression.value = false
    confirmation.value = false
  }
}

onMounted(charger)
</script>

<template>
  <main class="space-y-5">
    <p v-if="chargement" class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 py-14 text-center text-sm text-neutral-400" role="status">
      Chargement de la fiche fournisseur…
    </p>

    <div v-else-if="erreurMsg" class="rounded-[20px] border border-red-500/25 bg-red-500/10 px-5 py-6 text-center" role="alert">
      <p class="font-semibold text-red-300">Impossible d'afficher ce fournisseur.</p>
      <p class="mt-1 text-sm text-neutral-400">{{ erreurMsg }}</p>
      <div class="mt-4 flex justify-center gap-3">
        <button type="button" class="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" @click="charger">Réessayer</button>
        <NuxtLink to="/fournisseurs" class="rounded-lg bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-white/10">Retour à la liste</NuxtLink>
      </div>
    </div>

    <template v-else-if="fournisseur">
      <header class="flex flex-wrap items-center gap-x-5 gap-y-3">
        <NuxtLink
          to="/fournisseurs"
          class="rounded-md text-xs text-neutral-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <span aria-hidden="true">←</span> Retour aux fournisseurs
        </NuxtLink>
        <div class="min-w-0 flex-1 sm:border-l sm:border-white/[0.13] sm:pl-5">
          <h1 class="text-xl font-bold text-white">Fiche fournisseur</h1>
          <p class="mt-1 text-xs text-neutral-500">Informations, ingrédients et historique</p>
        </div>
      </header>

      <section class="flex flex-wrap items-center gap-4 rounded-3xl border border-white/[0.13] bg-[#141414]/80 p-6 backdrop-blur">
        <span class="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-orange-500/[0.13] font-bold text-orange-500">
          {{ initiales(fournisseur.nom) }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-orange-500">{{ fournisseur.categorie || 'Sans catégorie' }}</p>
          <h2 class="mt-1 break-words text-xl font-bold text-white">{{ fournisseur.nom }}</h2>
        </div>

        <div v-if="!confirmation" class="flex flex-col items-end gap-1">
          <button
            type="button"
            :disabled="!peutSupprimer"
            class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            @click="confirmation = true"
          >
            Supprimer
          </button>
          <p v-if="!peutSupprimer" class="max-w-[260px] text-right text-[11px] text-neutral-500">
            Suppression impossible : ce fournisseur a déjà des approvisionnements.
          </p>
        </div>
        <div v-else class="flex flex-wrap items-center gap-2" role="alertdialog" aria-label="Confirmer la suppression">
          <span class="text-xs text-neutral-300">Supprimer définitivement ?</span>
          <button type="button" class="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-white/10" @click="confirmation = false">Annuler</button>
          <button type="button" :disabled="suppression" class="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60" @click="retirer">
            {{ suppression ? 'Suppression…' : 'Oui, supprimer' }}
          </button>
        </div>
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <form
          class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 p-5 backdrop-blur"
          novalidate
          @submit.prevent="enregistrer"
        >
          <h3 class="mb-4 text-sm font-semibold text-white">Coordonnées</h3>
          <p v-if="erreurFormulaire" class="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300" role="alert">
            {{ erreurFormulaire }}
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-1.5 text-[11px] text-neutral-400">
              <span>Nom</span>
              <input v-model="form.nom" required :class="champ" />
            </label>
            <label class="flex flex-col gap-1.5 text-[11px] text-neutral-400">
              <span>Catégorie</span>
              <select v-model="form.categorie" required :class="champ">
                <option v-for="c in optionsCategorie" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5 text-[11px] text-neutral-400">
              <span>Personne de contact</span>
              <input v-model="form.contact" autocomplete="name" :class="champ" />
            </label>
            <label class="flex flex-col gap-1.5 text-[11px] text-neutral-400">
              <span>Téléphone</span>
              <input v-model="form.telephone" type="tel" :class="champ" />
            </label>
            <label class="flex flex-col gap-1.5 text-[11px] text-neutral-400">
              <span>Adresse e-mail</span>
              <input v-model="form.email" type="email" :class="champ" />
            </label>
            <label class="flex flex-col gap-1.5 text-[11px] text-neutral-400">
              <span>Adresse</span>
              <input v-model="form.adresse" :class="champ" />
            </label>
          </div>
          <div class="mt-5 flex justify-end border-t border-white/[0.13] pt-4">
            <button
              type="submit"
              :disabled="enregistrement"
              class="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-wait disabled:opacity-60"
            >
              {{ enregistrement ? 'Enregistrement…' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </form>

        <section class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 p-5 backdrop-blur">
          <h3 class="mb-4 text-sm font-semibold text-white">Ingrédients fournis</h3>
          <ul v-if="ingredients.length" class="flex flex-wrap gap-2.5">
            <li
              v-for="i in ingredients"
              :key="i.id"
              class="rounded-[11px] border border-white/[0.13] bg-[#111] px-3 py-2.5 text-xs text-neutral-300"
            >
              {{ i.nom }}
              <span class="ml-1 text-neutral-500">· {{ i.stock }} {{ i.unite }}</span>
            </li>
          </ul>
          <p v-else class="py-8 text-center text-sm text-neutral-500">Aucun ingrédient associé pour le moment.</p>
        </section>
      </div>

      <section class="rounded-[20px] border border-white/[0.13] bg-[#141414]/80 p-5 backdrop-blur">
        <h3 class="mb-4 text-sm font-semibold text-white">Historique des approvisionnements</h3>
        <div v-if="appros.length" class="overflow-x-auto">
          <table class="w-full whitespace-nowrap text-left">
            <thead>
              <tr class="text-[10px] uppercase tracking-wider text-neutral-500">
                <th scope="col" class="p-2.5 font-semibold">Référence</th>
                <th scope="col" class="p-2.5 font-semibold">Date</th>
                <th scope="col" class="p-2.5 font-semibold">Articles</th>
                <th scope="col" class="p-2.5 font-semibold">Total</th>
                <th scope="col" class="p-2.5 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in appros" :key="a.id" class="border-t border-white/[0.06] text-xs text-neutral-300">
                <td class="p-2.5 font-semibold text-white">{{ reference(a) }}</td>
                <td class="p-2.5">{{ a.dateCommande ? formaterDate(a.dateCommande) : '—' }}</td>
                <td class="p-2.5">{{ lignesDe(a).length }} article(s)</td>
                <td class="p-2.5">{{ formaterPrix(calculerTotalAppro(lignesDe(a))) }}</td>
                <td class="p-2.5">
                  <span class="rounded-full px-2.5 py-1.5 text-[11px] font-semibold" :class="classeStatut(a.statut)">
                    {{ infoStatut('approvisionnement', a.statut).libelle }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="py-8 text-center text-sm text-neutral-500">Aucun approvisionnement enregistré.</p>
      </section>
    </template>
  </main>
</template>