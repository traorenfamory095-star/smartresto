<script setup>
const router = useRouter()
const annee = new Date().getFullYear()

const existe = (href) => router.resolve(href.split('#')[0]).matched.length > 0
const explorer = computed(() => [
  { href: '/', libelle: 'Accueil' },
  { href: '/carte', libelle: 'Notre carte' },
  { href: '/reserver', libelle: 'Réserver' },
].filter((lien) => lien.href === '/' || existe(lien.href)))
const restaurant = computed(() => [
  { href: '/a-propos', libelle: 'Notre histoire' },
  { href: '/a-propos#team', libelle: "L'équipe" },
  { href: '/contact', libelle: 'Contact' },
].filter((lien) => existe(lien.href)))
</script>

<template>
  <footer class="pied">
    <div>
      <NuxtLink to="/" class="brand">Smart<span>Resto</span></NuxtLink>
      <p>La chaleur du Kivu dans chaque assiette.</p>
      <p>Goma, République démocratique du Congo</p>
    </div>

    <div>
      <b>Explorer</b>
      <NuxtLink v-for="lien in explorer" :key="lien.href" :to="lien.href">{{ lien.libelle }}</NuxtLink>
    </div>

    <div v-if="restaurant.length">
      <b>Restaurant</b>
      <NuxtLink v-for="lien in restaurant" :key="lien.href" :to="lien.href">{{ lien.libelle }}</NuxtLink>
    </div>

    <small>
      © {{ annee }} SmartResto. Tous droits réservés.
      ·
      <NuxtLink to="/connexion?espace=administration" class="acces-personnel">Accès personnel</NuxtLink>
    </small>
  </footer>
</template>

<style scoped>
.pied {
  max-width: 1240px; margin: 70px auto 0; border-top: 1px solid var(--line);
  padding: 65px 0 35px; display: grid; grid-template-columns: 1.6fr .7fr .7fr; gap: 50px; color: var(--gray);
}
.pied > div { display: flex; flex-direction: column; gap: 13px; }
.pied b { color: #fff; font-size: 13px; margin-bottom: 6px; }
.pied a:not(.brand) { font-size: 13px; transition: .2s; }
.pied a:not(.brand):hover { color: #fff; }
.pied p { margin: 0; font-size: 13px; }
.pied small {
  grid-column: 1 / -1; border-top: 1px solid var(--line); padding-top: 25px; color: #8a8a8a; font-size: 12px;
}
.acces-personnel { color: #8a8a8a; transition: .2s; }
.acces-personnel:hover { color: var(--orange); }

@media (max-width: 900px) {
  .pied { margin: 30px 20px 0; padding: 50px 0 25px; grid-template-columns: 1fr 1fr; gap: 35px; }
  .pied > div:first-child { grid-column: 1 / -1; }
}
</style>