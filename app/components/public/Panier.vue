<script setup>
// Fenêtre « Ma commande » du site public : panier + coordonnées + envoi. Propriétaire : Traoré.
// Nom auto-importé par Nuxt : <PublicPanier v-model="ouvert" />
const ouvert = defineModel({ type: Boolean, default: false })

const panier = usePanierPublic()
const { envoyer } = useDemandes()
const notifier = useNotifier()

const envoi = ref(false)
const numeroEnvoye = ref(null) // numéro de la demande, une fois envoyée
const tentative = ref(false)    // on n'affiche les erreurs de saisie qu'après un premier clic

const problemes = computed(() =>
  problemesDemande({
    nomClient: panier.nomClient.value,
    telephone: panier.telephone.value,
    nbCouverts: panier.nbCouverts.value,
    lignes: panier.lignes.value,
  }),
)

async function soumettre() {
  tentative.value = true
  if (envoi.value || problemes.value.length) return
  envoi.value = true
  try {
    const demande = await envoyer({
      nomClient: panier.nomClient.value,
      telephone: panier.telephone.value,
      nbCouverts: panier.nbCouverts.value,
      note: panier.note.value,
      lignes: panier.lignes.value,
    })
    numeroEnvoye.value = demande.id
    panier.vider()
    tentative.value = false
  } catch (e) {
    // Le panier est conservé : le client peut réessayer.
    notifier.erreur(e)
  } finally {
    envoi.value = false
  }
}

function fermer() {
  ouvert.value = false
  numeroEnvoye.value = null
}
</script>

<template>
  <UiModal v-model="ouvert" titre="Ma commande">
    <!-- Confirmation -->
    <div v-if="numeroEnvoye" class="py-4 text-center" role="status">
      <p class="text-lg font-semibold text-head">Merci ! Demande n°{{ numeroEnvoye }} envoyée.</p>
      <p class="mt-2 text-sm text-mut">
        Un membre de l'équipe va la confirmer et vous appeler au numéro indiqué.
      </p>
    </div>

    <!-- Panier et coordonnées -->
    <div v-else>
      <CommandesPanier
        :lignes="panier.lignes.value"
        @quantite="panier.changerQuantite"
        @retirer="panier.retirer"
        @remarque="panier.changerRemarque"
      />

      <div v-if="panier.lignes.value.length" class="mt-2 flex items-baseline justify-between border-t border-line pt-4" aria-live="polite">
        <span class="text-mut">Total ({{ panier.nbArticles.value }} article(s))</span>
        <span class="text-xl font-bold text-acc">{{ formaterPrix(panier.total.value) }}</span>
      </div>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <UiChamp v-model="panier.nomClient.value" label="Votre nom" autocomplete="name" requis />
        <UiChamp v-model="panier.telephone.value" label="Téléphone" type="tel" autocomplete="tel" requis />
        <UiChamp v-model="panier.nbCouverts.value" label="Personnes" type="number" min="1" max="20" requis />
      </div>
      <UiChamp v-model="panier.note.value" label="Un message pour l'équipe (facultatif)" as="textarea" rows="2" maxlength="200" class="mt-4" />

      <ul v-if="tentative && problemes.length" class="mt-3 space-y-1 text-sm text-err" role="alert">
        <li v-for="p in problemes" :key="p">{{ p }}</li>
      </ul>
      <p class="mt-3 text-xs text-mut">
        Il ne s'agit pas d'un paiement : l'équipe confirme votre demande et prépare votre table.
      </p>
    </div>

    <template #actions>
      <template v-if="numeroEnvoye">
        <UiBouton @click="fermer">Fermer</UiBouton>
      </template>
      <template v-else>
        <UiBouton variante="discret" :disabled="envoi" @click="fermer">Continuer mes choix</UiBouton>
        <UiBouton :chargement="envoi" :disabled="!panier.lignes.value.length" @click="soumettre">
          Envoyer ma commande
        </UiBouton>
      </template>
    </template>
  </UiModal>
</template>