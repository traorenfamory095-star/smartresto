<script setup>
// Une ligne du tableau des commandes. Propriétaire : Traoré.
//   <tbody><CommandeRangee :commande="c" /></tbody>
defineProps({
  commande: { type: Object, required: true },
})
</script>

<template>
  <tr class="border-t border-line transition hover:bg-soft">
    <th scope="row" class="px-4 py-4 text-left font-semibold text-head">#{{ commande.id }}</th>
    <td class="px-4 py-4 text-ink">{{ commande.table ? `T${String(commande.table.numero).padStart(2, '0')}` : '—' }}</td>
    <td class="px-4 py-4 text-ink">{{ commande.serveur?.nom ?? '—' }}</td>
    <td class="px-4 py-4 text-ink">{{ formaterHeure(commande.creeLe) }}</td>
    <td class="px-4 py-4 font-semibold text-head">{{ formaterPrix(commande.total) }}</td>
    <td class="px-4 py-4"><UiBadgeStatut type="commande" :statut="commande.statut" /></td>
    <td class="px-4 py-4 text-right">
      <NuxtLink
        :to="`/commandes/${commande.id}`"
        class="inline-flex items-center gap-1 text-sm text-mut hover:text-ink focus-visible:outline-2 focus-visible:outline-cy"
      >
        Détails <span aria-hidden="true" class="text-acc">→</span>
        <span class="sr-only">de la commande {{ commande.id }}</span>
      </NuxtLink>
    </td>
  </tr>
</template>