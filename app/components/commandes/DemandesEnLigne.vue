<script setup>
// « Demandes en ligne » : les demandes envoyées par les clients, à transformer en commandes.
// Propriétaire : Traoré. Nom auto-importé par Nuxt : <CommandesDemandesEnLigne @traitee="..." />
// N'affiche rien quand il n'y a aucune demande en attente.
const emit = defineEmits(['traitee'])

const { lire } = useApi()
const notifier = useNotifier()
const { utilisateur } = useAuth()
const { lister, prendreEnCharge, refuser } = useDemandes()

// Chargé dans le navigateur seulement (la liste bouge toute seule : pas besoin du rendu serveur).
const { data, pending, error, refresh } = useAsyncData(
  'demandes-en-ligne',
  async () => {
    const [demandes, plats, tables, commandes] = await Promise.all([
      lister(), lire('/plats'), lire('/tables'), lire('/commandes'),
    ])
    return { demandes, plats, libres: tablesLibres(tables, commandes) }
  },
  { server: false },
)

const demandes = computed(() => data.value?.demandes ?? [])
const nomPlat = (id) => data.value?.plats.find((p) => p.id === id)?.nom ?? 'Plat supprimé'

// Rafraîchissement toutes les 15 s. L'intervalle est TOUJOURS nettoyé en quittant la page :
// sinon chaque retour sur /commandes en empilerait un de plus (même piège que le chronomètre de la cuisine).
const INTERVALLE_MS = 15000
let minuteur = null
onMounted(() => {
  minuteur = setInterval(() => {
    if (!document.hidden && !envoi.value) refresh()
  }, INTERVALLE_MS)
})
onUnmounted(() => {
  clearInterval(minuteur)
  minuteur = null
})

const choixTable = reactive({}) // { idDemande: idTable }
const envoi = ref(false)
const aRefuser = ref(null)

async function accepter(demande) {
  if (envoi.value || !choixTable[demande.id]) return
  envoi.value = true
  try {
    const commande = await prendreEnCharge(demande, {
      tableId: choixTable[demande.id],
      serveurId: utilisateur.value?.id ?? null,
    })
    notifier.succes(`Demande de ${demande.nomClient} transformée en commande #${commande.id}.`)
    emit('traitee')
  } catch (e) {
    notifier.erreur(e)
  } finally {
    envoi.value = false
    await refresh()
  }
}

async function confirmerRefus() {
  if (envoi.value || !aRefuser.value) return
  envoi.value = true
  try {
    await refuser(aRefuser.value.id)
    notifier.succes('Demande refusée.')
    aRefuser.value = null
  } catch (e) {
    notifier.erreur(e)
  } finally {
    envoi.value = false
    await refresh()
  }
}
</script>

<template>
  <section v-if="demandes.length || (error && !pending)" class="mt-6" aria-labelledby="titre-demandes">
    <UiCarte grand>
      <div class="flex items-center justify-between gap-3">
        <h2 id="titre-demandes" class="text-lg font-semibold text-head">
          Demandes en ligne
          <span class="ml-2 rounded-full bg-acc/15 px-2.5 py-1 text-xs font-medium text-acc">{{ demandes.length }}</span>
        </h2>
        <UiBouton variante="discret" taille="sm" @click="refresh()">Actualiser</UiBouton>
      </div>

      <p v-if="error" class="mt-3 text-sm text-err" role="alert">
        {{ error.message }} <button type="button" class="underline" @click="refresh()">Réessayer</button>
      </p>

      <ul class="mt-4 grid gap-4 lg:grid-cols-2">
        <li v-for="d in demandes" :key="d.id" class="rounded-carte border border-line bg-soft p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-head">{{ d.nomClient }}</p>
              <p class="text-sm text-mut">
                <a :href="`tel:${d.telephone}`" class="underline">{{ d.telephone }}</a>
                · {{ d.nbCouverts }} pers. · {{ formaterHeure(d.creeLe) }}
              </p>
            </div>
            <p class="font-bold text-acc">{{ formaterPrix(calculerTotal(d.lignes)) }}</p>
          </div>

          <ul class="mt-3 space-y-1 text-sm text-ink">
            <li v-for="(l, i) in d.lignes" :key="i">
              {{ l.quantite }}× {{ nomPlat(l.platId) }}
              <span v-if="l.remarque" class="text-acc"> — {{ l.remarque }}</span>
            </li>
          </ul>
          <p v-if="d.note" class="mt-2 text-sm text-mut">Message : {{ d.note }}</p>

          <div class="mt-4 flex flex-wrap items-end gap-2">
            <div class="min-w-40 flex-1">
              <UiChamp v-model="choixTable[d.id]" label="Table" as="select">
                <option value="">Choisir une table libre</option>
                <option v-for="t in data.libres" :key="t.id" :value="t.id">
                  Table {{ t.numero }} · {{ t.capacite }} pl. · {{ t.zone }}
                </option>
              </UiChamp>
            </div>
            <UiBouton :disabled="!choixTable[d.id] || envoi" @click="accepter(d)">Prendre en charge</UiBouton>
            <UiBouton variante="danger" :disabled="envoi" @click="aRefuser = d">Refuser</UiBouton>
          </div>
        </li>
      </ul>
    </UiCarte>

    <UiConfirmer
      :model-value="!!aRefuser"
      titre="Refuser cette demande ?"
      :message="aRefuser ? `La demande de ${aRefuser.nomClient} sera marquée « refusée ». Pensez à le prévenir.` : ''"
      libelle-confirmer="Refuser"
      :chargement="envoi"
      @update:model-value="(v) => { if (!v) aRefuser = null }"
      @confirmer="confirmerRefus"
    />
  </section>
</template>