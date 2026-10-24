<script setup>
// Accueil du site public. Propriétaire : Traoré (site public).
// Les plats et catégories viennent de l'API : rien n'est écrit en dur.
definePageMeta({ layout: 'public' })
useHead({ title: 'Accueil' })

const { lire } = useApi()

const { data, pending, error, refresh } = await useAsyncData('accueil', async () => {
  const [plats, categories] = await Promise.all([
    lire('/plats', { disponible: true, _limit: 3 }),
    lire('/categories', { _sort: 'ordre', _order: 'asc' }),
  ])
  return { plats, categories }
})
</script>

<template>
  <div>
    <!-- Haut de page -->
    <section class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
      <div>
        <h1 class="text-4xl font-bold leading-tight sm:text-5xl">
          Goûtez les
          <span class="text-accent underline decoration-accent decoration-4 underline-offset-8">saveurs</span>
          du Kivu
        </h1>
        <p class="mt-6 max-w-md text-gris">
          Grillades au feu de bois, poissons du lac et plats traditionnels des Grands Lacs : une cuisine
          généreuse, préparée chaque jour.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <UiBouton to="/carte" taille="lg">Voir la carte</UiBouton>
          <UiBouton to="/reserver" variante="secondaire" taille="lg">Réserver une table</UiBouton>
        </div>
      </div>

      <div class="flex justify-center" aria-hidden="true">
        <div
          class="flex h-64 w-64 items-center justify-center rounded-full border border-bordure bg-section shadow-[0_0_80px_rgb(249_115_22/0.25)] sm:h-80 sm:w-80"
        >
          <UiIcone nom="plats" class="h-28 w-28 text-accent" />
        </div>
      </div>
    </section>

    <!-- Plats à découvrir -->
    <section class="bg-section py-14">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 class="text-3xl font-bold">Nos plats à <span class="text-accent">découvrir</span></h2>

        <div class="mt-8">
          <UiEtat
            :chargement="pending"
            :erreur="error"
            :vide="!data?.plats?.length"
            message-vide="La carte est en cours de préparation."
            @reessayer="refresh"
          >
            <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <li v-for="plat in data.plats" :key="plat.id">
                <PublicPlatCarte :plat="plat" />
              </li>
            </ul>
          </UiEtat>
        </div>

        <div class="mt-8 text-center">
          <UiBouton to="/carte" variante="secondaire">Voir toute la carte</UiBouton>
        </div>
      </div>
    </section>

    <!-- Catégories -->
    <section v-if="data?.categories?.length" class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h2 class="text-3xl font-bold">Pour <span class="text-accent">tous les appétits</span></h2>
      <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="categorie in data.categories" :key="categorie.id">
          <NuxtLink to="/carte" class="block h-full">
            <UiCarte survol class="h-full">
              <h3 class="font-semibold">{{ categorie.nom }}</h3>
              <p class="mt-1 text-sm text-gris">{{ categorie.description }}</p>
            </UiCarte>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Appel à réserver -->
    <section class="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <UiCarte grand class="flex flex-col items-center gap-4 text-center">
        <h2 class="text-2xl font-bold sm:text-3xl">Une table <span class="text-accent">vous attend</span></h2>
        <p class="max-w-md text-gris">Réservez en quelques secondes pour un déjeuner, un dîner ou une occasion spéciale.</p>
        <UiBouton to="/reserver" taille="lg">Réserver une table</UiBouton>
      </UiCarte>
    </section>
  </div>
</template>
