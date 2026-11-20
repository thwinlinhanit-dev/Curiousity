// CC TASL — Title, Author, Source, Licence — placed close to the content.
export default function Tasl({ title, author, url, note }: { title: string; author: string; url: string; note?: string }) {
  return (
    <aside className="tasl" aria-label="Attribution">
      <span className="app-kicker">SOURCE & LICENCE</span>
      <p>
        <b>{title}</b> · {author} · <a href={url} target="_blank" rel="noreferrer">source</a> ·{" "}
        <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">CC BY-NC 4.0</a>
        {note ? ` · ${note}` : ""}
      </p>
    </aside>
  );
}
