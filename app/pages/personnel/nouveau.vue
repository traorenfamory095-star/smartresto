<script setup>
useHead({ title: 'Ajouter un employé — SmartResto' })

const { creerEmploye } = usePersonnel()
const notifier = useNotifier()

const formulaire = reactive({
  nom: '',
  email: '',
  motDePasse: '',
  role: 'serveur',
  actif: true,
})

const erreurs = ref({})
const erreurGenerale = ref('')
const enregistrement = ref(false)

function valider() {
  const messages = {}

  if (!formulaire.nom.trim()) {
    messages.nom = 'Le nom est obligatoire.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulaire.email.trim())) {
    messages.email = 'Saisis une adresse e-mail valide.'
  }

  if (!formulaire.motDePasse.trim()) {
    messages.motDePasse = 'Le mot de passe est obligatoire.'
  }

  if (!ROLES.includes(formulaire.role)) {
    messages.role = 'Choisis un rôle valide.'
  }

  erreurs.value = messages

  return Object.keys(messages).length === 0
}

async function enregistrer() {
  if (enregistrement.value) return

  erreurGenerale.value = ''

  if (!valider()) return

  enregistrement.value = true

  try {
    await creerEmploye(formulaire)
  } catch (erreur) {
    erreurGenerale.value =
      erreur.message || 'Impossible de créer cet employé.'

    notifier.erreur(erreurGenerale.value)
    return
  } finally {
    enregistrement.value = false
  }

  formulaire.motDePasse = ''
  clearNuxtData('personnel-liste')
  notifier.succes('Employé créé avec succès.')

  await navigateTo('/personnel')
}
</script>

<template>
  <section aria-labelledby="titre-creation" class="max-w-xl">
    <NuxtLink to="/personnel" class="text-accent underline">
      Retour au personnel
    </NuxtLink>

    <h1 id="titre-creation" class="mt-4 text-3xl font-bold">
      Ajouter un employé
    </h1>

    <form
      class="mt-6 space-y-5"
      novalidate
      :aria-busy="enregistrement"
      @submit.prevent="enregistrer"
    >
      <fieldset :disabled="enregistrement" class="space-y-5">
        <legend class="sr-only">Informations du nouvel employé</legend>

        <div>
          <label for="nom" class="mb-2 block font-medium">
            Nom complet
          </label>

          <input
            id="nom"
            v-model="formulaire.nom"
            type="text"
            autocomplete="name"
            required
            :aria-invalid="Boolean(erreurs.nom)"
            :aria-describedby="erreurs.nom ? 'erreur-nom' : undefined"
            class="w-full rounded-lg border border-bordure bg-fond px-3 py-3 text-texte focus-visible:outline-2 focus-visible:outline-accent"
          />

          <p
            v-if="erreurs.nom"
            id="erreur-nom"
            class="mt-1 text-sm text-red-600"
          >
            {{ erreurs.nom }}
          </p>
        </div>

        <div>
          <label for="email" class="mb-2 block font-medium">
            Adresse e-mail
          </label>

          <input
            id="email"
            v-model="formulaire.email"
            type="email"
            autocomplete="off"
            required
            :aria-invalid="Boolean(erreurs.email)"
            :aria-describedby="erreurs.email ? 'erreur-email' : undefined"
            class="w-full rounded-lg border border-bordure bg-fond px-3 py-3 text-texte focus-visible:outline-2 focus-visible:outline-accent"
          />

          <p
            v-if="erreurs.email"
            id="erreur-email"
            class="mt-1 text-sm text-red-600"
          >
            {{ erreurs.email }}
          </p>
        </div>

        <div>
          <label for="mot-de-passe" class="mb-2 block font-medium">
            Mot de passe
          </label>

          <input
            id="mot-de-passe"
            v-model="formulaire.motDePasse"
            type="password"
            autocomplete="new-password"
            required
            :aria-invalid="Boolean(erreurs.motDePasse)"
            :aria-describedby="
              erreurs.motDePasse ? 'erreur-mot-de-passe' : undefined
            "
            class="w-full rounded-lg border border-bordure bg-fond px-3 py-3 text-texte focus-visible:outline-2 focus-visible:outline-accent"
          />

          <p
            v-if="erreurs.motDePasse"
            id="erreur-mot-de-passe"
            class="mt-1 text-sm text-red-600"
          >
            {{ erreurs.motDePasse }}
          </p>
        </div>

        <div>
          <label for="role" class="mb-2 block font-medium">
            Rôle
          </label>

          <select
            id="role"
            v-model="formulaire.role"
            required
            :aria-invalid="Boolean(erreurs.role)"
            :aria-describedby="erreurs.role ? 'erreur-role' : undefined"
            class="w-full rounded-lg border border-bordure bg-fond px-3 py-3 text-texte focus-visible:outline-2 focus-visible:outline-accent"
          >
            <option v-for="role in ROLES" :key="role" :value="role">
              {{ libelleRole(role) }}
            </option>
          </select>

          <p
            v-if="erreurs.role"
            id="erreur-role"
            class="mt-1 text-sm text-red-600"
          >
            {{ erreurs.role }}
          </p>
        </div>

        <label class="flex items-center gap-3">
          <input
            v-model="formulaire.actif"
            type="checkbox"
            class="h-4 w-4"
          />
          Compte actif
        </label>

        <p
          v-if="erreurGenerale"
          role="alert"
          class="rounded-lg border border-red-500 p-3 text-red-600"
        >
          {{ erreurGenerale }}
        </p>

        <button
          type="submit"
          class="rounded-lg border border-bordure px-5 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {{ enregistrement ? 'Enregistrement…' : 'Créer l’employé' }}
        </button>
      </fieldset>
    </form>
  </section>
</template>