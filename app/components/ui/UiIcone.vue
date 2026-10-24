<script setup>
// Icônes en SVG intégré (pas de bibliothèque : une installation demanderait l'accord du Tech Leader).
// Utilisation : <UiIcone nom="plats" /> ; la taille et la couleur suivent le texte (class="h-6 w-6 text-accent").
const props = defineProps({
  nom: { type: String, required: true },
})

const ICONES = {
  tableau: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  carte: ['M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z', 'M5 17a3 3 0 0 1 3-3h11'],
  plats: ['M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0', 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0'],
  categories: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
  tables: ['M4 9h16', 'M6 9v10', 'M18 9v10', 'M3 9l1.5-4h15L21 9'],
  reservations: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  commandes: ['M8 4h8v3H8z', 'M6 5H5v16h14V5h-1', 'M9 12h6', 'M9 16h6'],
  cuisine: ['M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z', 'M2 11h20', 'M9 7a3 3 0 0 1 6 0'],
  stock: ['M12 3l8 4v10l-8 4-8-4V7z', 'M4 7l8 4 8-4', 'M12 11v10'],
  fournisseurs: ['M2 6h11v10H2z', 'M13 10h5l3 3v3h-8z', 'M6 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M15 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0'],
  approvisionnements: ['M12 3v11', 'M7 10l5 5 5-5', 'M4 20h16'],
  factures: ['M6 3h8l4 4v14H6z', 'M14 3v4h4', 'M9 12h6', 'M9 16h6'],
  rapports: ['M5 20V11', 'M12 20V4', 'M19 20v-6', 'M3 20h18'],
  personnel: ['M9 8a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M5 20a7 7 0 0 1 14 0'],
  deconnexion: ['M10 4H5v16h5', 'M15 8l4 4-4 4', 'M19 12H9'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  fermer: ['M6 6l12 12', 'M18 6L6 18'],
  plus: ['M12 5v14', 'M5 12h14'],
  coche: ['M5 12l5 5 10-10'],
  alerte: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17h.01'],
}

const chemins = computed(() => ICONES[props.nom] ?? [])
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="h-5 w-5 shrink-0"
    aria-hidden="true"
  >
    <path v-for="(d, i) in chemins" :key="i" :d="d" />
  </svg>
</template>
