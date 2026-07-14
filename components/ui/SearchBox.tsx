export function SearchBox({
  placeholder,
  defaultValue,
  hidden,
}: {
  placeholder: string
  defaultValue?: string
  hidden?: Record<string, string>
}) {
  return (
    <form className="flex gap-2">
      {hidden
        ? Object.entries(hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <button
        type="submit"
        className="h-10 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
      >
        Buscar
      </button>
    </form>
  )
}
