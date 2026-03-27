import { useState } from "react";
import { Button } from "@origin/react";

export default function App() {
  const [dark, setDark] = useState(false);

  function toggleTheme() {
    setDark((d) => !d);
    document.documentElement.classList.toggle("dark");
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-heading-lg font-bold">
            Origin Sandbox
          </h1>
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {dark ? "Light mode" : "Dark mode"}
          </Button>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-heading-xs font-semibold">
            Button
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="md" onClick={() => alert("Button clicked!")}>Click me</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm">Primary sm</Button>
            <Button variant="primary" size="md">Primary md</Button>
            <Button variant="primary" size="lg">Primary lg</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm">Secondary sm</Button>
            <Button variant="secondary" size="md">Secondary md</Button>
            <Button variant="secondary" size="lg">Secondary lg</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm">Ghost sm</Button>
            <Button variant="ghost" size="md">Ghost md</Button>
            <Button variant="ghost" size="lg">Ghost lg</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="md" disabled>Disabled</Button>
            <Button variant="primary" size="md" loading>Loading…</Button>
          </div>
        </section>

      </div>
    </div>


  );
}
