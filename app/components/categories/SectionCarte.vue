<script setup>
defineProps({
  categorie: { type: Object, required: true },
  plats: { type: Array, required: true },
  ajoutFeedback: { type: Object, default: null },
})

const emit = defineEmits(['ajouter', 'image-error'])

function relayerErreurImage(event, plat, categorie) {
  emit('image-error', event, plat, categorie)
}
</script>

<template>
  <section class="menu-section">
    <h2 class="section-title">
      <span class="corner" aria-hidden="true">⌜</span>
      {{ categorie.nom }}
      <span class="corner" aria-hidden="true">⌟</span>
    </h2>

    <ul class="dish-grid">
      <li v-for="plat in plats" :key="plat.id">
        <CategoriesCartePlat
          :plat="plat"
          :categorie="categorie"
          :ajout-feedback="ajoutFeedback"
          @ajouter="emit('ajouter', $event)"
          @image-error="relayerErreurImage"
        />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.menu-section + .menu-section {
  margin-top: 80px;
}

.section-title {
  display: flex;
  align-items: center;
  margin: 0 0 35px;
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -1.7px;
  line-height: 1.2;
}

.corner {
  margin: 0 14px;
  color: #f97316;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 1023px) {
  .dish-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 899px) {
  .dish-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .section-title {
    font-size: 30px;
  }

  .corner {
    margin: 0 9px;
  }
}
</style>
