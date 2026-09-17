/** Renders `text` with the first occurrence of `word` wrapped in an orange span. */
export default function Highlight({ text, word }: { text: string; word?: string }) {
  if (!word) return <>{text}</>
  const i = text.toLowerCase().indexOf(word.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <span className="text-primary">{text.slice(i, i + word.length)}</span>
      {text.slice(i + word.length)}
    </>
  )
}
