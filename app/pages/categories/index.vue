<script setup>
useHead({
  title: 'Categories | SmartResto',
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    },
  ],
})

const notifier = useNotifier()
const {
  categories,
  pending: chargementCategories,
  error: erreurCategories,
  operation,
  recharger,
  creer,
  modifier,
  supprimer,
  monter,
  descendre,
} = await useCategories()
const { lire } = useApi()
const {
  data: plats,
  pending: chargementPlats,
  error: erreurPlats,
  refresh: actualiserPlats,
} = await useAsyncData(
  'categories-admin-plats',
  () => lire('/plats'),
  { default: () => [] },
)

const typeModal = ref(null)
const categorieSelectionnee = ref(null)
const erreursFormulaire = ref({})
const numeroFormulaire = ref(0)
const chargement = computed(() => chargementCategories.value || chargementPlats.value)
const erreurChargement = computed(() => erreurCategories.value || erreurPlats.value)
const listeCategories = computed(() => trierParOrdre(categories.value ?? []))
const comptages = computed(() => compterPlatsParCategorie(plats.value ?? []))
const ordreParDefaut = computed(() => {
  const derniereCategorie = listeCategories.value.at(-1)
  return Number(derniereCategorie?.ordre ?? 0) + 1
})
const titreModal = computed(() => {
  if (typeModal.value === 'creer') return 'New category'
  if (typeModal.value === 'modifier') return 'Edit category'
  return 'Delete category'
})
const enregistrement = computed(() => operation.value === 'enregistrement')
const suppression = computed(() => operation.value === 'suppression')
const messageErreur = computed(() =>
  erreurChargement.value?.message ?? 'Could not load categories. Please try again.',
)

function ouvrirCreation() {
  if (operation.value) return
  erreursFormulaire.value = {}
  categorieSelectionnee.value = null
  numeroFormulaire.value += 1
  typeModal.value = 'creer'
}

function ouvrirModification(categorie) {
  if (operation.value) return
  erreursFormulaire.value = {}
  categorieSelectionnee.value = categorie
  numeroFormulaire.value += 1
  typeModal.value = 'modifier'
}

function ouvrirSuppression(categorie) {
  if (operation.value) return
  categorieSelectionnee.value = categorie
  typeModal.value = 'supprimer'
}

function fermerModal() {
  if (operation.value) return
  typeModal.value = null
  erreursFormulaire.value = {}
}

async function enregistrerCategorie(donnees) {
  const erreurs = validerCategorie(
    donnees,
    listeCategories.value,
    categorieSelectionnee.value?.id ?? null,
  )

  erreursFormulaire.value = erreurs
  if (Object.keys(erreurs).length) return

  try {
    if (typeModal.value === 'creer') {
      await creer(donnees)
      notifier.succes('Category created.')
    } else {
      await modifier(categorieSelectionnee.value.id, donnees)
      notifier.succes('Category updated.')
    }
    typeModal.value = null
  } catch (erreur) {
    notifier.erreur(erreur)
  }
}

async function confirmerSuppression() {
  if (!categorieSelectionnee.value || operation.value) return

  try {
    await supprimer(categorieSelectionnee.value.id)
    notifier.succes('Category deleted.')
    typeModal.value = null
  } catch (erreur) {
    notifier.erreur(erreur)
  }
}

async function changerOrdre(action, id) {
  try {
    const deplacementEffectue = await action(id)
    if (deplacementEffectue) notifier.succes('Display order updated.')
  } catch (erreur) {
    notifier.erreur(erreur)
  }
}

async function actualiserToutesLesDonnees() {
  await Promise.all([recharger(), actualiserPlats()])
}
</script>

<template>
  <div class="categories-page">
    <div class="categories-content">
      <div class="action-bar">
        <p class="category-summary">
          {{ listeCategories.length }}
          {{ listeCategories.length === 1 ? 'category' : 'categories' }}
          à la carte
        </p>
        <button
          type="button"
          class="primary-button"
          :disabled="chargement || operation !== null"
          @click="ouvrirCreation"
        >
          <span aria-hidden="true">+</span>
          New category
        </button>
      </div>

      <section class="order-panel" aria-labelledby="order-title">
        <h2 id="order-title">Display Order</h2>

        <div v-if="chargement" class="page-state" role="status">
          <span class="loader" aria-hidden="true" />
          Loading categories…
        </div>

        <div v-else-if="erreurChargement" class="page-state error-state" role="alert">
          <p>{{ messageErreur }}</p>
          <button
            type="button"
            class="retry-button"
            :disabled="chargement"
            @click="actualiserToutesLesDonnees"
          >
            Retry
          </button>
        </div>

        <div v-else-if="!listeCategories.length" class="page-state empty-state">
          <p>No categories yet. Add your first category to organize the menu.</p>
          <button
            type="button"
            class="primary-button"
            :disabled="operation !== null"
            @click="ouvrirCreation"
          >
            <span aria-hidden="true">+</span>
            New category
          </button>
        </div>

        <ul v-else class="category-list">
          <CategoriesLigneCategorie
            v-for="(categorie, index) in listeCategories"
            :key="categorie.id"
            :categorie="categorie"
            :index="index"
            :total="listeCategories.length"
            :nombre-plats="comptages[String(categorie.id)] ?? 0"
            :operation="operation"
            @monter="changerOrdre(monter, $event)"
            @descendre="changerOrdre(descendre, $event)"
            @modifier="ouvrirModification"
            @supprimer="ouvrirSuppression"
          />
        </ul>
      </section>
    </div>

    <CategoriesModaleCategorie
      :ouvert="typeModal !== null"
      :titre="titreModal"
      @fermer="fermerModal"
    >
      <CategoriesFormulaireCategorie
        v-if="typeModal === 'creer' || typeModal === 'modifier'"
        :key="numeroFormulaire"
        :categorie="categorieSelectionnee"
        :ordre-par-defaut="ordreParDefaut"
        :erreurs="erreursFormulaire"
        :enregistrement="enregistrement"
        @enregistrer="enregistrerCategorie"
        @annuler="fermerModal"
      />

      <div v-else-if="typeModal === 'supprimer'" class="delete-confirmation">
        <p>
          Are you sure you want to delete
          <strong>{{ categorieSelectionnee?.nom }}</strong>?
          The category can only be deleted if it has no dishes.
        </p>
        <p class="dish-count-confirmation">
          {{ libellePlats(comptages[String(categorieSelectionnee?.id)] ?? 0) }}
          currently in this category. This will be checked again before deletion.
        </p>
        <footer class="modal-actions">
          <button
            type="button"
            class="button button-muted"
            :disabled="suppression"
            @click="fermerModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="button button-danger"
            :disabled="suppression"
            @click="confirmerSuppression"
          >
            {{ suppression ? 'Deleting…' : 'Delete' }}
          </button>
        </footer>
      </div>
    </CategoriesModaleCategorie>
  </div>
</template>

<style scoped>
.categories-page {
  min-height: 100%;
  margin: -24px -16px;
  background: #0a0a0a;
  color: #fff;
  font-family: Inter, sans-serif;
}

.categories-content {
  max-width: 1500px;
  margin: 0 auto;
  padding: 30px 34px 70px;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.category-summary {
  margin: 0;
  color: #a3a3a3;
  font-size: 11px;
}

.primary-button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 20px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff8a00, #f15a00);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.2);
  transition: transform 0.2s, background 0.2s, opacity 0.2s;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #ffa64d;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.primary-button span {
  font-size: 20px;
  font-weight: 400;
  line-height: 1;
}

.order-panel {
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 20px;
  background: rgba(20, 20, 20, 0.78);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}

.order-panel h2 {
  margin: 0 0 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.category-list {
  margin: 0;
  padding: 0;
}

.page-state {
  display: flex;
  min-height: 180px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  color: #a3a3a3;
  font-size: 13px;
  text-align: center;
}

.page-state p {
  max-width: 460px;
  margin: 0;
}

.error-state {
  color: #ff8080;
}

.loader {
  width: 22px;
  height: 22px;
  border: 2px solid #f97316;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.retry-button {
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(249, 115, 22, 0.4);
  border-radius: 10px;
  background: #1d1d1d;
  color: #ffa64d;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.retry-button:hover {
  background: #28211b;
}

.retry-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.primary-button:focus-visible,
.retry-button:focus-visible,
.button:focus-visible {
  outline: 2px solid #ffa64d;
  outline-offset: 3px;
}

.delete-confirmation {
  color: #bdbdbd;
  font-size: 13px;
  line-height: 1.65;
}

.delete-confirmation p {
  margin: 0;
}

.delete-confirmation strong {
  color: #fff;
}

.dish-count-confirmation {
  margin-top: 12px !important;
  color: #7a7a7a;
  font-size: 11px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 28px;
}

.button {
  min-height: 42px;
  padding: 0 17px;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.button-muted {
  background: rgba(255, 255, 255, 0.05);
  color: #a3a3a3;
}

.button-muted:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.button-danger {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.15);
  color: #ff8080;
}

.button-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .categories-page {
    margin: -24px -16px;
  }

  .categories-content {
    padding: 20px 16px 50px;
  }

  .order-panel {
    padding: 16px 12px;
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .categories-page {
    margin-right: -24px;
    margin-left: -24px;
  }
}

@media (min-width: 1024px) {
  .categories-page {
    margin-right: -32px;
    margin-left: -32px;
  }
}
</style>
