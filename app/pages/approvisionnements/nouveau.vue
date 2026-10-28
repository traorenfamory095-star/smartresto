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
  <section class="max-w-md">
    <h1 class="text-2xl font-bold mb-4">Nouveau fournisseur</h1>
    <form class="flex flex-col gap-3" @submit.prevent="soumettre">
      <label class="flex flex-col gap-1"><span>Nom</span><input v-model="form.nom" required class="px-3 py-2 border rounded" /></label>
      <label class="flex flex-col gap-1"><span>Catégorie</span><input v-model="form.categorie" required class="px-3 py-2 border rounded" /></label>
      <label class="flex flex-col gap-1"><span>Contact</span><input v-model="form.contact" class="px-3 py-2 border rounded" /></label>
      <label class="flex flex-col gap-1"><span>Téléphone</span><input v-model="form.telephone" class="px-3 py-2 border rounded" /></label>
      <label class="flex flex-col gap-1"><span>E-mail</span><input v-model="form.email" type="email" class="px-3 py-2 border rounded" /></label>
      <label class="flex flex-col gap-1"><span>Adresse</span><input v-model="form.adresse" class="px-3 py-2 border rounded" /></label>
      <button class="px-4 py-2 rounded bg-slate-900 text-white">Créer</button>
    </form>
  </section>
</template>
