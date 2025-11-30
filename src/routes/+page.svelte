<script lang="ts">
  import { mode } from "mode-watcher";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  
  let isDark = $derived(mode.current === "dark");
</script>

<div class="max-w-4xl mx-auto">
  <h2 class="text-2xl font-bold mb-6">Dashboard</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <Card.Root class="">
      <Card.Content class="pt-6">
        <div class="text-sm mb-1 text-muted-foreground">Total Sales</div>
        <div class="text-3xl font-bold">₱0.00</div>
      </Card.Content>
    </Card.Root>
    
    <Card.Root class="">
      <Card.Content class="pt-6">
        <div class="text-sm mb-1 text-muted-foreground">Total Volume</div>
        <div class="text-3xl font-bold">0.00 L</div>
      </Card.Content>
    </Card.Root>
    
    <Card.Root class="">
      <Card.Content class="pt-6">
        <div class="text-sm mb-1 text-muted-foreground">Transactions</div>
        <div class="text-3xl font-bold">0</div>
      </Card.Content>
    </Card.Root>
  </div>

  <Card.Root class="">
    <Card.Header class="">
      <Card.Title class="text-lg">Quick Actions</Card.Title>
    </Card.Header>
    <Card.Content class="">
      <div class="space-y-3">
        <a href="/daily-sales" class="block">
          <Button class="w-full" variant="outline" disabled={false}>
            Enter Daily Sales
          </Button>
        </a>
        <a href="/monthly-sales" class="block">
          <Button class="w-full" variant="outline" disabled={false}>
            View Monthly Report
          </Button>
        </a>
      </div>
    </Card.Content>
  </Card.Root>
</div>
