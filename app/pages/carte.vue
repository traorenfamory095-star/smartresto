<script setup>
definePageMeta({ layout: 'public' })
useHead({
  title: 'La carte du Kivu | SmartResto',
  meta: [
    {
      name: 'description',
      content: 'Produits frais, recettes de mémoire et cuisson au feu. Découvrez notre carte.',
    },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    },
  ],
})

const { lire } = useApi()
const panier = usePanier()
const notifier = useNotifier()
const ajouterDepuisCarte = creerAjoutDepuisCarte(panier, notifier)
const {
  tables,
  chargementTables,
  erreurTables,
  rechargerTables,
  confirmer,
  changerQuantite,
  retirer,
  changerRemarque,
} = useCommandeClient()
const ajoutFeedback = ref({ platId: null, numero: 0 })
const {
  categories,
  pending: chargementCategories,
  error: erreurCategories,
  refresh: actualiserCategories,
} = await useCategories()
const {
  data: plats,
  pending: chargementPlats,
  error: erreurPlats,
  refresh: actualiserPlats,
} = await useAsyncData('carte-plats', () => lire('/plats', { disponible: true }))

const categorieIdActive = ref(null)
const recherche = ref('')
const tiroirOuvert = ref(false)
const etapeCommande = ref(1)
const envoiCommande = ref(false)
const erreursConfirmation = ref({})
const platsIndisponibles = ref([])
const resumeCommande = ref(null)
const chargement = computed(() => chargementCategories.value || chargementPlats.value)
const erreur = computed(() => erreurCategories.value || erreurPlats.value)
const lignesPanier = computed(() => panier.lignes.value)
const nombreArticles = computed(() => panier.nbArticles.value)
const totalPanier = computed(() => panier.total.value)
const pastilles = computed(() => construirePastilles(categories.value ?? [], plats.value ?? []))
const carte = computed(() =>
  construireCarte(
    categories.value ?? [],
    plats.value ?? [],
    recherche.value,
    categorieIdActive.value,
  ),
)
const carteVide = computed(() => pastilles.value.length === 0)
const aucunResultat = computed(() => !carteVide.value && carte.value.length === 0)

watch(pastilles, (categoriesDisponibles) => {
  if (
    categorieIdActive.value !== null
    && !categoriesDisponibles.some((categorie) => String(categorie.id) === String(categorieIdActive.value))
  ) {
    categorieIdActive.value = null
  }
})

function basculerImageSecours(event, plat, categorie) {
  const image = event.currentTarget
  const imageSecours = resoudreImagePlat({ ...plat, imageUrl: '' }, categorie)

  if (image.src !== imageSecours) image.src = imageSecours
}

function addToCart(dish) {
  if (ajouterDepuisCarte(dish)) {
    ajoutFeedback.value = {
      platId: dish.id,
      numero: ajoutFeedback.value.numero + 1,
    }
  }
}

function ouvrirPanier() {
  tiroirOuvert.value = true
}

async function passerALaConfirmation() {
  if (!lignesPanier.value.length) return
  erreursConfirmation.value = {}
  platsIndisponibles.value = []
  await rechargerTables()
  etapeCommande.value = 2
}

function revenirAuPanier() {
  erreursConfirmation.value = {}
  platsIndisponibles.value = []
  etapeCommande.value = 1
}

function fermerPanier() {
  tiroirOuvert.value = false
  if (etapeCommande.value === 3) {
    etapeCommande.value = 1
    resumeCommande.value = null
  }
}

async function confirmerLaCommande() {
  if (envoiCommande.value) return

  const erreurs = validerConfirmation({
    tableId: panier.tableId.value,
    nbCouverts: panier.nbCouverts.value,
    note: panier.note.value,
  }, tables.value)
  erreursConfirmation.value = erreurs
  platsIndisponibles.value = []
  if (Object.keys(erreurs).length) return

  envoiCommande.value = true
  try {
    const resultat = await confirmer({
      tableId: panier.tableId.value,
      nbCouverts: panier.nbCouverts.value,
      note: panier.note.value,
    })

    if (resultat.indisponibles?.length) {
      platsIndisponibles.value = resultat.indisponibles
      return
    }

    if (resultat.erreur) return

    resumeCommande.value = {
      ...resultat.resume,
      commandeId: resultat.commande.id,
      tableNumero: tables.value.find(
        (table) => String(table.id) === String(resultat.resume.tableId),
      )?.numero,
    }
    etapeCommande.value = 3
  } finally {
    envoiCommande.value = false
  }
}

async function actualiserCarte() {
  await Promise.all([actualiserCategories(), actualiserPlats()])
}
</script>

<template>
  <div class="carte-page">
    <main class="carte-container">
      <header class="page-header">
        <p class="eyebrow">Notre table, votre voyage</p>
        <h1>La carte du <span class="kivu">Kivu</span></h1>
        <p class="intro">
          Produits frais, recettes de mémoire et cuisson au feu. Découvrez une carte courte,
          préparée chaque jour.
        </p>
      </header>

      <section class="toolbar" aria-label="Filtres de la carte">
        <label class="search-field">
          <span class="sr-only">Rechercher un plat</span>
          <svg
            class="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.2 4.2" />
          </svg>
          <input
            v-model="recherche"
            type="search"
            placeholder="Rechercher un plat..."
          />
        </label>

        <div class="category-filters" role="group" aria-label="Filtrer par catégorie">
          <button
            type="button"
            class="filter-pill"
            :class="{ active: categorieIdActive === null }"
            :aria-pressed="categorieIdActive === null"
            @click="categorieIdActive = null"
          >
            Tout
          </button>
          <button
            v-for="categorie in pastilles"
            :key="categorie.id"
            type="button"
            class="filter-pill"
            :class="{ active: String(categorieIdActive) === String(categorie.id) }"
            :aria-pressed="String(categorieIdActive) === String(categorie.id)"
            @click="categorieIdActive = categorie.id"
          >
            {{ categorie.nom }}
          </button>
        </div>
      </section>

      <div class="menu-content">
        <div v-if="chargement" role="status" class="menu-state">
          <span class="loader" aria-hidden="true" />
          Chargement de la carte…
        </div>

        <div v-else-if="erreur" role="alert" class="menu-state error-state">
          <p>{{ erreur.message || 'Impossible de charger la carte. Réessayez.' }}</p>
          <button type="button" class="retry-button" @click="actualiserCarte">
            Réessayer
          </button>
        </div>

        <p v-else-if="carteVide" class="menu-state">
          Aucun plat n'est disponible sur la carte pour le moment.
        </p>

        <p v-else-if="aucunResultat" class="menu-state">
          Aucun résultat pour cette recherche.
        </p>

        <div v-else>
          <CategoriesSectionCarte
            v-for="categorie in carte"
            :key="categorie.id"
            :categorie="categorie"
            :plats="categorie.plats"
            :ajout-feedback="ajoutFeedback"
            @ajouter="addToCart"
            @image-error="basculerImageSecours"
          />
        </div>
      </div>
    </main>

    <CategoriesBoutonPanierFlottant
      v-if="nombreArticles > 0 || etapeCommande === 3"
      :nombre-articles="nombreArticles"
      :total="totalPanier"
      @ouvrir="ouvrirPanier"
    />

    <CategoriesTiroirPanier
      :ouvert="tiroirOuvert"
      :etape="etapeCommande"
      :envoi="envoiCommande"
      @fermer="fermerPanier"
    >
      <template v-if="etapeCommande === 1">
        <p v-if="!lignesPanier.length" class="cart-empty">
          Votre panier est vide. Ajoutez un plat pour commencer.
        </p>
        <template v-else>
          <ul class="cart-lines">
            <CategoriesLignePanierClient
              v-for="ligne in lignesPanier"
              :key="ligne.platId"
              :ligne="ligne"
              @changer-quantite="changerQuantite"
              @retirer="retirer"
              @modifier-remarque="changerRemarque"
            />
          </ul>

          <label class="order-note">
            <span>Note pour la cuisine <small>(facultatif)</small></span>
            <textarea
              :value="panier.note.value"
              rows="3"
              maxlength="200"
              placeholder="Allergies ou précisions..."
              @input="panier.note.value = $event.target.value"
            />
          </label>

          <div class="cart-total" aria-live="polite">
            <span>Total · {{ libelleArticles(nombreArticles) }}</span>
            <strong>{{ formaterPrix(totalPanier) }}</strong>
          </div>

          <div class="cart-actions">
            <button type="button" class="clear-cart-button" @click="panier.vider()">
              Vider le panier
            </button>
            <button type="button" class="continue-button" @click="passerALaConfirmation">
              Continuer
            </button>
          </div>
        </template>
      </template>

      <CategoriesFormulaireConfirmation
        v-else-if="etapeCommande === 2"
        :tables="tables"
        :table-id="panier.tableId.value"
        :nb-couverts="panier.nbCouverts.value"
        :note="panier.note.value"
        :erreurs="erreursConfirmation"
        :chargement-tables="chargementTables"
        :erreur-tables="erreurTables"
        :envoi="envoiCommande"
        @update:table-id="panier.tableId.value = $event"
        @update:nb-couverts="panier.nbCouverts.value = $event"
        @update:note="panier.note.value = $event"
        @retour="revenirAuPanier"
        @confirmer="confirmerLaCommande"
        @reessayer="rechargerTables"
      />

      <div v-if="platsIndisponibles.length" class="unavailable-message" role="alert">
        <p>Certains plats ne sont plus disponibles. Retirez-les du panier pour continuer :</p>
        <ul>
          <li v-for="ligne in platsIndisponibles" :key="ligne.platId">
            {{ ligne.nom }}
            <button type="button" @click="retirer(ligne.platId)">Retirer</button>
          </li>
        </ul>
      </div>

      <CategoriesSuccesCommande
        v-if="etapeCommande === 3 && resumeCommande"
        :resume="resumeCommande"
        @fermer="fermerPanier"
      />
    </CategoriesTiroirPanier>
  </div>
</template>

<style scoped>
.carte-page {
  min-height: 100%;
  background: #0a0a0a;
  color: #fff;
  font-family: Inter, sans-serif;
  font-size: 14px;
}

.carte-container {
  width: min(100%, 1280px);
  max-width: 1240px;
  margin: 0 auto;
  padding: 80px 20px 120px;
}

.page-header {
  margin: 0 auto 54px;
  text-align: center;
}

.eyebrow {
  margin: 0 0 20px;
  color: #f97316;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.2px;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(44px, 4.15vw, 60px);
  font-weight: 700;
  letter-spacing: -3.5px;
  line-height: 1.04;
}

.kivu {
  position: relative;
  color: #f97316;
  white-space: nowrap;
}

.kivu::after {
  position: absolute;
  right: 0;
  bottom: 3px;
  left: 0;
  height: 3px;
  border-radius: 999px;
  background: #f97316;
  content: '';
  transform: rotate(-1.5deg);
}

.intro {
  max-width: 520px;
  margin: 20px auto 0;
  color: #a3a3a3;
  font-size: 16px;
  line-height: 1.75;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 70px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 20px;
  background: rgba(20, 20, 20, 0.78);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}

.search-field {
  display: flex;
  flex: 1 0 260px;
  align-items: center;
  gap: 11px;
  min-width: 260px;
  height: 44px;
  padding: 0 13px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 12px;
  background: #111;
}

.search-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  stroke: #7a7a7a;
  stroke-linecap: round;
  stroke-width: 1.7;
}

.search-field input {
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #fff;
  font: inherit;
  font-size: 13px;
}

.search-field input::placeholder {
  color: #7a7a7a;
  opacity: 1;
}

.category-filters {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.filter-pill {
  min-height: 40px;
  padding: 0 17px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 99px;
  background: #151515;
  color: #a3a3a3;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  white-space: nowrap;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.filter-pill:hover,
.filter-pill.active {
  border-color: #f97316;
  background: #f97316;
  color: #fff;
}

.filter-pill:focus-visible,
.search-field:focus-within,
.retry-button:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 3px;
}

.cart-lines {
  margin: 0;
  padding: 0;
}

.cart-empty {
  margin: 0;
  padding: 28px 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  background: #111;
  color: #a3a3a3;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.order-note {
  display: grid;
  gap: 9px;
  margin-top: 20px;
  color: #bdbdbd;
  font-size: 12px;
  font-weight: 500;
}

.order-note small {
  color: #7a7a7a;
  font-weight: 400;
}

.order-note textarea {
  width: 100%;
  min-height: 84px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 11px;
  outline: none;
  background: #0e0e0e;
  color: #fff;
  font: inherit;
  font-size: 12px;
  resize: vertical;
}

.order-note textarea:focus-visible {
  border-color: #f97316;
  outline: 2px solid rgba(249, 115, 22, 0.3);
  outline-offset: 2px;
}

.cart-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding: 17px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.13);
  color: #a3a3a3;
  font-size: 12px;
}

.cart-total strong {
  color: #fff;
  font-size: 20px;
}

.cart-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.clear-cart-button,
.continue-button {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}

.clear-cart-button {
  border: 1px solid rgba(255, 255, 255, 0.13);
  background: rgba(255, 255, 255, 0.05);
  color: #a3a3a3;
}

.continue-button {
  flex: 1;
  border: 0;
  background: linear-gradient(135deg, #ff8a00, #f15a00);
  color: #fff;
}

.clear-cart-button:focus-visible,
.continue-button:focus-visible,
.unavailable-message button:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 3px;
}

.unavailable-message {
  margin-top: 18px;
  padding: 13px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.08);
  color: #ff9a9a;
  font-size: 12px;
  line-height: 1.5;
}

.unavailable-message p {
  margin: 0;
}

.unavailable-message ul {
  margin: 9px 0 0;
  padding-left: 18px;
}

.unavailable-message li {
  padding: 4px 0;
}

.unavailable-message button {
  margin-left: 7px;
  padding: 4px 8px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 7px;
  background: #171111;
  color: #ffb0b0;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
}

.clear-cart-button:hover {
  background: rgba(255, 255, 255, 0.09);
}

.continue-button:hover {
  background: #ffa64d;
}

.menu-state {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 24px;
  background: rgba(20, 20, 20, 0.78);
  color: #a3a3a3;
  text-align: center;
}

.error-state {
  flex-direction: column;
  color: #ffa64d;
}

.error-state p {
  margin: 0;
}

.loader {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  border: 2px solid #f97316;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.retry-button {
  min-height: 40px;
  padding: 0 17px;
  border: 1px solid #f97316;
  border-radius: 99px;
  background: #151515;
  color: #ffa64d;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.retry-button:hover {
  background: #f15a00;
  color: #fff;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 899px) {
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-field {
    flex: 0 0 44px;
    width: 100%;
  }

  .category-filters {
    justify-content: flex-start;
  }

}

@media (max-width: 600px) {
  .carte-container {
    padding-top: 62px;
    padding-bottom: 80px;
  }

  .page-header h1 {
    letter-spacing: -2.5px;
  }

}
</style>
