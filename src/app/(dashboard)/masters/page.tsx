export default function MastersPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-text-primary">Masters</h1>
      <p className="text-sm text-text-secondary max-w-prose">
        Engine types, work centers (MWC), UIC teams, and user management land here in a
        later phase. For now these are maintained as free text on orders and shift
        entries.
      </p>
    </div>
  );
}
