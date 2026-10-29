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
    <main>
        <header>
            <h1 class="text-3xl font-bold">Gestion des tables</h1>
            <button 
            type="button"
            class="mt-6 rounded-lg bg-accent px-4 py-2 font-medium text-white"
            @click="ourvirModalCreation"
            >
                + Ajouter une table
            </button>
        </header>
        
        <div v-if="formulaireOuvert" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div class="w-full max-w-lg rounded-2xl border border-bordure bg-carte-solide p-6 shadow-2xl">

                <!--HEADER-->
                <div class="mb-6 flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-bold">
                            {{ tableEnModification ? 'Modifier la table' : 'Ajouter une table' }}
                        </h2>

                        <p class="mt-1 text-sm text-gris">
                            {{ tableEnModification ? 'Modifier les informations de cette table.' : 'Ajouter une nouvelle table au restaurant' }}
                        </p>
                    </div>

                    <button
                    type="button"
                    class="text-gris hover:text-white"
                    @click="fermerModal"
                    >
                        ✕
                    </button>
                </div>

                <!--FORMULAIRE-->
                <form 
                class="space-y-4"
                @submit.prevent="enregistrerTable"
                >
                    <div>
                        <label for="numero" class="mb-1 block text-sm">Numéro de table</label>
                        <input type="number" id="numero" v-model="nouvelleTable.numero" min="1" required
                        class="w-full rounded-lg border border-bordure bg-carte-solide p-3"
                        >
                    </div>
    
                    <div>
                        <label for="capacite"  class="mb-1 block text-sm">Capacité</label>
                        <input type="number" id="capacite" v-model.number="nouvelleTable.capacite"
                        min="1" required class="w-full rounded-lg border border-bordure bg-carte-solide p-3"
                        >
                    </div>
    
                    <div>
                        <label for="zone" class="mb-1 block text-sm">Zone</label>
                        <input type="text" id="zone"
                        v-model="nouvelleTable.zone"
                        placeholder="Ex. Terrasse, Intérieur..."
                        required class="w-full rounded-lg border border-bordure bg-carte-solide p-3"
                        >
                    </div>
    
                    <label class="flex items-center gap-2">
                        <input type="checkbox" v-model="nouvelleTable.actif">
                        <span class="text-sm">
                            Table active
                        </span>
                    </label>
    
                    <p v-if="messageErreur" class="text-erreur">
                        {{ messageErreur }}
                    </p>

                    <div class="flex justify-end gap-3 pt-4">
                        <button
                        type="submit"
                        :disabled="enregistrement"
                        class="rounded-lg bg-accent px-4 py-2 font-medium text-white disabled:opacity-50"
                        >
                            {{ enregistrement ? 'Enregistrement...' : tableEnModification ? 'Modifier la table' : 'Enregistrer la table' }}
                        </button>

                        <button
                        type="button"
                        class="rounded-lg border border-bordure px-4 py-2 text-sm"
                        @click="fermerModal"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>


        <p class="mt-2 text-gris">
            Gérez les tables de votre restaurant.
        </p>

        <p v-if="pending">
            Chargement des tables...
        </p>

        <p v-else-if="error" class="text-erreur">
            Impossible de charger les tables.
        </p>

        <section v-else class="mt-8">
            <div 
            v-for="table in tables" 
            :key="table.id"
            class="mb-4 rounded-xl border border-bordure bg-carte p-5"
            >
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-bold">Table {{ table.numero }}</h2>
                        <p class="mt-1 text-gris"> {{ table.capacite }} personne - {{ table.zone }}</p>
                    </div>

                    <div class="flex items-center gap-3">
                        <span>
                            {{ table.actif ? 'Active' : 'Inactive' }}
                        </span>

                        <button
                        type="button"
                        class="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
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