<script setup>
// Page « À propos ». Propriétaire : Traoré (site public).
definePageMeta({ layout: 'public' })
useHead({ title: 'Notre histoire — À propos | SmartResto' })

const valeurs = [
  {
    numero: '01',
    icone: 'plats',
    titre: 'Produits du lac',
    texte: 'Nos poissons arrivent frais des pêcheurs du lac Kivu, dans le respect des saisons.',
  },
  {
    numero: '02',
    icone: 'cuisine',
    titre: 'Cuisine traditionnelle',
    texte: 'Nous préservons les gestes, les épices et les recettes qui font vivre la mémoire de notre région.',
  },
  {
    numero: '03',
    icone: 'reservations',
    titre: 'Accueil chaleureux',
    texte: 'Chaque client entre comme un invité et repart comme un membre de la famille SmartResto.',
  },
]

const statistiques = [
  { nombre: '08', libelle: 'années d’existence' },
  { nombre: '24', libelle: 'plats à la carte' },
  { nombre: '18k+', libelle: 'clients servis' },
  { nombre: '32', libelle: 'tables' },
]

const equipe = [
  {
    nom: 'Patrick Murhula',
    poste: 'Chef exécutif',
    image: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900',
  },
  {
    nom: 'Aline Kavira',
    poste: 'Responsable de salle',
    image: 'https://images.unsplash.com/photo-1496811425508-6d7ebb7ff32c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900',
  },
  {
    nom: 'Merveille Masika',
    poste: 'Cheffe pâtissière',
    image: 'https://images.unsplash.com/photo-1731576089290-e6230a18dcb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900',
  },
]
</script>

<template>
  <div>
    <!-- Notre histoire -->
    <section class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <div class="max-w-2xl">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          L'âme de SmartResto
        </p>

        <h1 class="mt-4 text-4xl font-bold leading-tight text-head sm:text-5xl">
          Notre <span class="text-accent">histoire</span>
        </h1>

        <p class="mt-5 text-lg leading-relaxed text-gris">
          Une table née à Goma pour célébrer les produits, les gestes et
          l'hospitalité des Grands Lacs.
        </p>
      </div>

      <div class="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div class="space-y-6">
          <p class="text-sm font-semibold uppercase tracking-widest text-accent">
            01 — Depuis 2018
          </p>

          <h2 class="text-3xl font-bold leading-tight text-head sm:text-4xl">
            Une cuisine ancrée au bord du lac Kivu.
          </h2>

          <div class="space-y-4 leading-relaxed text-gris">
            <p>
              SmartResto est né d'une idée simple : offrir à Goma une table
              contemporaine où les recettes de notre enfance seraient servies
              avec fierté. Tout a commencé avec quelques tables, un gril au
              charbon et le désir de raconter le Kivu autrement.
            </p>

            <p>
              Aujourd'hui encore, nous travaillons avec les pêcheurs, les
              maraîchers et les artisans de la région. Chaque assiette relie
              le lac, la terre volcanique et les histoires de celles et ceux
              qui nous entourent.
            </p>
          </div>

          <div class="border-l-2 border-accent py-2 pl-4">
            <p class="font-semibold text-head">Patrick Murhula</p>
            <p class="text-sm text-gris">Fondateur & chef exécutif</p>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              <UiIcone nom="tables" />
            </span>
            <div>
              <p class="font-semibold text-head">Goma, RDC</p>
              <p class="text-sm text-gris">Notre maison depuis 2018</p>
            </div>
          </div>
        </div>

        <div class="relative">
          <img
            src="https://images.unsplash.com/photo-1726835498689-b4f6dbcdbdfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1400"
            alt="La salle chaleureuse de SmartResto"
            class="h-[420px] w-full rounded-2xl object-cover sm:h-[520px]"
            loading="lazy"
          />

          <div class="absolute -bottom-5 left-5 rounded-xl bg-white text-soft px-5 py-4 shadow-lg sm:left-8">
            <p class="text-xs font-semibold uppercase tracking-wider text-gris">
              Notre maison
            </p>
            <p class="mt-1 text-lg font-bold text-soft">Depuis 2018</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Nos valeurs -->
    <section class="bg-bg py-16 lg:py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="max-w-2xl">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Ce qui nous guide
          </p>

          <h2 class="mt-3 text-3xl font-bold text-head sm:text-4xl">
            Nos <span class="text-accent">valeurs</span>
          </h2>

          <p class="mt-4 leading-relaxed text-gris">
            Chaque jour, ces trois principes donnent du sens à notre cuisine
            et à la manière dont nous accueillons nos clients.
          </p>
        </div>

        <ul class="mt-10 grid gap-6 md:grid-cols-3">
          <li v-for="valeur in valeurs" :key="valeur.numero">
            <UiCarte class="h-full p-6">
              <div class="flex items-center justify-between">
                <span class="text-3xl font-bold text-accent/40">
                  {{ valeur.numero }}
                </span>

                <span class="rounded-xl bg-accent/10 p-3 text-accent">
                  <UiIcone :nom="valeur.icone" />
                </span>
              </div>

              <h3 class="mt-6 text-xl font-semibold text-head">
                {{ valeur.titre }}
              </h3>

              <p class="mt-3 leading-relaxed text-gris">
                {{ valeur.texte }}
              </p>
            </UiCarte>
          </li>
        </ul>
      </div>
    </section>

    <!-- Nos chiffres -->
    <section class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
        <div
          v-for="stat in statistiques"
          :key="stat.libelle"
          class="text-center"
        >
          <p class="text-4xl font-bold text-accent sm:text-5xl">
            {{ stat.nombre }}
          </p>
          <p class="mt-2 text-sm text-gris sm:text-base">
            {{ stat.libelle }}
          </p>
        </div>
      </div>
    </section>

    <!-- Notre équipe -->
    <section id="team" class="bg-bg py-16 lg:py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Les visages de la maison
            </p>

            <h2 class="mt-3 text-3xl font-bold text-head sm:text-4xl">
              Notre <span class="text-accent">équipe</span>
            </h2>
          </div>

          <p class="max-w-md leading-relaxed text-gris">
            Derrière chaque assiette et chaque sourire, il y a des femmes et
            des hommes passionnés par leur métier.
          </p>
        </div>

        <div class="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="membre in equipe" :key="membre.nom">
            <img
              :src="membre.image"
              :alt="membre.nom"
              class="h-80 w-full rounded-2xl object-cover"
              loading="lazy"
            />

            <div class="mt-4">
              <h3 class="text-xl font-semibold text-head">
                {{ membre.nom }}
              </h3>
              <p class="mt-1 text-sm text-gris">
                {{ membre.poste }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Appel à l'action -->
    <section class="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-24">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        L'expérience SmartResto
      </p>

      <h2 class="mx-auto mt-4 max-w-2xl text-3xl font-bold text-head sm:text-4xl">
        La chaleur du Kivu dans chaque assiette.
      </h2>

      <p class="mx-auto mt-4 max-w-xl leading-relaxed text-gris">
        Venez découvrir notre cuisine et partager un moment chaleureux
        autour de notre table.
      </p>

      <div class="mt-8 flex flex-wrap justify-center gap-4">
        <UiBouton to="/carte" taille="lg">
          Découvrir notre carte
        </UiBouton>

        <UiBouton to="/reserver" taille="lg" variante="discret">
          Réserver une table
        </UiBouton>
      </div>
    </section>
  </div>
</template>