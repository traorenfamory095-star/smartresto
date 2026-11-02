<script setup>
const { creer } = useFournisseurs()
const router = useRouter()
const { succes, erreur } = useNotifier()
const form = reactive({ nom: '', categorie: '', contact: '', telephone: '', email: '', adresse: '' })

async function soumettre() {
  try { await creer({ ...form }); succes('Fournisseur créé'); router.push('/fournisseurs') }
  catch (e) { erreur(e.message) }
}
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-6">
    <header>
      <NuxtLink to="/fournisseurs" class="text-sm font-semibold text-orange-700 transition hover:text-orange-800">
        <span aria-hidden="true">←</span> Retour aux fournisseurs
      </NuxtLink>
      <p class="mt-5 text-sm font-semibold uppercase tracking-wide text-orange-600">Gestion des achats</p>
      <h1 class="mt-1 text-3xl font-bold text-gray-900">Ajouter un fournisseur</h1>
      <p class="mt-2 text-sm text-gray-500">Enregistrez les coordonnées de votre partenaire pour préparer vos commandes.</p>
    </header>

    <form class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8" @submit.prevent="soumettre">
      <div class="mb-6 border-b border-gray-100 pb-5">
        <h2 class="font-semibold text-gray-900">Informations du fournisseur</h2>
        <p class="mt-1 text-sm text-gray-500">Les champs marqués d’un astérisque sont obligatoires.</p>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block sm:col-span-2">
          <span class="mb-1.5 block text-sm font-medium text-gray-700">Nom <span class="text-orange-600">*</span></span>
          <input v-model="form.nom" required autocomplete="organization" placeholder="Ex. : Maraîchers de Virunga" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-gray-700">Catégorie <span class="text-orange-600">*</span></span>
          <input v-model="form.categorie" required placeholder="Ex. : Fruits et légumes" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-gray-700">Personne à contacter</span>
          <input v-model="form.contact" autocomplete="name" placeholder="Nom du contact" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-gray-700">Téléphone</span>
          <input v-model="form.telephone" type="tel" autocomplete="tel" placeholder="+243 ..." class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </label>
        <label class="block">
          <span class="mb-1.5 block text-sm font-medium text-gray-700">Adresse e-mail</span>
          <input v-model="form.email" type="email" autocomplete="email" placeholder="contact@exemple.com" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </label>
        <label class="block sm:col-span-2">
          <span class="mb-1.5 block text-sm font-medium text-gray-700">Adresse</span>
          <input v-model="form.adresse" autocomplete="street-address" placeholder="Adresse du fournisseur" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </label>
      </div>
      <div class="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <NuxtLink to="/fournisseurs" class="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
          Annuler
        </NuxtLink>
        <button type="submit" class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
          Enregistrer le fournisseur
        </button>
      </div>
    </form>
  </main>
</template>