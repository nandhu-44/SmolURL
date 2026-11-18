import { Wordmark } from "@/components/Logo";

/** Shown instantly while the settings page is being fetched, so a click never looks like it did nothing. */
function Row({ fields }: { fields: number }) {
  return (
    <div className="grid gap-x-10 gap-y-4 border-t border-border py-8 first:border-t-0 first:pt-2 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-3 w-48 max-w-full rounded bg-muted/70" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: fields }, (_, i) => <div key={i} className="h-9 rounded-md bg-muted/70" />)}
        <div className="h-9 w-28 rounded-md bg-muted" />
      </div>
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6"><Wordmark /></div>
      </header>
      <main aria-busy="true" aria-label="Loading settings" className="mx-auto max-w-5xl animate-soft-pulse px-4 pb-24 pt-8 sm:px-6">
        <h1 className="heading text-2xl">Settings</h1>
        <div className="mt-2 h-3 w-64 rounded bg-muted/70" />
        <div className="mt-6">
          <Row fields={2} />
          <Row fields={3} />
          <Row fields={1} />
          <Row fields={2} />
        </div>
      </main>
    </>
  );
}
