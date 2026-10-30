
<script setup>
//Recuperation API

const { recupererTables, creerTable, modifierTable } = useTables()

const { data: tables, pending, error, refresh } = await useAsyncData('gestion-tables', recupererTables)

const formulaireOuvert = ref(false)
const enregistrement = ref(false)
const messageErreur = ref('')

const tableEnModification = ref(null)

const nouvelleTable = reactive({
    numero: '',
    capacite: 2,
    zone: '',
    actif: true,
})

function ouvrirModalModification(table){
    tableEnModification.value = table
    Object.assign(nouvelleTable, {
        numero: table.numero,
        capacite: table.capacite,
        zone: table.zone,
        actif: table.actif,
    })

    messageErreur.value = ''
    formulaireOuvert.value = true
}

// Creation table, modification table et Modal

function ourvirModalCreation(){
    tableEnModification.value = null

    Object.assign(nouvelleTable, {
        numero: '',
        capacite: 2,
        zone: '',
        actif: true,
    })

    messageErreur.value = ''
    formulaireOuvert.value = true
}

function fermerModal(){
    formulaireOuvert.value = false
    tableEnModification.value = null
    messageErreur.value = ''
}

async function enregistrerTable() {
    messageErreur.value = ''

    if( !nouvelleTable.numero || !nouvelleTable.zone.trim() || Number(nouvelleTable.capacite) < 1){
        messageErreur.value = "Remplissez tous les champs correctement."
        return
    }

    enregistrement.value = true

    try{
       const donnees = {
        numero: Number(nouvelleTable.numero),
        capacite: Number(nouvelleTable.capacite),
        zone: nouvelleTable.zone.trim(),
        actif: nouvelleTable.actif,
       }
       if(tableEnModification.value){
        console.log('Table à modifier :', tableEnModification.value)
        console.log('ID envoyé :', tableEnModification.value?.id)
        await modifierTable(tableEnModification.value.id, donnees)
       } else{
        await creerTable(donnees)
       }
       await refresh()

       Object.assign(nouvelleTable, {
        numero: '',
        capacite: 2,
        zone: '',
        actif: true,
       })

       tableEnModification.value = null
       formulaireOuvert.value = false

    }catch(erreur){
        messageErreur.value = erreur?.data?.message || erreur?.message || 
        "Impossible d'enregistrer la table."
    }finally{
        enregistrement.value = false
    }
}

useHead({
    title: 'Gestion des tables | SmartResto'
})
</script>

<template>
    <main class="mx-auto w-full max-w-6xl space-y-8">
        <header class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-head">
                    Gestion des tables
                </h1>
                <p class="mt-2 text-sm text-mut">
                    Gérez les tables de votre restaurant.
                </p>
            </div>

            <button 
                type="button"
                class="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-degrade px-5 py-3 font-semibold  shadow-lg shadow-pri/10 transition hover:brightness-110 active:scale-[0.98]"
                @click="ourvirModalCreation"
            >
                <span class="text-lg">+</span>
                Ajouter une table
            </button>
        </header>
        
        <div
            v-if="formulaireOuvert"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
            <div class="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
                
                <!--HEADER-->
                <div class="flex items-start justify-between border-b border-line p-6">
                    <div>
                        <h2 class="text-xl font-bold text-head">
                            {{ tableEnModification ? 'Modifier la table' : 'Ajouter une table' }}
                        </h2>

                        <p class="mt-2 text-sm text-mut">
                            {{ tableEnModification ? 'Modifier les informations de cette table.' : 'Ajouter une nouvelle table au restaurant' }}
                        </p>
                    </div>

                    <button
                        type="button"
                        class="flex h-9 w-9 items-center justify-center rounded-lg text-mut transition hover:bg-soft hover:text-ink"
                        @click="fermerModal"
                    >
                        ✕
                    </button>
                </div>

                <!--FORMULAIRE-->
                <form
                    class="space-y-5 p-6"
                    @submit.prevent="enregistrerTable"
                >
                    <div>
                        <label for="numero" class="mb-2 block text-sm font-medium text-ink">
                            Numéro de table
                        </label>
                        <input
                            type="number"
                            id="numero"
                            v-model="nouvelleTable.numero"
                            min="1"
                            required
                            class="w-full rounded-xl border border-line bg-soft px-4 py-3 text-ink outline-none transition placeholder:text-mut focus:border-pri focus:ring-2 focus:ring-pri/20"
                        >
                    </div>
    
                    <div>
                        <label for="capacite" class="mb-2 block text-sm font-medium text-ink">
                            Capacité
                        </label>
                        <input
                            type="number"
                            id="capacite"
                            v-model.number="nouvelleTable.capacite"
                            min="1"
                            required
                            class="w-full rounded-xl border border-line bg-soft px-4 py-3 text-ink outline-none transition placeholder:text-mut focus:border-pri focus:ring-2 focus:ring-pri/20"
                        >
                    </div>
    
                    <div>
                        <label for="zone" class="mb-2 block text-sm font-medium text-ink">
                            Zone
                        </label>
                        <input
                            type="text"
                            id="zone"
                            v-model="nouvelleTable.zone"
                            placeholder="Ex. Terrasse, Intérieur..."
                            required
                            class="w-full rounded-xl border border-line bg-soft px-4 py-3 text-ink outline-none transition placeholder:text-mut focus:border-pri focus:ring-2 focus:ring-pri/20"
                        >
                    </div>
    
                    <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-soft p-4 transition hover:border-pri/50">
                        <input
                            type="checkbox"
                            v-model="nouvelleTable.actif"
                            class="h-4 w-4 accent-[var(--pri)]"
                        >
                        <span class="text-sm font-medium text-ink">
                            Table active
                        </span>
                    </label>
    
                    <p
                        v-if="messageErreur"
                        class="rounded-lg border border-err/20 bg-err/10 px-4 py-3 text-sm text-err"
                    >
                        {{ messageErreur }}
                    </p>

                    <div class="flex flex-col-reverse justify-end gap-3 border-t border-line pt-5 sm:flex-row">
                        <button
                            type="button"
                            class="rounded-xl border border-line px-5 py-3 text-sm font-medium text-mut transition hover:bg-soft hover:text-ink"
                            @click="fermerModal"
                        >
                            Annuler
                        </button>

                        <button
                            type="submit"
                            :disabled="enregistrement"
                            class="rounded-xl bg-degrade px-5 py-3 text-sm font-semibold text-on-pri shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {{ enregistrement ? 'Enregistrement...' : tableEnModification ? 'Modifier la table' : 'Enregistrer la table' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <p v-if="pending" class="rounded-xl border border-line bg-card p-6 text-sm text-mut">
            Chargement des tables...
        </p>

        <p v-else-if="error" class="rounded-xl border border-err/20 bg-err/10 p-5 text-sm text-err">
            Impossible de charger les tables.
        </p>

        <section v-else class="space-y-4">
            <div
                v-for="table in tables"
                :key="table.id"
                class="rounded-2xl border border-line bg-card p-5 transition duration-200 hover:border-pri/40 hover:shadow-lg hover:shadow-black/5"
            >
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 class="text-xl font-bold text-head">
                            Table {{ table.numero }}
                        </h2>
                        <p class="mt-2 text-sm text-mut">
                            {{ table.capacite }} personne - {{ table.zone }}
                        </p>
                    </div>

                    <div class="flex items-center justify-between gap-4 sm:justify-end">
                        <span
                            :class="table.actif
                                ? 'border border-ok/20 bg-ok/10 text-ok'
                                : 'border border-err/20 bg-err/10 text-err'"
                            class="rounded-full px-3 py-1.5 text-xs font-semibold"
                        >
                            {{ table.actif ? 'Active' : 'Inactive' }}
                        </span>

                        <button
                            type="button"
                            class="rounded-xl border border-line bg-soft px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-pri hover:text-pri"
                            @click="ouvrirModalModification(table)"
                        >
                            Modifier
                        </button>
                    </div>
                </div>
            </div>
        </section>
    </main>
</template>
