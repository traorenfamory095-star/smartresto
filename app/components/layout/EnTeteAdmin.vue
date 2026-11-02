<script setup>
const props = defineProps({
  titre: { type: String, default: '' },
  sousTitre: { type: String, default: '' },
  utilisateur: { type: Object, default: null },
})
defineEmits(['ouvrir-menu', 'deconnexion'])

const nom = computed(() => props.utilisateur?.nom || 'Invité')
const role = computed(() => libelleRole(props.utilisateur?.role))
</script>

<template>
  <header class="entete">
    <button
      id="bouton-menu"
      type="button"
      class="menu"
      aria-label="Ouvrir le menu"
      aria-controls="barre-laterale"
      @click="$emit('ouvrir-menu')"
    >
      <LayoutIconeMenu nom="menu" />
    </button>

    <div class="titres">
      <small class="fil">Administration / {{ titre }}</small>
      <h1>{{ titre }}</h1>
      <p class="sous">{{ sousTitre }}</p>
    </div>

    <div class="utilisateur">
      <span class="pastille" aria-hidden="true">{{ initiales(nom) }}</span>
      <div class="identite">
        <b>{{ nom }}</b>
        <small>{{ role }}</small>
      </div>
      <button type="button" class="btn btn-ghost deconnexion" aria-label="Déconnexion" @click="$emit('deconnexion')">
        <LayoutIconeMenu nom="logout" :taille="17" />
        <span>Déconnexion</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.entete {
  height: 106px; border-bottom: 1px solid rgba(255, 255, 255, .07);
  display: flex; align-items: center; padding: 0 34px;
  background: rgba(10, 10, 10, .84); backdrop-filter: blur(16px);
  position: sticky; top: 0; z-index: 10;
}
.menu { display: none; }
.titres { margin-right: auto; min-width: 0; }
.titres h1 { font-size: 22px; letter-spacing: -.7px; margin: 4px 0; }
.fil, .sous { margin: 0; color: var(--muted); font-size: 11px; display: block; }
.utilisateur { display: flex; align-items: center; gap: 11px; }
.pastille {
  width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center;
  background: rgba(249, 115, 22, .15); color: var(--orange); font-weight: 700; font-size: 11px;
}
.identite { display: flex; flex-direction: column; }
.identite b { font-size: 12px; }
.identite small { margin-top: 3px; color: var(--muted); font-size: 11px; }
.deconnexion { margin-left: 12px; min-height: 38px; padding: 0 12px; font-size: 12px; }

@media (max-width: 900px) {
  .entete { height: 92px; padding: 0 18px; }
  .menu {
    display: grid; place-items: center; width: 42px; height: 42px;
    background: #181818; border: 1px solid var(--line); color: #fff;
    border-radius: 11px; margin-right: 13px;
  }
  .sous, .identite, .deconnexion span { display: none; }
  .deconnexion { width: 42px; min-height: 42px; padding: 0; margin-left: 4px; }
}
@media (max-width: 430px) {
  .titres h1 { font-size: 19px; }
  .fil { display: none; }
}
@media print { .entete { display: none; } }
</style>