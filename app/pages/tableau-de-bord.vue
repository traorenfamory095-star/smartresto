<script setup>
// Tableau de bord : l'essentiel avant le service. Propriétaire : Traoré.
// Tout vient de l'API (aucun chiffre écrit en dur) ; les calculs sont dans utils/tableau/calculs.js.
// Chaque bloc n'apparaît (et n'est chargé) que si le rôle de l'utilisateur a accès au module.
//
// Pour rejouer un jour passé (les données de départ sont du 21 octobre) :
//   /tableau-de-bord?date=2026-10-21            ou   ?date=2026-10-21&heure=18:30
import {
  accorder, dateEnLettres, etiquetteTable, jourLocal, libelleVariation, prenom, referenceMaintenant,
  resumeNoms, salutation, syntheseDuJour,
} from '~/utils/tableau/calculs.js'

useHead({ title: 'Tableau de bord | SmartResto' })

const route = useRoute()
const { lire } = useApi()
const { utilisateur, peut } = useAuth()

// Un serveur ne voit pas le chiffre d'affaires, un cuisinier ne voit pas les réservations, etc.
const voit = computed(() => ({
  commandes: peut('/commandes'),
  reservations: peut('/reservations'),
  stock: peut('/stock'),
  ca: peut('/rapports'),
}))

// L'heure n'est lue que dans le navigateur : le serveur et le visiteur n'ont pas le même fuseau,
// ce qui ferait afficher « Bonjour » d'un côté et « Bonsoir » de l'autre.
const maintenant = ref(null)
const simule = ref(false)

const { data, error, refresh } = useAsyncData(
  'tableau-de-bord',
  async () => {
    const reference = referenceMaintenant(route.query)
    maintenant.value = reference.maintenant
    simule.value = reference.simule

    const v = voit.value
    const besoinCommandes = v.commandes || v.ca
    // Cinq lectures en parallèle, et seulement celles dont ce rôle a besoin : pas de requête par commande.
    const [commandes, lignes, tables, reservations, ingredients] = await Promise.all([
      besoinCommandes ? lire('/commandes') : [],
      besoinCommandes ? lire('/lignesCommande') : [],
      v.commandes ? lire('/tables') : [],
      v.reservations ? lire('/reservations', { date: jourLocal(reference.maintenant), statut: 'confirmee' }) : [],
      v.stock ? lire('/ingredients') : [],
    ])
    return { commandes, lignes, tables, reservations, ingredients }
  },
  { server: false, lazy: true },
)

const chargement = computed(() => !data.value && !error.value)
const synthese = computed(() => (data.value && maintenant.value ? syntheseDuJour(data.value, maintenant.value) : null))

// Un autre jour simulé dans l'adresse : on recharge.
watch(() => [route.query.date, route.query.heure], () => refresh())

// Actualisation automatique, nettoyée en quittant la page (sinon chaque retour ajouterait un intervalle).
let minuteur
onMounted(() => {
  minuteur = setInterval(() => {
    if (!document.hidden) refresh()
  }, 30_000)
})
onUnmounted(() => clearInterval(minuteur))

// --- Textes ---
const dateLisible = computed(() => (maintenant.value ? dateEnLettres(maintenant.value) : ''))
// « Bonsoir Patrick » (ou seulement « Bonsoir » si l'utilisateur n'a pas de nom)
const accroche = computed(() =>
  maintenant.value ? [salutation(maintenant.value), prenom(utilisateur.value?.nom)].filter(Boolean).join(' ') : '',
)
const heureMiseAJour = computed(() => (maintenant.value ? formaterHeure(maintenantLocal(maintenant.value)) : ''))
const phrase = computed(() => {
  const t = synthese.value?.tables
  const salle = voit.value.commandes && t?.actives ? `${accorder(t.occupees, 'table occupée', 'tables occupées')} sur ${t.actives}. ` : ''
  return `${salle}Voici l’essentiel à connaître avant le coup de feu.`
})

const detailCa = computed(() => libelleVariation(synthese.value?.ca.variation))
const tonCa = computed(() => {
  const v = synthese.value?.ca.variation
  return v === null || v === undefined ? 'neutre' : v < 0 ? 'err' : 'ok'
})
const detailReservations = computed(() => {
  const r = synthese.value?.reservations
  return r?.nombre ? accorder(r.couverts, 'couvert attendu', 'couverts attendus') : 'Aucun couvert attendu'
})
const detailStock = computed(() => {
  const s = synthese.value?.stock
  return s?.nombre ? `À traiter : ${resumeNoms(s.noms)}` : 'Tout est en ordre'
})

// Raccourcis vers les autres modules (ceux que le rôle peut ouvrir).
const raccourcis = computed(() =>
  LIENS_MENU_ADMIN.filter((lien) => lien.nom && peut(lien.nom)),
)
</script>

<template>
  <section>
    <header class="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p v-if="dateLisible" class="text-sm font-bold uppercase tracking-[0.2em] text-acc">{{ dateLisible }}</p>
        <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-head sm:text-4xl">
          <template v-if="maintenant">
            {{ accroche }},<br />
            <span class="text-acc">prêt pour le service ?</span>
          </template>
          <template v-else>Tableau de bord</template>
        </h1>
        <p v-if="maintenant" class="mt-3 max-w-xl text-mut">{{ phrase }}</p>
      </div>

      <div class="flex flex-wrap gap-3">
        <UiBouton v-if="voit.commandes" to="/commandes/nouvelle" taille="lg">
          <span aria-hidden="true">+</span> Nouvelle commande
        </UiBouton>
        <UiBouton to="/carte" variante="secondaire" taille="lg">Voir la carte</UiBouton>
      </div>
    </header>

    <p
      v-if="simule && maintenant"
      role="status"
      class="mt-6 rounded-xl border border-dashed border-line bg-soft px-4 py-3 text-sm text-mut"
    >
      Affichage simulé au <strong class="text-ink">{{ dateLisible.toLowerCase() }}</strong> (paramètre « date » dans l’adresse).
      <NuxtLink to="/tableau-de-bord" class="font-semibold text-acc underline underline-offset-4">Revenir à aujourd’hui</NuxtLink>
    </p>

    <div class="mt-8">
      <UiEtat :chargement="chargement" :erreur="error" :vide="false" @reessayer="refresh">
        <div v-if="synthese" class="space-y-8">
          <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs">
            <li v-if="voit.ca">
              <TableauIndicateur
                libelle="Chiffre d’affaires · 7 jours"
                :valeur="formaterPrix(synthese.ca.semaine)"
                :detail="detailCa"
                :ton="tonCa"
                lien="/rapports"
                icone="rapports"
              />
            </li>
            <li v-if="voit.commandes">
              <TableauIndicateur
                libelle="Commandes aujourd’hui"
                :valeur="String(synthese.commandes.aujourdhui)"
                :detail="`${synthese.commandes.enCours} en cours`"
                lien="/commandes"
                icone="commandes"
              />
            </li>
            <li v-if="voit.reservations">
              <TableauIndicateur
                libelle="Réservations aujourd’hui"
                :valeur="String(synthese.reservations.nombre)"
                :detail="detailReservations"
                lien="/reservations"
                icone="reservations"
              />
            </li>
            <li v-if="voit.stock">
              <TableauIndicateur
                libelle="Alertes stock"
                :valeur="String(synthese.stock.nombre)"
                :detail="detailStock"
                :ton="synthese.stock.nombre ? 'err' : 'ok'"
                lien="/stock"
                icone="stock"
              />
            </li>
          </ul>

          <div
            v-if="voit.commandes || voit.reservations"
            class="grid gap-6"
            :class="{ 'lg:grid-cols-[1.4fr_1fr]': voit.commandes && voit.reservations }"
          >
            <UiCarte v-if="voit.commandes" as="section" aria-labelledby="titre-dernieres">
              <div class="flex items-center justify-between gap-3">
                <h2 id="titre-dernieres" class="text-lg font-bold text-head">Dernières commandes</h2>
                <NuxtLink to="/commandes" class="text-sm font-semibold text-acc hover:underline">
                  Tout voir <span aria-hidden="true">→</span>
                </NuxtLink>
              </div>

              <p v-if="!synthese.dernieres.length" class="py-8 text-center text-sm text-mut">
                Aucune commande pour le moment.
              </p>
              <div v-else class="mt-4 overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <caption class="sr-only">Les quatre dernières commandes</caption>
                  <thead>
                    <tr class="text-xs uppercase tracking-wider text-mut">
                      <th scope="col" class="py-2 pr-3 font-semibold">N°</th>
                      <th scope="col" class="py-2 pr-3 font-semibold">Table</th>
                      <th scope="col" class="py-2 pr-3 font-semibold">Total</th>
                      <th scope="col" class="py-2 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in synthese.dernieres" :key="c.id" class="border-t border-line">
                      <th scope="row" class="py-3 pr-3 font-semibold">
                        <NuxtLink :to="`/commandes/${c.id}`" class="text-head hover:underline">#{{ c.id }}</NuxtLink>
                      </th>
                      <td class="py-3 pr-3 text-ink">{{ etiquetteTable(c.table) }}</td>
                      <td class="py-3 pr-3 font-semibold text-head">{{ formaterPrix(c.total) }}</td>
                      <td class="py-3"><UiBadgeStatut type="commande" :statut="c.statut" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </UiCarte>

            <UiCarte v-if="voit.reservations" as="section" aria-labelledby="titre-reservations">
              <div class="flex items-center justify-between gap-3">
                <h2 id="titre-reservations" class="text-lg font-bold text-head">Prochaines réservations</h2>
                <NuxtLink to="/reservations" class="text-sm font-semibold text-acc hover:underline">
                  Planning <span aria-hidden="true">→</span>
                </NuxtLink>
              </div>

              <p v-if="!synthese.reservations.prochaines.length" class="py-8 text-center text-sm text-mut">
                {{ synthese.reservations.nombre ? 'Plus de réservation à venir aujourd’hui.' : 'Aucune réservation aujourd’hui.' }}
              </p>
              <ol v-else class="mt-2">
                <li
                  v-for="r in synthese.reservations.prochaines"
                  :key="r.id"
                  class="flex items-center gap-4 border-t border-line py-3 first:border-t-0"
                >
                  <p class="w-14 shrink-0 text-lg font-extrabold text-acc">{{ r.heure }}</p>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-semibold text-head">{{ r.nomClient }}</p>
                    <p class="text-sm text-mut">{{ r.nbPersonnes }} pers.</p>
                  </div>
                  <UiBadgeStatut type="reservation" :statut="r.statut" />
                </li>
              </ol>
            </UiCarte>
          </div>

          <p class="text-xs text-mut">
            Mis à jour à {{ heureMiseAJour }}. Actualisation automatique toutes les 30 secondes.
          </p>
        </div>
      </UiEtat>
    </div>

    <section class="mt-10" aria-labelledby="titre-modules">
      <h2 id="titre-modules" class="text-lg font-bold text-head">Tous les modules</h2>
      <ul class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="lien in raccourcis" :key="lien.chemin">
          <NuxtLink
            :to="lien.chemin"
            class="flex h-full items-start gap-4 rounded-carte border border-line bg-card p-5 transition hover:border-cy/50"
          >
            <span class="rounded-xl bg-cy/10 p-2 text-cy">
              <UiIcone :nom="lien.icone" />
            </span>
            <span>
              <span class="block font-semibold">{{ lien.libelle }}</span>
              <span class="mt-1 block text-sm text-mut">{{ lien.description }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </section>
</template>