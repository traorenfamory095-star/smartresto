<script setup>
// Prise de commande : table, catalogue, panier. Propriétaire : Traoré.
useHead({ title: 'Nouvelle commande' })

const { lire } = useApi()
const notifier = useNotifier()
const panier = usePanier()

// Quatre lectures en parallèle ; chacune reste affichable même si une autre échoue.
const { data, pending, error, refresh } = await useAsyncData('nouvelle-commande', async () => {
  const [plats, categories, tables, commandes] = await Promise.all([
    lire('/plats', { disponible: true }), // un plat indisponible n'apparaît jamais au catalogue
    lire('/categories', { _sort: 'ordre' }),
    lire('/tables'),
    lire('/commandes'),
  ])
  return { plats, categories, tables, commandes }
})

const plats = computed(() => data.value?.plats ?? [])
const categories = computed(() => data.value?.categories ?? [])
const tablesActives = computed(() => (data.value?.tables ?? []).filter((t) => t.actif))
const occupees = computed(() => tablesOccupees(data.value?.commandes ?? []))

// Filtres du catalogue
const categorieId = ref('')
const recherche = ref('')
const platsAffiches = computed(() => {
  const mot = recherche.value.trim().toLowerCase()
  return plats.value
    .filter((p) => !categorieId.value || p.categorieId === Number(categorieId.value))
    .filter((p) => !mot || p.nom.toLowerCase().includes(mot))
})
const quantiteDuPlat = (id) => panier.lignes.value.find((l) => l.platId === id)?.quantite ?? 0

const problemes = computed(() =>
  problemesCommande(
    { tableId: panier.tableId.value, lignes: panier.lignes.value, nbCouverts: panier.nbCouverts.value },
    occupees.value,
  ),
)

// La validation (création de la commande et de ses lignes) est branchée à l'étape 2.
function valider() {
  notifier.erreur('La validation sera branchée à l’étape 2.')
}
</script>

<template>
  <section>
    <header class="flex flex-wrap items-center gap-4">
      <NuxtLink to="/commandes" class="text-sm text-mut hover:text-ink focus-visible:outline-2 focus-visible:outline-cy">
        <span aria-hidden="true">←</span> Retour aux commandes
      </NuxtLink>
      <h1 class="text-3xl font-bold text-head">Nouvelle commande</h1>
    </header>

    <UiEtat class="mt-6" :chargement="pending" :erreur="error" :vide="false" @reessayer="refresh">
      <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <!-- Catalogue -->
        <div>
          <div class="grid gap-4 sm:grid-cols-2">
            <UiChamp v-model="panier.tableId.value" label="Table" as="select" requis>
              <option value="">Choisir une table</option>
              <option v-for="t in tablesActives" :key="t.id" :value="t.id" :disabled="occupees.has(t.id)">
                Table {{ t.numero }} · {{ t.capacite }} pl. · {{ t.zone }}{{ occupees.has(t.id) ? ' (occupée)' : '' }}
              </option>
            </UiChamp>
            <UiChamp v-model="panier.nbCouverts.value" label="Couverts" type="number" min="1" max="20" requis />
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <UiChamp v-model="recherche" label="Chercher un plat" type="search" placeholder="Nom du plat" />
            <UiChamp v-model="categorieId" label="Catégorie" as="select">
              <option value="">Toutes</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.nom }}</option>
            </UiChamp>
          </div>

          <p v-if="!platsAffiches.length" class="mt-6 text-mut">Aucun plat disponible ne correspond.</p>
          <ul v-else class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <CommandesPlatChoix
              v-for="p in platsAffiches"
              :key="p.id"
              :plat="p"
              :quantite="quantiteDuPlat(p.id)"
              @ajouter="panier.ajouter"
            />
          </ul>
        </div>

        <!-- Panier -->
        <UiCarte grand class="self-start lg:sticky lg:top-6">
          <h2 class="text-lg font-semibold text-head">Panier</h2>
          <CommandesPanier
            :lignes="panier.lignes.value"
            @quantite="panier.changerQuantite"
            @retirer="panier.retirer"
            @remarque="panier.changerRemarque"
          />

          <UiChamp v-model="panier.note.value" label="Note pour la cuisine" as="textarea" rows="2" maxlength="200" class="mt-2" />

          <div class="mt-4 flex items-baseline justify-between border-t border-line pt-4" aria-live="polite">
            <span class="text-mut">Total ({{ panier.nbArticles.value }} article(s))</span>
            <span class="text-2xl font-bold text-acc">{{ formaterPrix(panier.total.value) }}</span>
          </div>

          <ul v-if="problemes.length && (panier.lignes.value.length || panier.tableId.value)" class="mt-3 space-y-1 text-xs text-err">
            <li v-for="p in problemes" :key="p">{{ p }}</li>
          </ul>

          <div class="mt-4 grid gap-3">
            <UiBouton taille="lg" :disabled="problemes.length > 0" @click="valider">Valider la commande</UiBouton>
            <UiBouton v-if="panier.lignes.value.length" variante="discret" @click="panier.vider()">Vider le panier</UiBouton>
          </div>
        </UiCarte>
      </div>
    </UiEtat>
  </section>
</template>