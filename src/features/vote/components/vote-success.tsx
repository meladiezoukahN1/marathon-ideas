interface VoteSuccessProps {
  title: string;
  description: string;
}

export function VoteSuccess({ title, description }: VoteSuccessProps) {
  return (
    <section className="rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-sm">
      <h2 className="text-2xl font-black text-card-foreground sm:text-3xl">{title}</h2>
      <p className="mt-3 text-base text-muted-foreground">{description}</p>
    </section>
  );
}
