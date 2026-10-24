<script setup>
// Affiche les messages de useNotifier(). Placé une seule fois, dans app.vue.
const { notifications, retirer } = useNotifier()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
  >
    <TransitionGroup name="notif">
      <div
        v-for="n in notifications"
        :key="n.id"
        :role="n.type === 'erreur' ? 'alert' : 'status'"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-carte-solide px-4 py-3 shadow-lg"
        :class="n.type === 'erreur' ? 'border-erreur/60' : 'border-succes/60'"
      >
        <UiIcone
          :nom="n.type === 'erreur' ? 'alerte' : 'coche'"
          :class="n.type === 'erreur' ? 'text-erreur' : 'text-succes'"
        />
        <p class="flex-1 text-sm">{{ n.message }}</p>
        <button
          type="button"
          class="rounded-md p-0.5 text-gris hover:text-texte"
          aria-label="Fermer le message"
          @click="retirer(n.id)"
        >
          <UiIcone nom="fermer" class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notif-enter-active,
.notif-leave-active {
  transition: all 0.25s ease;
}
.notif-enter-from,
.notif-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
