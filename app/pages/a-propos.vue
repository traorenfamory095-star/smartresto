<script setup>
// Page « À propos ». Propriétaire : Traoré (site public).
// Textes de présentation : à remplacer par ceux du vrai restaurant. Aucune donnée chiffrée inventée.
definePageMeta({ layout: 'public' })
useHead({ title: 'À propos' })

const valeurs = [
  { icone: 'plats', titre: 'Produits du lac', texte: 'Poissons du lac Kivu choisis chaque matin auprès de pêcheurs de la région.' },
  { icone: 'cuisine', titre: 'Cuisine traditionnelle', texte: 'Des recettes des Grands Lacs, préparées avec patience et au feu de bois.' },
  { icone: 'reservations', titre: 'Accueil chaleureux', texte: 'Une salle, une terrasse et un espace privé pour accueillir chaque occasion.' },
]
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
    <h1 class="text-4xl font-bold">Notre <span class="text-accent">histoire</span></h1>

    <div class="mt-8 grid gap-8 md:grid-cols-2">
      <div class="space-y-4 text-gris">
        <p>
          SmartResto est un restaurant installé à Goma, au bord du lac Kivu. Notre carte rassemble les
          grillades, les poissons du lac et les plats traditionnels de la région des Grands Lacs.
        </p>
        <p>
          Nous cuisinons des produits frais, achetés auprès de fournisseurs locaux, pour que chaque repas
          garde le goût de la région.
        </p>
      </div>

      <UiCarte grand class="flex min-h-48 items-center justify-center" aria-hidden="true">
        <UiIcone nom="tables" class="h-20 w-20 text-accent/60" />
      </UiCarte>
    </div>

    <h2 class="mt-16 text-3xl font-bold">Nos <span class="text-accent">valeurs</span></h2>
    <ul class="mt-8 grid gap-6 md:grid-cols-3">
      <li v-for="valeur in valeurs" :key="valeur.titre">
        <UiCarte class="h-full">
          <span class="inline-flex rounded-xl bg-accent/10 p-2 text-accent">
            <UiIcone :nom="valeur.icone" />
          </span>
          <h3 class="mt-4 font-semibold">{{ valeur.titre }}</h3>
          <p class="mt-2 text-sm text-gris">{{ valeur.texte }}</p>
        </UiCarte>
      </li>
    </ul>

    <div class="mt-12 text-center">
      <UiBouton to="/reserver" taille="lg">Réserver une table</UiBouton>
    </div>
  </div>
</template>
