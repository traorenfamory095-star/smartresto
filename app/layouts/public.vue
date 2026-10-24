<script setup>
// Layout PUBLIC : barre du haut + pied de page. Propriétaire : Traoré (socle).
// Une page publique l'active avec : definePageMeta({ layout: 'public' })
// Les liens viennent de utils/navigation.js (MENU_PUBLIC).
const route = useRoute()
const menuOuvert = ref(false)
const annee = new Date().getFullYear()

function estActif(chemin) {
  return chemin === '/' ? route.path === '/' : route.path === chemin || route.path.startsWith(`${chemin}/`)
}

watch(
  () => route.fullPath,
  () => {
    menuOuvert.value = false
  },
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-fond text-texte">
    <a
      href="#contenu"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-medium focus:text-fond"
    >
      Aller au contenu
    </a>

    <header class="sticky top-0 z-30 border-b border-bordure bg-fond/90 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <NuxtLink to="/" class="text-xl font-bold text-accent">SmartResto</NuxtLink>

        <nav aria-label="Navigation principale" class="hidden flex-1 justify-center md:flex">
          <ul class="flex items-center gap-1">
            <li v-for="lien in MENU_PUBLIC" :key="lien.chemin">
              <NuxtLink
                :to="lien.chemin"
                :aria-current="estActif(lien.chemin) ? 'page' : undefined"
                class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                :class="estActif(lien.chemin) ? 'bg-texte text-fond' : 'text-gris hover:text-texte'"
              >
                {{ lien.libelle }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div class="ml-auto hidden items-center gap-4 md:flex">
          <NuxtLink to="/connexion" class="text-sm font-medium text-accent hover:text-accent-clair">
            Connexion
          </NuxtLink>
          <UiBouton to="/reserver" taille="sm">Réserver</UiBouton>
        </div>

        <button
          type="button"
          class="ml-auto rounded-lg p-2 text-gris hover:text-texte md:hidden"
          :aria-label="menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'"
          aria-controls="menu-public"
          :aria-expanded="menuOuvert"
          @click="menuOuvert = !menuOuvert"
        >
          <UiIcone :nom="menuOuvert ? 'fermer' : 'menu'" class="h-6 w-6" />
        </button>
      </div>

      <!-- Menu téléphone -->
      <div v-show="menuOuvert" id="menu-public" class="border-t border-bordure md:hidden">
        <nav aria-label="Navigation principale (téléphone)" class="mx-auto max-w-6xl px-4 py-3">
          <ul class="space-y-1">
            <li v-for="lien in MENU_PUBLIC" :key="lien.chemin">
              <NuxtLink
                :to="lien.chemin"
                :aria-current="estActif(lien.chemin) ? 'page' : undefined"
                class="flex min-h-11 items-center rounded-xl px-3 text-base font-medium"
                :class="estActif(lien.chemin) ? 'bg-texte text-fond' : 'text-gris hover:text-texte'"
              >
                {{ lien.libelle }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/connexion" class="flex min-h-11 items-center rounded-xl px-3 text-base font-medium text-accent">
                Connexion
              </NuxtLink>
            </li>
            <li class="pt-2">
              <UiBouton to="/reserver" class="w-full">Réserver une table</UiBouton>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main id="contenu" tabindex="-1" class="flex-1 outline-none">
      <slot />
    </main>

    <footer class="border-t border-bordure bg-section">
      <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p class="text-xl font-bold text-accent">SmartResto</p>
          <p class="mt-3 max-w-xs text-sm text-gris">
            La cuisine des Grands Lacs, du lac Kivu à votre table.
          </p>
          <p class="mt-3 text-sm text-gris">Goma, RDC</p>
        </div>

        <nav aria-label="Liens rapides">
          <p class="text-sm font-semibold">Liens rapides</p>
          <ul class="mt-3 space-y-2 text-sm text-gris">
            <li v-for="lien in MENU_PUBLIC" :key="lien.chemin">
              <NuxtLink :to="lien.chemin" class="hover:text-texte">{{ lien.libelle }}</NuxtLink>
            </li>
            <li><NuxtLink to="/reserver" class="hover:text-texte">Réserver une table</NuxtLink></li>
          </ul>
        </nav>

        <div>
          <p class="text-sm font-semibold">Équipe</p>
          <ul class="mt-3 space-y-2 text-sm text-gris">
            <li>
              <NuxtLink to="/connexion?espace=administration" class="hover:text-texte">Accès personnel</NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <p class="border-t border-bordure px-4 py-4 text-center text-xs text-gris-doux">
        © {{ annee }} SmartResto. Tous droits réservés.
      </p>
    </footer>
  </div>
</template>
