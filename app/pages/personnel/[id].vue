<script setup>
useHead({ title: 'Modifier un employé — SmartResto' })

const route = useRoute()
const id = String(route.params.id)

const { obtenirEmploye, modifierEmploye } = usePersonnel()
const notifier = useNotifier()

const formulaire = reactive({
  nom: '',
  email: '',
  role: 'serveur',
  actif: true,
})

const champs = [
  { nom: 'nom', label: 'Nom complet', type: 'text' },
  { nom: 'email', label: 'Adresse e-mail', type: 'email' },
]

const erreurs = ref({})
const erreurGenerale = ref('')
const enregistrement = ref(false)

const {
  data: employe,
  status,
  error,
  refresh,
} = await useAsyncData(
  `personnel-employe-${id}`,
  () => obtenirEmploye(id),
  { lazy: true },
)

watch(
  employe,
  (valeur) => {
    if (!valeur) return

    formulaire.nom = valeur.nom
    formulaire.email = valeur.email
    formulaire.role = valeur.role
    formulaire.actif = valeur.actif
  },
  { immediate: true },
)

function valider() {
  const messages = {}

  if (!formulaire.nom.trim()) {
    messages.nom = 'Le nom est obligatoire.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulaire.email.trim())) {
    messages.email = 'Saisis une adresse e-mail valide.'
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
    await modifierEmploye(id, formulaire)
  } catch (erreur) {
    erreurGenerale.value =
      erreur.message || 'Impossible de modifier cet employé.'

    notifier.erreur(erreurGenerale.value)
    return
  } finally {
    enregistrement.value = false
  }

  clearNuxtData('personnel-liste')
  notifier.succes('Employé modifié avec succès.')

  await navigateTo('/personnel')
}
</script>

<template>
  <section aria-labelledby="titre-modification" class="max-w-xl">
    <NuxtLink to="/personnel" class="text-accent underline">
      Retour au personnel
    </NuxtLink>

    <h1 id="titre-modification" class="mt-4 text-3xl font-bold">
      Modifier un employé
    </h1>

    <p
      v-if="status === 'pending' || status === 'idle'"
      role="status"
      class="mt-6"
    >
      Chargement de l’employé…
    </p>

    <div
      v-else-if="error"
      role="alert"
      class="mt-6 rounded-lg border border-red-500 p-4"
    >
      <p>{{ error.message || 'Impossible de charger cet employé.' }}</p>

      <button
        type="button"
        class="mt-3 rounded-lg border px-4 py-2"
        @click="refresh()"
      >
        Réessayer
      </button>
    </div>

    <form
      v-else-if="employe"
      class="mt-6 space-y-5"
      novalidate
      :aria-busy="enregistrement"
      @submit.prevent="enregistrer"
    >
      <fieldset :disabled="enregistrement" class="space-y-5">
        <legend class="sr-only">Informations de l’employé</legend>

        <div v-for="champ in champs" :key="champ.nom">
          <label
            :for="champ.nom"
            class="mb-2 block font-medium"
          >
            {{ champ.label }}
          </label>

          <input
            :id="champ.nom"
            v-model="formulaire[champ.nom]"
            :type="champ.type"
            required
            :aria-invalid="Boolean(erreurs[champ.nom])"
            :aria-describedby="
              erreurs[champ.nom] ? `erreur-${champ.nom}` : undefined
            "
            class="w-full rounded-lg border border-bordure bg-fond px-3 py-3 text-texte focus-visible:outline-2 focus-visible:outline-accent"
          />

          <p
            v-if="erreurs[champ.nom]"
            :id="`erreur-${champ.nom}`"
            class="mt-1 text-sm text-red-600"
          >
            {{ erreurs[champ.nom] }}
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
          {{ enregistrement ? 'Enregistrement…' : 'Enregistrer les modifications' }}
        </button>
      </fieldset>
    </form>
  </section>
</template>