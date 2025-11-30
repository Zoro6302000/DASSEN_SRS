<script lang="ts">
  import type { Snippet } from "svelte";
  import { page } from "$app/stores";
  import { ModeWatcher, mode, toggleMode } from "mode-watcher";
  import "./layout.css";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  const navItems = [
    { label: "DASH BOARD", href: "/" },
    { label: "DAILY SALES", href: "/daily-sales" },
    { label: "LUBRICANT PRODUCTS", href: "/lubricant-products" },
    { label: "MONTHLY SALES", href: "/monthly-sales" },
    { label: "ACCOUNTS", href: "/accounts" },
    { label: "SOA", href: "/soa" }
  ] as const;

  let startDate = $state("2025-10-01");
  let endDate = $state("2025-11-25");
  let isSidebarCollapsed = $state(false);
  
  let isDarkMode = $derived(mode.current === "dark");

  const formatDate = (value: string): string => {
    if (!value) return "";
    const date = new Date(value);
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    return formatter.format(date);
  };

  let dateRange = $derived(
    startDate && endDate
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : ""
  );
</script>

<ModeWatcher defaultMode="dark" />

<div class="min-h-screen flex flex-col {isDarkMode ? 'bg-[#1a1a1a]' : 'bg-gray-100'}">
  <!-- Top bar -->
  <header class="flex items-center justify-between border-b px-6 py-3 {isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-300'}">
    <h1 class="text-base font-bold {isDarkMode ? 'text-white' : 'text-gray-900'}">
      SRS Report – Dassen Gasoline Station
    </h1>
    <div class="flex items-center gap-4 text-xs">
      <span class="font-medium {isDarkMode ? 'text-gray-300' : 'text-gray-700'}">
        {dateRange || "Select date range"}
      </span>

      <div class="flex items-center gap-2">
        <input
          type="date"
          bind:value={startDate}
          class="border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 {isDarkMode ? 'border-gray-700 bg-[#2a2a2a] text-white focus:ring-gray-600' : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'}"
        />
        <span class="{isDarkMode ? 'text-gray-400' : 'text-gray-600'}">to</span>
        <input
          type="date"
          bind:value={endDate}
          class="border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 {isDarkMode ? 'border-gray-700 bg-[#2a2a2a] text-white focus:ring-gray-600' : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500'}"
        />
      </div>

      <button
        onclick={toggleMode}
        class="p-2 rounded-md border transition-colors {isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}"
        title="Toggle theme"
      >
        {#if isDarkMode}
          <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        {:else}
          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        {/if}
      </button>
    </div>
  </header>

  <!-- Main area -->
  <main class="flex flex-1 overflow-hidden">
    <!-- Left sidebar -->
    <aside class="{isSidebarCollapsed ? 'w-12' : 'w-64'} border-r {isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-300'} transition-all duration-300 relative">
      {#if !isSidebarCollapsed}
      <button
        onclick={() => isSidebarCollapsed = true}
        class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-xs transition-colors {isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}"
        title="Collapse sidebar"
      >
        ←
      </button>
      <nav class="p-4 space-y-1">
        {#each navItems as item}
          <a
            href={item.href}
            class={`block w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              $page.url.pathname === item.href
                ? isDarkMode ? "bg-gray-800 text-white" : "bg-blue-600 text-white"
                : isDarkMode ? "text-gray-400 hover:bg-gray-900" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </a>
        {/each}
      </nav>
      {:else}
      <button
        onclick={() => isSidebarCollapsed = false}
        class="w-full h-12 flex items-center justify-center text-sm transition-colors {isDarkMode ? 'text-gray-400 hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-100'}"
        title="Expand sidebar"
      >
        →
      </button>
      {/if}
    </aside>

    <!-- Page content -->
    <section class="flex-1 overflow-auto {isDarkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'}">
      <div class="p-6">
        {@render children()}
      </div>
    </section>
  </main>
</div>