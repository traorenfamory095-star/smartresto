<script setup>
// Page « Spéciaux » : les plats disponibles aux prix les plus doux, lus dans l'API.
// Propriétaire : Traoré (site public). Aucune offre ni réduction n'est inventée.
definePageMeta({ layout: 'public' })
useHead({ title: 'Spéciaux' })

const { lire } = useApi()

const { data: plats, pending, error, refresh } = await useAsyncData('speciaux', () =>
  lire('/plats', { disponible: true, _sort: 'prix', _order: 'asc', _limit: 6 }),
)
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
    <h1 class="text-4xl font-bold">Nos <span class="text-accent">spéciaux</span></h1>
    <p class="mt-4 max-w-xl text-gris">
      Les plats les plus doux pour le portefeuille, à savourer sur place.
    </p>

    <div class="mt-10">
      <UiEtat
        :chargement="pending"
        :erreur="error"
        :vide="!plats?.length"
        message-vide="Aucun plat à afficher pour le moment."
        @reessayer="refresh"
      >
        <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="plat in plats" :key="plat.id">
            <PublicPlatCarte :plat="plat" />
          </li>
        </ul>
      </UiEtat>
    </div>

    <div class="mt-12 text-center">
      <UiBouton to="/carte" variante="secondaire" taille="lg">Voir toute la carte</UiBouton>
    </div>
  </div>
</template>
