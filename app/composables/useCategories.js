export function useCategories() {
  const { lire } = useApi()

  const { data, pending, error, refresh } = useAsyncData('categories', async () => {
    const categories = await lire('/categories', { _sort: 'ordre', _order: 'asc' })
    return [...categories].sort((a, b) => a.ordre - b.ordre)
  })

  return {
    categories: data,
    pending,
    error,
    refresh,
  }
}
