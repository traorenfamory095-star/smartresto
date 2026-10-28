<script setup>
// Détail d'une commande. Propriétaire : Traoré.
const route = useRoute()
const notifier = useNotifier()
const { chargerDetail, marquerServie, annuler } = useCommandes()

const id = computed(() => route.params.id)
const { data: commande, pending, error, refresh } = await useAsyncData(
  () => `commande-${id.value}`,
  () => chargerDetail(id.value),
  { watch: [id] },
)

useHead({ title: computed(() => `Commande #${id.value}`) })

const actions = computed(() => actionsDisponibles(commande.value?.statut))
const sousTotal = computed(() => commande.value?.total ?? 0)

// Une seule requête à la fois : les boutons sont désactivés pendant l'envoi (pas de double clic).
const envoi = ref(false)
const confirmerAnnulation = ref(false)

async function executer(action, messageSucces) {
  if (envoi.value) return false
  envoi.value = true
  try {
    await action(id.value)
    notifier.succes(messageSucces)
    await refresh()
    return true
  } catch (e) {
    notifier.erreur(e)
    await refresh() // l'écran reflète l'état réel du serveur
    return false
  } finally {
    envoi.value = false
  }
}

const servir = () => executer(marquerServie, 'Commande marquée servie.')
async function confirmer() {
  if (await executer(annuler, 'Commande annulée.')) confirmerAnnulation.value = false
}
</script>

<template>
  <section>
    <UiEtat :chargement="pending" :erreur="error" :vide="!pending && !error && !commande" message-vide="Commande introuvable." @reessayer="refresh">
      <template v-if="commande">
        <header class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-4">
            <NuxtLink to="/commandes" class="text-sm text-mut hover:text-ink focus-visible:outline-2 focus-visible:outline-cy">
              <span aria-hidden="true">←</span> Retour aux commandes
            </NuxtLink>
            <div class="border-l border-line pl-4">
              <h1 class="text-2xl font-bold text-head">Commande #{{ commande.id }}</h1>
              <p class="text-sm text-mut">
                {{ commande.table ? `Table ${String(commande.table.numero).padStart(2, '0')}` : 'Table inconnue' }}
                · {{ formaterHeure(commande.creeLe) }}
                · Servie par {{ commande.serveur?.nom ?? '—' }}
              </p>
            </div>
          </div>
          <UiBadgeStatut type="commande" :statut="commande.statut" />
        </header>

        <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <UiCarte grand>
            <h2 class="text-lg font-semibold text-head">Détail de la commande</h2>
            <p v-if="commande.note" class="mt-2 text-sm text-mut">Note : {{ commande.note }}</p>

            <p v-if="!commande.lignes.length" class="mt-6 text-mut">Cette commande ne contient aucune ligne.</p>
            <ul v-else class="mt-4 divide-y divide-line">
              <li v-for="l in commande.lignes" :key="l.id" class="flex flex-wrap items-center gap-4 py-4">
                <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-soft text-sm font-bold text-acc">
                  {{ l.quantite }}×
                </span>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-head">{{ l.plat?.nom ?? 'Plat supprimé' }}</p>
                  <p v-if="l.remarque" class="text-sm text-acc">{{ l.remarque }}</p>
                </div>
                <UiBadgeStatut type="ligneCuisine" :statut="l.statutCuisine" />
                <span class="w-20 text-right text-lg font-bold text-head">{{ formaterPrix(l.total) }}</span>
              </li>
            </ul>
          </UiCarte>

          <UiCarte grand class="self-start">
            <h2 class="text-lg font-semibold text-head">Récapitulatif</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-mut">Sous-total</dt>
                <dd class="font-medium text-ink">{{ formaterPrix(sousTotal) }}</dd>
              </div>
              <div class="flex items-baseline justify-between border-t border-line pt-4">
                <dt class="text-lg text-mut">Total</dt>
                <dd class="text-2xl font-bold text-acc">{{ formaterPrix(sousTotal) }}</dd>
              </div>
            </dl>

            <div class="mt-6 grid gap-3">
              <UiBouton taille="lg" :disabled="!actions.peutServir || envoi" :chargement="envoi && !confirmerAnnulation" @click="servir">
                Marquer servie
              </UiBouton>
              <p v-if="!actions.peutServir && commande.statut !== 'servie' && actions.peutAnnuler" class="text-xs text-mut">
                Disponible quand la cuisine a marqué la commande « Prête ».
              </p>
              <UiBouton v-if="actions.peutAnnuler" variante="danger" taille="lg" :disabled="envoi" @click="confirmerAnnulation = true">
                Annuler la commande
              </UiBouton>
              <p v-else-if="commande.statut === 'payee'" class="text-xs text-mut">
                Une commande payée ne peut plus être annulée.
              </p>
            </div>
          </UiCarte>
        </div>

        <UiConfirmer
          v-model="confirmerAnnulation"
          :titre="`Annuler la commande #${commande.id} ?`"
          message="La table sera libérée. Cette action ne peut pas être défaite."
          libelle-confirmer="Annuler la commande"
          :chargement="envoi"
          @confirmer="confirmer"
        />
      </template>
    </UiEtat>
  </section>
</template>