<script setup>
const api = useApi()
const router = useRouter()
const { succes, erreur } = useNotifier()

const ROLES = [
  { valeur: 'admin', libelle: 'Admin' },
  { valeur: 'gerant', libelle: 'Gérant' },
  { valeur: 'serveur', libelle: 'Serveur' },
  { valeur: 'cuisinier', libelle: 'Cuisinier' },
  { valeur: 'caissier', libelle: 'Caissier' }
]

const form = reactive({ nom: '', email: '', role: 'serveur', motDePasse: '', actif: true })
const envoi = ref(false)
const erreurFormulaire = ref('')

const champ =
  'h-12 w-full min-w-0 rounded-xl border border-white/[0.13] bg-[#0e0e0e] px-3.5 text-sm text-white outline-none transition [color-scheme:dark] placeholder:text-neutral-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'

watch(form, () => { erreurFormulaire.value = '' }, { deep: true })

async function soumettre() {
  if (envoi.value) return
  const nom = form.nom.trim()
  const email = form.email.trim().toLowerCase()

  if (!nom) { erreurFormulaire.value = 'Le nom complet est obligatoire.'; return }
  if (!/^\S+@\S+\.\S+$/.test(email)) { erreurFormulaire.value = 'Saisissez une adresse e-mail valide.'; return }
  if (form.motDePasse.length < 4) { erreurFormulaire.value = 'Le mot de passe doit contenir au moins 4 caractères.'; return }

  envoi.value = true
  try {
    // Un e-mail = un compte
    const existants = await api.lire('/employes')
    if ((Array.isArray(existants) ? existants : []).some(e => e.email.toLowerCase() === email)) {
      erreurFormulaire.value = 'Un employé utilise déjà cette adresse e-mail.'
      return
    }
    await api.creer('/employes', {
      nom,
      email,
      motDePasse: form.motDePasse,
      role: form.role,
      actif: form.actif,
      creeLe: new Date().toISOString().slice(0, 10)
    })
    succes('Employé créé')
    router.push('/personnel')
  } catch (e) {
    erreur(e.message)
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-5">
    <header class="flex flex-wrap items-center gap-x-5 gap-y-3">
      <NuxtLink to="/personnel" class="rounded-md text-xs text-neutral-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
        <span aria-hidden="true">←</span> Retour au personnel
      </NuxtLink>
      <div class="min-w-0 flex-1 sm:border-l sm:border-white/[0.13] sm:pl-5">
        <h1 class="text-xl font-bold text-white">Nouvel employé</h1>
        <p class="mt-1 text-xs text-neutral-500">Créez un compte pour un membre de l'équipe</p>
      </div>
    </header>

    <form class="rounded-3xl border border-white/[0.13] bg-[#141414]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur sm:p-8" novalidate @submit.prevent="soumettre">
      <p v-if="erreurFormulaire" class="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300" role="alert">{{ erreurFormulaire }}</p>

      <div class="grid gap-[18px] sm:grid-cols-2">
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
          <span>Nom complet <span class="text-orange-500">*</span></span>
          <input v-model="form.nom" required autocomplete="name" placeholder="Nom et prénom" :class="champ" />
        </label>
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
          <span>Adresse e-mail <span class="text-orange-500">*</span></span>
          <input v-model="form.email" required type="email" autocomplete="off" placeholder="nom@smartresto.cd" :class="champ" />
        </label>
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
          <span>Rôle <span class="text-orange-500">*</span></span>
          <select v-model="form.role" required :class="champ">
            <option v-for="r in ROLES" :key="r.valeur" :value="r.valeur">{{ r.libelle }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-2 text-xs font-medium text-neutral-300">
          <span>Mot de passe <span class="text-orange-500">*</span></span>
          <input v-model="form.motDePasse" required type="password" autocomplete="new-password" placeholder="••••••••" :class="champ" />
        </label>
        <label class="flex items-center gap-2.5 text-xs text-neutral-400 sm:col-span-2">
          <input v-model="form.actif" type="checkbox" class="h-4 w-4 accent-orange-500" />
          <span>Compte actif</span>
        </label>
      </div>
      <p class="mt-5 text-[11px] text-neutral-500">Le mot de passe reste toujours masqué et n'est jamais affiché.</p>

      <div class="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.13] pt-5 sm:flex-row sm:justify-end">
        <NuxtLink to="/personnel" class="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-white/5 px-5 text-sm font-semibold text-neutral-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">Annuler</NuxtLink>
        <button type="submit" :disabled="envoi" class="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#f15a00] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(249,115,22,0.2)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] disabled:cursor-wait disabled:opacity-60">
          {{ envoi ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </main>
</template>