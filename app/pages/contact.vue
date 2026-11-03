<script setup>
// Page « Contact ». Propriétaire : Traoré (site public).
// DÉMONSTRATION : l'API n'a pas de ressource « messages ». Le formulaire est validé
// (utils/contact.js) mais le message n'est transmis à personne, et la page le dit clairement.
definePageMeta({ layout: 'public' })
useHead({
  title: 'Contact | SmartResto',
  meta: [{ name: 'description', content: 'Une question, une demande particulière ou un événement à organiser ? Écrivez à SmartResto.' }],
})

const SUJET_PAR_DEFAUT = SUJETS_CONTACT[0].valeur
const vide = () => ({ nom: '', email: '', sujet: SUJET_PAR_DEFAUT, message: '' })

const formulaire = reactive(vide())
const erreurs = reactive({ nom: '', email: '', sujet: '', message: '' })
const tentative = ref(false) // les erreurs ne s'affichent qu'après un premier clic sur « Envoyer »
const envoye = ref(false)

// Après un premier essai, les erreurs se corrigent en direct pendant la saisie.
watch(formulaire, () => {
  if (envoye.value && (formulaire.nom || formulaire.email || formulaire.message)) envoye.value = false
  if (tentative.value) Object.assign(erreurs, validerContact(formulaire))
})

function envoyer() {
  tentative.value = true
  Object.assign(erreurs, validerContact(formulaire))
  if (!contactValide(erreurs)) {
    envoye.value = false
    return
  }
  // Démonstration : on n'envoie rien. Un vrai envoi passerait ici par une ressource « messages ».
  tentative.value = false
  Object.assign(formulaire, vide())
  Object.assign(erreurs, { nom: '', email: '', sujet: '', message: '' })
  envoye.value = true
}

const nbCaracteres = computed(() => formulaire.message.length)
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
    <header>
      <p class="text-sm font-bold uppercase tracking-[0.2em] text-acc">Parlons de votre prochaine visite</p>
      <h1 class="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Contactez-<span class="text-acc">nous</span></h1>
      <p class="mt-4 max-w-xl text-mut">
        Une question, une demande particulière ou un événement à organiser ? Écrivez-nous.
      </p>
    </header>

    <div class="mt-10 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
      <UiCarte grand>
        <div class="flex items-start gap-4">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-degrade text-sm font-extrabold text-on-pri" aria-hidden="true">01</span>
          <div>
            <h2 class="text-xl font-bold text-head">Écrivez-nous</h2>
            <p class="mt-1 text-sm text-mut">Les champs marqués d’une étoile sont obligatoires.</p>
          </div>
        </div>

        <form novalidate class="mt-6 space-y-5" @submit.prevent="envoyer">
          <div class="grid gap-5 sm:grid-cols-2">
            <UiChamp
              v-model="formulaire.nom"
              label="Nom complet"
              requis
              autocomplete="name"
              placeholder="Ex. Aline Mbuyi"
              :erreur="erreurs.nom"
            />
            <UiChamp
              v-model="formulaire.email"
              label="Adresse e-mail"
              type="email"
              requis
              autocomplete="email"
              placeholder="aline@exemple.com"
              :erreur="erreurs.email"
            />
          </div>

          <UiChamp v-model="formulaire.sujet" label="Sujet" as="select" requis :erreur="erreurs.sujet">
            <option v-for="s in SUJETS_CONTACT" :key="s.valeur" :value="s.valeur">{{ s.libelle }}</option>
          </UiChamp>

          <UiChamp
            v-model="formulaire.message"
            label="Votre message"
            as="textarea"
            rows="6"
            requis
            placeholder="Dites-nous comment nous pouvons vous aider…"
            :aide="`${nbCaracteres} caractères (entre ${MESSAGE_MIN} et ${MESSAGE_MAX})`"
            :erreur="erreurs.message"
          />

          <p
            v-if="tentative && !contactValide(erreurs)"
            class="rounded-xl border border-err/50 px-4 py-3 text-sm text-err"
          >
            Vérifiez les champs indiqués avant d’envoyer votre message.
          </p>

          <UiBouton type="submit" class="w-full sm:w-auto">Envoyer le message</UiBouton>

          <!-- Toujours présent dans la page : un lecteur d'écran annonce son contenu quand il change -->
          <div role="status" aria-live="polite">
            <p v-if="envoye" class="rounded-xl border border-ok/50 px-4 py-3 text-sm text-ok">
              Merci, votre message est bien rempli. Ce site est une démonstration : il n’est transmis à personne.
            </p>
          </div>
        </form>
      </UiCarte>

      <div class="space-y-4">
        <PublicInfoContact icone="lieu" libelle="Notre adresse" :valeur="RESTAURANT.adresse" />
        <PublicInfoContact
          icone="telephone"
          libelle="Téléphone"
          :valeur="RESTAURANT.telephone"
          :lien="lienTelephone(RESTAURANT.telephone)"
        />
        <PublicInfoContact
          icone="courriel"
          libelle="E-mail"
          :valeur="RESTAURANT.email"
          :lien="`mailto:${RESTAURANT.email}`"
        />
        <PublicInfoContact icone="horloge" libelle="Horaires" :valeur="RESTAURANT.horaires" />

        <!-- Schéma décoratif (ce n'est pas une vraie carte) -->
        <div
          role="img"
          aria-label="Schéma de l'emplacement de SmartResto à Goma, au bord du lac Kivu"
          class="relative h-60 overflow-hidden rounded-carte border border-line bg-soft"
        >
          <svg viewBox="0 0 400 240" preserveAspectRatio="none" class="absolute inset-0 h-full w-full" aria-hidden="true">
            <path d="M250 240 C270 170 330 140 400 130 L400 240 Z" fill="currentColor" class="text-cy/20" />
            <g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" class="text-line">
              <path d="M-10 70 C90 60 160 110 260 95 S380 40 410 50" />
              <path d="M110 -10 C120 70 150 150 120 250" />
              <path d="M-10 175 C80 165 180 190 270 160" />
            </g>
          </svg>

          <div class="absolute left-[45%] top-[42%] flex max-w-[88%] -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl border border-line bg-card px-3 py-2 shadow-lg">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-degrade text-on-pri">
              <UiIcone nom="lieu" class="h-5 w-5" />
            </span>
            <div class="min-w-0">
              <p class="text-sm font-bold text-head">SmartResto</p>
              <p class="text-xs text-mut">{{ RESTAURANT.adresse }}</p>
            </div>
          </div>
          <span class="absolute bottom-3 right-4 text-xs font-semibold uppercase tracking-widest text-acc">Lac Kivu</span>
        </div>

        <UiCarte>
          <h2 class="font-semibold text-head">Réserver une table</h2>
          <p class="mt-1 text-sm text-mut">
            Pour réserver, utilisez directement le
            <NuxtLink to="/reserver" class="font-semibold text-head underline underline-offset-4">formulaire de réservation</NuxtLink>.
          </p>
        </UiCarte>
      </div>
    </div>
  </div>
</template>