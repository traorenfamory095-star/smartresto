<script setup>
useHead({ title: 'Catégories' })

const { categories, pending, error, refresh } = await useCategories()
</script>

<template>
  <section>
    <div>
      <h1 class="text-3xl font-bold">Catégories</h1>
      <p class="mt-2 text-gris">Découvrez les différentes catégories du restaurant.</p>
    </div>

    <div class="mt-8">
      <UiEtat
        :chargement="pending"
        :erreur="error"
        :vide="!categories?.length"
        message-vide="Aucune catégorie n’est disponible pour le moment."
        @reessayer="refresh"
      >
        <ul class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <li v-for="categorie in categories" :key="categorie.id">
            <CategoriesCategorieCarte :categorie="categorie" />
          </li>
        </ul>
      </UiEtat>
    </div>
  </section>
</template>
