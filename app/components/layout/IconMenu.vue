<script setup>
const props = defineProps({
  nom: { type: String, required: true },
  taille: { type: Number, default: 20 },
})

const TRACES = {
  home: '<path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-7h6v7" />',
  menu: '<path d="M4 7h16M4 12h16M4 17h16" />',
  dish: '<path d="M4 15h16M6 15a6 6 0 0 1 12 0M12 7V5M3 19h18" />',
  category: '<rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" />',
  table: '<path d="M4 9h16v7H4zM7 16v4M17 16v4M8 9V5h8v4" />',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" />',
  order: '<path d="M6 3h12l2 5-2 13H6L4 8zM4 8h16M9 12v5M15 12v5" />',
  chef: '<path d="M6 10a4 4 0 0 1 2-7 4 4 0 0 1 4 2 4 4 0 0 1 6 5v3H6zM8 13v8M16 13v8M8 18h8" />',
  stock: '<path d="m4 7 8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10" />',
  truck: '<path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" />',
  supply: '<path d="M12 3v14M7 12l5 5 5-5M5 21h14" />',
  invoice: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" />',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />',
  users: '<circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M17 15a6 6 0 0 1 5 6" />',
  plus: '<path d="M12 5v14M5 12h14" />',
  cart: '<path d="M3 4h2l2.5 11h10L21 7H6" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" />',
  logout: '<path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10" />',
  close: '<path d="m6 6 12 12M18 6 6 18" />',
  check: '<path d="m5 12 5 5L20 7" />',
}

const trace = computed(() => TRACES[props.nom] ?? '')
</script>

<template>
  <svg
    :width="taille"
    :height="taille"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="trace"
  />
</template>