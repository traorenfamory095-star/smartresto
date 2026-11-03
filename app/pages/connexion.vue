<script setup>
// Page de connexion. Propriétaire : Gaël (module Personnel et rôles).
// Deux onglets, comme la maquette :
//   - « Espace client » : pas de compte client (aucune ressource clients dans l'API).
//     Le site public est libre : on oriente vers la carte et la réservation.
//   - « Espace administration » : la vraie connexion du personnel, via useAuth().seConnecter.
// /connexion?espace=administration ouvre directement le second onglet.
// /connexion?redirection=/plats ramène à la page demandée après la connexion.
import { redirectionSure } from '~/utils/permissions.js'

definePageMeta({ layout: false })
useHead({ title: 'Connexion' })

const route = useRoute()
const { seConnecter } = useAuth()

const espace = ref(route.query.espace === 'client' ? 'client' : 'administration')
const formulaire = reactive({ email: '', motDePasse: '' })
const erreurs = reactive({ email: '', motDePasse: '' })
const erreurConnexion = ref('')
const afficherMotDePasse = ref(false)
const chargement = ref(false)
const champEmail = ref(null)

const TEXTES = {
  client: {
    accroche: 'Votre table vous attend',
    titre: ['Bienvenue', 'chez SmartResto.'],
  },
  administration: {
    accroche: 'Gérez mieux. Servez mieux.',
    titre: ['Le restaurant,', "en un coup d'œil."],
  },
}
const texte = computed(() => TEXTES[espace.value])

function changerEspace(valeur) {
  espace.value = valeur
  erreurConnexion.value = ''
  afficherMotDePasse.value = false
}

function valider() {
  erreurs.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulaire.email.trim())
    ? ''
    : 'Saisissez une adresse e-mail valide.'
  erreurs.motDePasse = formulaire.motDePasse ? '' : 'Saisissez votre mot de passe.'
  return !erreurs.email && !erreurs.motDePasse
}

async function envoyer() {
  if (chargement.value) return
  erreurConnexion.value = ''
  if (!valider()) return

  chargement.value = true
  try {
    const resultat = await seConnecter(formulaire.email, formulaire.motDePasse)
    if (!resultat.ok) {
      erreurConnexion.value = resultat.erreur
      formulaire.motDePasse = ''
      return
    }
    formulaire.motDePasse = ''
    await navigateTo(redirectionSure(route.query.redirection))
  } finally {
    chargement.value = false
  }
}

onMounted(() => {
  if (espace.value === 'administration') champEmail.value?.focus()
})

const classeChamp = (enErreur) => [
  'h-12 w-full rounded-xl border bg-bg px-3.5 text-ink outline-none transition placeholder:text-mut/70',
  'focus:border-pri disabled:opacity-60',
  enErreur ? 'border-err' : 'border-line',
]
</script>

<template>
  <div class="min-h-screen bg-bg p-4 text-ink md:grid md:grid-cols-[1.1fr_.9fr] md:gap-6 md:p-6">
    <!-- Visuel (maquette : photo de cuisine au feu) -->
    <div
      class="relative h-72 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#3a1a05] via-[#1a0d04] to-black md:h-auto"
    >
      <img
        src="https://images.unsplash.com/photo-1529563021893-cc83c992d75d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-transparent from-20% to-black/90" aria-hidden="true" />

      <NuxtLink to="/" class="brand absolute left-7 top-7 z-10 text-white md:left-10 md:top-10">
        Smart<span>Resto</span>
      </NuxtLink>

      <div class="absolute bottom-[8%] left-7 z-10 md:left-[7%]">
        <span class="mb-4 inline-block text-[11px] font-bold uppercase tracking-[2.2px] text-pri">
          {{ texte.accroche }}
        </span>
        <p class="text-3xl font-bold leading-tight tracking-tight text-white md:text-[45px]">
          {{ texte.titre[0] }}<br />
          <span class="text-pri">{{ texte.titre[1] }}</span>
        </p>
      </div>
    </div>

    <!-- Carte de connexion -->
    <main
      class="relative z-10 mx-auto -mt-5 w-full max-w-[460px] self-center rounded-carte-lg border border-line bg-card/90 p-6 shadow-2xl backdrop-blur md:mt-0 md:p-10"
    >
      <div role="tablist" aria-label="Choisir un espace" class="mb-6 flex gap-1.5 rounded-2xl border border-line bg-soft p-1">
        <button
          v-for="onglet in [
            { valeur: 'client', libelle: 'Espace client' },
            { valeur: 'administration', libelle: 'Espace administration' },
          ]"
          :id="`onglet-${onglet.valeur}`"
          :key="onglet.valeur"
          type="button"
          role="tab"
          :aria-selected="espace === onglet.valeur"
          aria-controls="panneau-connexion"
          class="flex min-h-10 flex-1 items-center justify-center whitespace-nowrap rounded-xl px-2.5 text-xs font-semibold transition"
          :class="espace === onglet.valeur ? 'bg-degrade text-white shadow-lg shadow-pri/25' : 'text-mut hover:text-ink'"
          @click="changerEspace(onglet.valeur)"
        >
          {{ onglet.libelle }}
        </button>
      </div>

      <section id="panneau-connexion" role="tabpanel" :aria-labelledby="`onglet-${espace}`">
        <!-- Espace client : aucune authentification -->
        <template v-if="espace === 'client'">
          <h1 class="mb-2 text-2xl font-bold tracking-tight">Bon retour parmi nous</h1>
          <p class="mb-6 text-sm leading-relaxed text-mut">
            Pas besoin de compte : consultez la carte et réservez votre table en quelques clics.
          </p>
          <div class="flex flex-col gap-3">
            <NuxtLink
              to="/carte"
              class="inline-flex min-h-12 items-center justify-center rounded-xl bg-degrade px-5 font-semibold text-white transition hover:brightness-110"
            >
              Voir la carte
            </NuxtLink>
            <NuxtLink
              to="/reserver"
              class="inline-flex min-h-12 items-center justify-center rounded-xl border border-pri px-5 font-semibold text-ink transition hover:bg-pri/10"
            >
              Réserver une table
            </NuxtLink>
          </div>
        </template>

        <!-- Espace administration : connexion du personnel -->
        <template v-else>
          <h1 class="mb-2 text-2xl font-bold tracking-tight">Espace sécurisé</h1>
          <p class="mb-6 text-sm leading-relaxed text-mut">Réservé au personnel du restaurant.</p>

          <form class="flex flex-col gap-4" novalidate :aria-busy="chargement" @submit.prevent="envoyer">
            <div>
              <label for="email" class="mb-2 block text-xs font-medium text-mut">E-mail professionnel</label>
              <input
                id="email"
                ref="champEmail"
                v-model="formulaire.email"
                type="email"
                name="email"
                autocomplete="username"
                placeholder="prenom@smartresto.cd"
                required
                :disabled="chargement"
                :aria-invalid="erreurs.email ? 'true' : undefined"
                :aria-describedby="erreurs.email ? 'email-erreur' : undefined"
                :class="classeChamp(erreurs.email)"
              />
              <p v-if="erreurs.email" id="email-erreur" class="mt-1.5 text-xs text-err">{{ erreurs.email }}</p>
            </div>

            <div>
              <label for="mot-de-passe" class="mb-2 block text-xs font-medium text-mut">Mot de passe</label>
              <div class="relative">
                <input
                  id="mot-de-passe"
                  v-model="formulaire.motDePasse"
                  :type="afficherMotDePasse ? 'text' : 'password'"
                  name="motDePasse"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  required
                  :disabled="chargement"
                  :aria-invalid="erreurs.motDePasse ? 'true' : undefined"
                  :aria-describedby="erreurs.motDePasse ? 'mdp-erreur' : undefined"
                  :class="[classeChamp(erreurs.motDePasse), 'pr-20']"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-mut transition hover:text-pri"
                  :aria-pressed="afficherMotDePasse"
                  aria-controls="mot-de-passe"
                  @click="afficherMotDePasse = !afficherMotDePasse"
                >
                  {{ afficherMotDePasse ? 'Masquer' : 'Afficher' }}
                </button>
              </div>
              <p v-if="erreurs.motDePasse" id="mdp-erreur" class="mt-1.5 text-xs text-err">{{ erreurs.motDePasse }}</p>
            </div>

            <p
              v-if="erreurConnexion"
              role="alert"
              class="rounded-xl border border-err/40 bg-err/10 px-3.5 py-3 text-sm text-err"
            >
              {{ erreurConnexion }}
            </p>

            <button
              type="submit"
              :disabled="chargement"
              class="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-degrade px-5 font-semibold text-white shadow-lg shadow-pri/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >
              <span
                v-if="chargement"
                class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
              {{ chargement ? 'Connexion…' : "Accéder à l'administration" }}
            </button>

            <p class="text-center text-[11px] leading-relaxed text-mut">
              Ce compte donne accès à des fonctions réservées. Les droits dépendent de votre rôle.
            </p>
          </form>
        </template>
      </section>
    </main>
  </div>
</template>
