export default function Placeholder({ title }: { title: string }) {
  return (
    <section className="app-section" aria-labelledby="placeholder-title">
      <p className="eyebrow">COMING NEXT</p>
      <h2 id="placeholder-title">{title}</h2>
      <p style={{ color: "var(--ink-2)", maxWidth: 620 }}>
        This slice is on the plan but has not been built yet. Everything else in the hub is ready to open.
      </p>
      <p className="app-attribution">Planned for Teddy Rook Book · CC BY-NC 4.0</p>
    </section>
  );
}
