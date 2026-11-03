<template>
  <div class="site-shell">
    <a href="#contenu-public" class="skip-link">Aller au contenu</a>
    <LayoutNavPublique />
    <div id="contenu-public" tabindex="-1" class="contenu-public">
      <slot />
    </div>
    <LayoutPiedDePage />
  </div>
</template>

<style scoped>
.contenu-public { outline: none; }
</style>