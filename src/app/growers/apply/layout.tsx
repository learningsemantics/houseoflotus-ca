export default function GrowerApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
