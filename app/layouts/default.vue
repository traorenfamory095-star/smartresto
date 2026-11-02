<script setup>
const route = useRoute()
const auth = useAuth()

const menuOuvert = ref(false)
const barre = ref(null)

// utilisateur peut être une ref ou un objet simple : unref gère les deux cas
const utilisateur = computed(() => unref(auth.utilisateur) ?? null)

// Une page peut imposer son titre avec definePageMeta({ titre, sousTitre })
const page = computed(() => {
  const [titre, sousTitre] = titreDeRoute(route.path)
  return { titre: route.meta.titre || titre, sousTitre: route.meta.sousTitre || sousTitre }
})

async function ouvrirMenu() {
  menuOuvert.value = true
  await nextTick()
  barre.value?.focusFermer()
}

function fermerMenu({ rendreLeFocus = true } = {}) {
  if (!menuOuvert.value) return
  menuOuvert.value = false
  if (rendreLeFocus) nextTick(() => document.getElementById('bouton-menu')?.focus())
}

async function deconnecter() {
  try {
    await auth.seDeconnecter()
  } finally {
    await navigateTo('/connexion?espace=administration')
  }
}

watch(() => route.fullPath, () => fermerMenu({ rendreLeFocus: false }))
watch(menuOuvert, (ouvert) => { document.body.style.overflow = ouvert ? 'hidden' : '' })

let ecranLarge
function surEchap(evenement) { if (evenement.key === 'Escape') fermerMenu() }
function surChangementEcran(evenement) { if (evenement.matches) menuOuvert.value = false }

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
  <div class="admin-shell">
    <a href="#contenu" class="skip-link">Aller au contenu</a>

    <LayoutBarreLaterale
      ref="barre"
      :ouvert="menuOuvert"
      @fermer="fermerMenu()"
      @naviguer="fermerMenu({ rendreLeFocus: false })"
    />

    <section class="admin-main" :inert="menuOuvert || undefined">
      <LayoutEnTeteAdmin
        :titre="page.titre"
        :sous-titre="page.sousTitre"
        :utilisateur="utilisateur"
        @ouvrir-menu="ouvrirMenu"
        @deconnexion="deconnecter"
      />
      <main id="contenu" class="admin-content" tabindex="-1">
        <slot />
      </main>
    </section>
  </div>
</template>

<style scoped>
.admin-shell { min-height: 100vh; display: grid; grid-template-columns: 245px 1fr; background: #0d0d0d; }
.admin-main { min-width: 0; }
.admin-content { padding: 30px 34px 70px; max-width: 1500px; margin: auto; outline: none; }

@media (max-width: 900px) {
  .admin-shell { display: block; }
  .admin-content { padding: 20px 16px 50px; }
}
@media print {
  .admin-shell { display: block; background: #fff; }
  .admin-content { padding: 0; max-width: none; }
}
</style>