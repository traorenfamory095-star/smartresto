<script setup>
// Page « Contact ». Propriétaire : Traoré (site public).
// DÉMONSTRATION : il n'y a pas de ressource « messages » dans l'API, donc le formulaire valide
// les champs mais n'envoie rien. La page le dit clairement à l'utilisateur.
definePageMeta({ layout: 'public' })
useHead({ title: 'Contact' })

const notifier = useNotifier()

const formulaire = reactive({ nom: '', email: '', sujet: '', message: '' })
const erreurs = reactive({ nom: '', email: '', sujet: '', message: '' })

function valider() {
  erreurs.nom = formulaire.nom.trim() ? '' : 'Indiquez votre nom.'
  erreurs.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulaire.email) ? '' : 'Indiquez une adresse e-mail valide.'
  erreurs.sujet = formulaire.sujet.trim() ? '' : 'Indiquez un sujet.'
  erreurs.message = formulaire.message.trim().length >= 10 ? '' : 'Votre message doit contenir au moins 10 caractères.'
  return !Object.values(erreurs).some(Boolean)
}

function envoyer() {
  if (!valider()) return
  notifier.succes('Merci ! Votre message a été enregistré (démonstration : rien n’est envoyé).')
  Object.assign(formulaire, { nom: '', email: '', sujet: '', message: '' })
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
    <h1 class="text-4xl font-bold">Contactez-<span class="text-accent">nous</span></h1>

    <div class="mt-10 grid gap-8 lg:grid-cols-2">
      <UiCarte grand>
        <form novalidate class="space-y-5" @submit.prevent="envoyer">
          <UiChamp v-model="formulaire.nom" label="Nom" requis autocomplete="name" :erreur="erreurs.nom" />
          <UiChamp
            v-model="formulaire.email"
            label="E-mail"
            type="email"
            requis
            autocomplete="email"
            :erreur="erreurs.email"
          />
          <UiChamp v-model="formulaire.sujet" label="Sujet" requis :erreur="erreurs.sujet" />
          <UiChamp
            v-model="formulaire.message"
            label="Message"
            as="textarea"
            rows="5"
            requis
            :erreur="erreurs.message"
          />
          <UiBouton type="submit" class="w-full">Envoyer</UiBouton>
          <p class="text-center text-xs text-gris">Démonstration : le message n’est pas réellement envoyé.</p>
        </form>
      </UiCarte>

      <div class="space-y-4">
        <UiCarte>
          <h2 class="font-semibold">Adresse</h2>
          <p class="mt-1 text-sm text-gris">Goma, République démocratique du Congo</p>
        </UiCarte>
        <UiCarte>
          <h2 class="font-semibold">Réservations</h2>
          <p class="mt-1 text-sm text-gris">
            Pour réserver une table, utilisez le
            <NuxtLink to="/reserver" class="text-accent underline">formulaire de réservation</NuxtLink>.
          </p>
        </UiCarte>
      </div>
    </div>
  </div>
</template>
