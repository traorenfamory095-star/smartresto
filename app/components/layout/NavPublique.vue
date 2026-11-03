<script setup>
const route = useRoute()
const router = useRouter()
const ouvert = ref(false)

// On n'affiche que les liens vers des pages qui existent déjà (pas de 404)
const existe = (href) => router.resolve(href).matched.length > 0
const liens = computed(() => LIENS_PUBLICS.filter((lien) => lien.href === '/' || existe(lien.href)))
const avecReservation = computed(() => existe('/reserver'))

function fermer() { ouvert.value = false }
watch(() => route.fullPath, fermer)
watch(ouvert, (valeur) => { document.body.style.overflow = valeur ? 'hidden' : '' })

let ecranLarge
function surEchap(evenement) { if (evenement.key === 'Escape') fermer() }
function surChangementEcran(evenement) { if (evenement.matches) fermer() }

onMounted(() => {
  document.addEventListener('keydown', surEchap)
  ecranLarge = window.matchMedia('(min-width: 901px)')
  ecranLarge.addEventListener('change', surChangementEcran)
})
onUnmounted(() => {
  document.removeEventListener('keydown', surEchap)
  ecranLarge?.removeEventListener('change', surChangementEcran)
  document.body.style.overflow = ''
})
</script>

<template>
  <header class="public-nav">
    <NuxtLink to="/" class="brand">Smart<span>Resto</span></NuxtLink>

    <nav id="menu-public" :class="{ open: ouvert }" aria-label="Navigation principale">
      <NuxtLink
        v-for="lien in liens"
        :key="lien.href"
        :to="lien.href"
        :class="{ active: lienActif(route.path, lien.href) }"
        :aria-current="lienActif(route.path, lien.href) ? 'page' : undefined"
      >
        {{ lien.libelle }}
      </NuxtLink>
      <NuxtLink to="/connexion" class="mobile-login">Connexion</NuxtLink>
      <NuxtLink v-if="avecReservation" to="/reserver" class="mobile-login">Réservation</NuxtLink>
    </nav>

    <div class="nav-actions">
      <NuxtLink to="/connexion">Connexion</NuxtLink>
      <template v-if="avecReservation">
        <span aria-hidden="true">/</span>
        <NuxtLink to="/reserver" :class="{ active: lienActif(route.path, '/reserver') }">Réservation</NuxtLink>
      </template>
    </div>

    <button
      type="button"
      class="menu-toggle"
      :aria-label="ouvert ? 'Fermer le menu' : 'Ouvrir le menu'"
      :aria-expanded="ouvert"
      aria-controls="menu-public"
      @click="ouvert = !ouvert"
    >
      <LayoutIconeMenu :nom="ouvert ? 'close' : 'menu'" />
    </button>
  </header>
</template>

<style scoped>
.public-nav {
  height: 78px; max-width: 1344px; margin: auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 26px; position: relative; z-index: 15;
}
.public-nav nav {
  display: flex; align-items: center; gap: 8px;
  background: #111; border: 1px solid rgba(255, 255, 255, .07);
  padding: 5px; border-radius: 99px;
}
.public-nav nav a { padding: 9px 18px; border-radius: 99px; color: var(--gray); font-size: 14px; transition: .2s; }
.public-nav nav a:hover { color: #fff; }
.public-nav nav a.active { background: #fff; color: var(--black); font-weight: 600; }
.nav-actions { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
.nav-actions a:first-child { color: var(--orange); }
.nav-actions a.active { color: var(--orange-light); text-decoration: underline; text-underline-offset: 5px; }
.nav-actions span { color: #666; }
.menu-toggle, .mobile-login { display: none; }

@media (max-width: 900px) {
  .public-nav { height: 68px; padding: 0 20px; }
  .public-nav nav {
    position: fixed; inset: 0; background: #0a0a0a; border: 0; border-radius: 0;
    z-index: 20; display: none; flex-direction: column; justify-content: center; gap: 15px;
  }
  .public-nav nav.open { display: flex; }
  .public-nav nav a { font-size: 24px; }
  .public-nav .brand, .menu-toggle { position: relative; z-index: 21; }
  .menu-toggle {
    display: grid; place-items: center; background: #171717; border: 1px solid var(--line);
    color: #fff; width: 44px; height: 44px; border-radius: 12px;
  }
  .nav-actions { display: none; }
  .mobile-login { display: block; }
}
</style>