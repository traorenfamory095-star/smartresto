<script setup>
definePageMeta({ layout: false })
useHead({ title: 'Connexion — SmartResto' })

const { seConnecter } = useAuth()

const espace = ref('administration')
const email = ref('')
const motDePasse = ref('')
const erreur = ref('')
const chargement = ref(false)

async function envoyer() {
  if (chargement.value) return

  erreur.value = ''

  const adresse = email.value.trim()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse)) {
    erreur.value = 'Saisis une adresse e-mail valide.'
    return
  }

  if (!motDePasse.value) {
    erreur.value = 'Saisis ton mot de passe.'
    return
  }

  chargement.value = true

  try {
    const resultat = await seConnecter(adresse, motDePasse.value)

    if (!resultat.ok) {
      erreur.value = resultat.erreur
      return
    }

    motDePasse.value = ''
    await navigateTo('/tableau-de-bord')
  } catch {
    erreur.value = 'Une erreur est survenue. Réessaie.'
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-fond px-4 py-12 text-texte"
  >
    <section
      aria-labelledby="titre-connexion"
      class="w-full max-w-md rounded-2xl border border-bordure p-6 shadow-lg sm:p-8"
    >
      <NuxtLink
        to="/"
        class="text-2xl font-bold text-accent focus-visible:outline-2"
      >
        SmartResto
      </NuxtLink>

      <h1 id="titre-connexion" class="mt-6 text-2xl font-bold">
        Connexion
      </h1>

      <div class="mt-6 flex gap-2" aria-label="Choisir un espace">
        <button
          type="button"
          :aria-pressed="espace === 'client'"
          class="flex-1 rounded-lg border border-bordure px-3 py-3 focus-visible:outline-2 focus-visible:outline-accent"
          :class="espace === 'client' ? 'text-accent' : 'text-gris'"
          @click="espace = 'client'"
        >
          Espace client
        </button>

        <button
          type="button"
          :aria-pressed="espace === 'administration'"
          class="flex-1 rounded-lg border border-bordure px-3 py-3 focus-visible:outline-2 focus-visible:outline-accent"
          :class="espace === 'administration' ? 'text-accent' : 'text-gris'"
          @click="espace = 'administration'"
        >
          Administration
        </button>
      </div>

      <div v-if="espace === 'client'" class="mt-6 space-y-4">
        <p class="text-gris">
          Découvre notre carte et réserve une table sans créer de compte.
        </p>

        <NuxtLink to="/carte" class="inline-block text-accent underline">
          Découvrir la carte
        </NuxtLink>
      </div>

      <form
        v-else
        class="mt-6 space-y-5"
        novalidate
        :aria-busy="chargement"
        @submit.prevent="envoyer"
      >
        <p class="text-sm text-gris">
          Connecte-toi avec ton compte employé.
        </p>

        <div>
          <label for="email" class="mb-2 block text-sm font-medium">
            Adresse e-mail
          </label>

          <input
            id="email"
            v-model="email"
            name="email"
            type="email"
            autocomplete="username"
            required
            :disabled="chargement"
            class="w-full rounded-lg border border-bordure bg-fond px-3 py-3 text-texte focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>

        <div>
          <label for="mot-de-passe" class="mb-2 block text-sm font-medium">
            Mot de passe
          </label>

          <input
            id="mot-de-passe"
            v-model="motDePasse"
            name="motDePasse"
            type="password"
            autocomplete="current-password"
            required
            :disabled="chargement"
            class="w-full rounded-lg border border-bordure bg-fond px-3 py-3 text-texte focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>

        <p
          v-if="erreur"
          role="alert"
          class="rounded-lg border border-red-500 p-3 text-sm text-red-600"
        >
          {{ erreur }}
        </p>

        <button
          type="submit"
          :disabled="chargement"
          class="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-fond focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
        >
          {{ chargement ? 'Connexion en cours…' : 'Se connecter' }}
        </button>
      </form>
    </section>
  </main>
</template>