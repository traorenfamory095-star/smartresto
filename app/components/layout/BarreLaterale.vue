<script setup>
defineProps({ ouvert: { type: Boolean, default: false } })
const emit = defineEmits(['fermer', 'naviguer'])

const route = useRoute()
const { peut } = useAuth()

// Un lien est affiché s'il n'a pas de permission requise, ou si peut(...) l'autorise.
// Si ton peut(...) attend '/plats' au lieu de 'plats', remplace `lien.nom` par `lien.href` ci-dessous.
const liens = computed(() => LIENS_MENU_ADMIN.filter((lien) => !lien.nom || peut(lien.nom)))

const boutonFermer = ref(null)
defineExpose({ focusFermer: () => boutonFermer.value?.focus() })
</script>

<template>
  <aside id="barre-laterale" class="aside" :class="{ open: ouvert }">
    <div class="aside-brand">
      <NuxtLink to="/" class="brand" @click="emit('naviguer')">Smart<span>Resto</span></NuxtLink>
      <button ref="boutonFermer" type="button" class="fermer" aria-label="Fermer le menu" @click="emit('fermer')">
        <LayoutIconeMenu nom="close" />
      </button>
    </div>

    <nav aria-label="Navigation d'administration">
      <NuxtLink
        v-for="lien in liens"
        :key="lien.href"
        :to="lien.href"
        class="lien"
        :class="{ active: lienActif(route.path, lien.href) }"
        :aria-current="lienActif(route.path, lien.href) ? 'page' : undefined"
        @click="emit('naviguer')"
      >
        <LayoutIconeMenu :nom="lien.icone" />
        <span>{{ lien.libelle }}</span>
      </NuxtLink>

      <a href="/carte" target="_blank" rel="noopener noreferrer" class="lien">
        <LayoutIconeMenu nom="menu" />
        <span>Aperçu de la carte</span>
        <span class="sr-only">(s'ouvre dans un nouvel onglet)</span>
      </a>
    </nav>

    <div class="aide">
      <span aria-hidden="true">SR</span>
      <b>Besoin d'aide ?</b>
      <small>Contactez le support</small>
    </div>
  </aside>
</template>

<style scoped>
.aside {
  background: var(--black);
  border-right: 1px solid rgba(255, 255, 255, .08);
  padding: 26px 17px;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  z-index: 30;
  overflow-y: auto;
}
.aside-brand { padding: 0 12px 25px; display: flex; justify-content: space-between; align-items: center; }
.fermer { display: none; }
nav { display: flex; flex-direction: column; gap: 3px; margin-bottom: 20px; }
.lien {
  display: flex; align-items: center; gap: 12px;
  min-height: 43px; padding: 0 13px; border-radius: 12px;
  color: #858585; font-size: 13px; transition: .2s;
}
.lien:hover { background: #171717; color: #fff; }
.lien.active {
  background: linear-gradient(135deg, #ff8a00, var(--orange-dark));
  color: #fff; font-weight: 600; box-shadow: 0 8px 20px rgba(249, 115, 22, .18);
}
.aide {
  margin-top: auto; background: #151515; border: 1px solid var(--line);
  border-radius: 16px; padding: 14px;
  display: grid; grid-template-columns: 35px 1fr; column-gap: 10px;
}
.aide > span {
  grid-row: 1 / 3; width: 35px; height: 35px; display: grid; place-items: center;
  background: rgba(249, 115, 22, .13); color: var(--orange); border-radius: 10px;
  font-size: 11px; font-weight: 700;
}
.aide b { font-size: 12px; }
.aide small { font-size: 11px; color: var(--muted); }

@media (max-width: 900px) {
  .aside {
    position: fixed; inset: 0; width: 100%; height: 100vh;
    transform: translateX(-100%); visibility: hidden;
    transition: transform .3s, visibility 0s .3s;
  }
  .aside.open { transform: none; visibility: visible; transition: transform .3s; }
  .fermer {
    display: grid; place-items: center; width: 42px; height: 42px;
    background: #1b1b1b; border: 1px solid var(--line); color: #fff; border-radius: 10px;
  }
  .lien { min-height: 46px; }
}
@media print { .aside { display: none; } }
</style>