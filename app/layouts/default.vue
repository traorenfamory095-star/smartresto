<script setup>
// Layout ADMIN : barre latérale + en-tête + contenu. Propriétaire : Traoré (socle).
// MENU_ADMIN, trouverLien() et libelleRole() viennent de utils/ (auto-importés).
// Les liens ne sont jamais écrits ici : ajoutez-les dans utils/navigation.js (Issue à Traoré).
const route = useRoute()
const { utilisateur, peut, seDeconnecter } = useAuth()
const menuOuvert = ref(false)

// Le menu n'affiche que les liens autorisés pour le rôle connecté.
const liens = computed(() => MENU_ADMIN.filter((lien) => peut(lien.chemin)))
const titre = computed(() => trouverLien(route.path)?.libelle ?? 'SmartResto')

function estActif(chemin) {
  return route.path === chemin || route.path.startsWith(`${chemin}/`)
}

// Sur téléphone, le menu se referme quand on change de page.
watch(
  () => route.fullPath,
  () => {
    menuOuvert.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-fond text-texte lg:flex">
    <a
      href="#contenu"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-medium focus:text-fond"
    >
      Aller au contenu
    </a>

    <!-- Voile derrière le menu sur téléphone -->
    <div
      v-if="menuOuvert"
      class="fixed inset-0 z-30 bg-black/70 lg:hidden"
      aria-hidden="true"
      @click="menuOuvert = false"
    />

    <aside
      id="menu-lateral"
      class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-bordure bg-fond transition-[transform,visibility] duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
      :class="menuOuvert ? 'translate-x-0' : 'invisible -translate-x-full lg:visible'"
    >
      <div class="flex h-16 shrink-0 items-center justify-between px-5">
        <NuxtLink to="/tableau-de-bord" class="text-xl font-bold text-accent">SmartResto</NuxtLink>
        <button
          type="button"
          class="rounded-lg p-2 text-gris hover:text-texte lg:hidden"
          aria-label="Fermer le menu"
          @click="menuOuvert = false"
        >
          <UiIcone nom="fermer" />
        </button>
      </div>

      <nav aria-label="Navigation principale" class="flex-1 overflow-y-auto px-3 pb-4">
        <ul class="space-y-1">
          <li v-for="lien in liens" :key="lien.chemin">
            <NuxtLink
              :to="lien.chemin"
              :aria-current="estActif(lien.chemin) ? 'page' : undefined"
              class="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors"
              :class="
                estActif(lien.chemin)
                  ? 'bg-degrade-orange text-fond'
                  : 'text-gris hover:bg-white/5 hover:text-texte'
              "
            >
              <UiIcone :nom="lien.icone" />
              {{ lien.libelle }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-bordure bg-fond/90 px-4 backdrop-blur sm:px-6"
      >
        <button
          type="button"
          class="rounded-lg p-2 text-gris hover:text-texte lg:hidden"
          aria-label="Ouvrir le menu"
          aria-controls="menu-lateral"
          :aria-expanded="menuOuvert"
          @click="menuOuvert = true"
        >
          <UiIcone nom="menu" />
        </button>

        <p class="flex-1 truncate text-sm font-medium text-gris">{{ titre }}</p>

        <div v-if="utilisateur" class="hidden text-right sm:block">
          <p class="text-sm font-medium">{{ utilisateur.nom }}</p>
          <p class="text-xs text-gris">{{ libelleRole(utilisateur.role) }}</p>
        </div>

        <button
          type="button"
          class="flex min-h-11 items-center gap-2 rounded-xl border border-bordure px-3 text-sm text-gris transition-colors hover:border-accent hover:text-texte"
          @click="seDeconnecter"
        >
          <UiIcone nom="deconnexion" />
          <span class="hidden sm:inline">Déconnexion</span>
          <span class="sr-only sm:hidden">Déconnexion</span>
        </button>
      </header>

      <main id="contenu" tabindex="-1" class="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
