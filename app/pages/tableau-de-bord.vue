<script setup>
// Page d'accueil de l'administration : un raccourci par module autorisé. Propriétaire : Traoré.
useHead({ title: 'Tableau de bord' })

const { utilisateur, peut } = useAuth()
const raccourcis = computed(() =>
  MENU_ADMIN.filter((lien) => lien.chemin !== '/tableau-de-bord' && peut(lien.chemin)),
)
</script>

<template>
  <section>
    <h1 class="text-3xl font-bold">
      Bonjour<span v-if="utilisateur">, {{ utilisateur.nom }}</span>
    </h1>
    <p class="mt-2 text-gris">Accédez rapidement aux modules du restaurant.</p>

    <ul class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="lien in raccourcis" :key="lien.chemin">
        <NuxtLink
          :to="lien.chemin"
          class="flex h-full items-start gap-4 rounded-carte border border-bordure bg-carte p-5 transition hover:border-accent/50"
        >
          <span class="rounded-xl bg-accent/10 p-2 text-accent">
            <UiIcone :nom="lien.icone" />
          </span>
          <span>
            <span class="block font-semibold">{{ lien.libelle }}</span>
            <span class="mt-1 block text-sm text-gris">{{ lien.description }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
