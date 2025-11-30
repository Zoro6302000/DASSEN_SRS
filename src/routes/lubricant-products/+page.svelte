<script lang="ts">
  import { mode } from "mode-watcher";
  import * as XLSX from 'xlsx';
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  
  let isDark = $derived(mode.current === "dark");

  type Product = {
    id: string;
    name: string;
    price: number;
  };

  let products = $state<Product[]>([]);
  let isLoading = $state(false);
  let message = $state("");
  let isError = $state(false);

  const showMessage = (msg: string, error: boolean) => {
    message = msg;
    isError = error;
    setTimeout(() => message = "", 3000);
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/lubricant-products');
      const result = await response.json();
      if (result.success) {
        products = result.products;
      }
    } catch (error) {
      showMessage('Error loading products', true);
    }
  };

  const handleFileUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    isLoading = true;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const productsData = jsonData.map((row: any) => ({
        name: String(row.Name || row.name || row.Product || row.product || '').trim(),
        price: parseFloat(row.Price || row.price || 0)
      })).filter(p => p.name && p.price > 0);

      if (productsData.length === 0) {
        showMessage('No valid products found in Excel file', true);
        isLoading = false;
        return;
      }

      const response = await fetch('/api/lubricant-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: productsData })
      });

      const result = await response.json();
      if (result.success) {
        showMessage(`Successfully uploaded ${productsData.length} products!`, false);
        await loadProducts();
      } else {
        showMessage('Error: ' + result.error, true);
      }
    } catch (error) {
      showMessage('Error parsing Excel file', true);
    } finally {
      isLoading = false;
      input.value = '';
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    
    try {
      const response = await fetch('/api/lubricant-products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const result = await response.json();
      if (result.success) {
        showMessage('Product deleted!', false);
        await loadProducts();
      }
    } catch (error) {
      showMessage('Error deleting product', true);
    }
  };

  $effect(() => {
    loadProducts();
  });
</script>

<div class="max-w-6xl mx-auto p-6">
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-2">Lubricant Products</h1>
    <p class="text-sm text-muted-foreground">Upload and manage lubricant products and prices</p>
  </div>

  {#if message}
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg animate-fade-in {isError ? isDark ? 'bg-red-900/90 text-red-200' : 'bg-red-100 text-red-800' : isDark ? 'bg-green-900/90 text-green-200' : 'bg-green-100 text-green-800'}">
      {message}
    </div>
  {/if}

  <Card.Root class="mb-6">
    <Card.Header class="">
      <Card.Title class="text-lg">Upload Excel File</Card.Title>
      <Card.Description class="">
        Excel file should have columns: <strong>Name</strong> and <strong>Price</strong>
      </Card.Description>
    </Card.Header>
    <Card.Content class="">
      <div class="flex items-center gap-3">
        <label class="cursor-pointer inline-block">
          <input
            type="file"
            accept=".xlsx,.xls"
            onchange={handleFileUpload}
            disabled={isLoading}
            class="hidden"
          />
          <Button class="" variant="outline" disabled={isLoading}>
            {isLoading ? 'Uploading...' : 'Choose Excel File'}
          </Button>
        </label>
        <Button
          class=""
          variant="outline"
          disabled={false}
          onclick={() => {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([
              ['Name', 'Price'],
              ['Shell Helix Ultra 5W-40', '450.00'],
              ['Mobil 1 10W-30', '380.00'],
              ['Castrol GTX 15W-40', '320.00']
            ]);
            XLSX.utils.book_append_sheet(wb, ws, 'Products');
            XLSX.writeFile(wb, 'lubricant_products_template.xlsx');
          }}
        >
          Download Template
        </Button>
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root class="">
    <Card.Header class="">
      <Card.Title class="text-lg">Products ({products.length})</Card.Title>
    </Card.Header>
    <Card.Content class="">
      {#if products.length === 0}
        <p class="text-center py-8 text-muted-foreground">No products yet. Upload an Excel file to get started.</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="px-4 py-2 text-left">#</th>
                <th class="px-4 py-2 text-left">Product Name</th>
                <th class="px-4 py-2 text-right">Price</th>
                <th class="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {#each products as product, index (product.id)}
                <tr class="border-b hover:bg-muted/50">
                  <td class="px-4 py-2">{index + 1}</td>
                  <td class="px-4 py-2">{product.name}</td>
                  <td class="px-4 py-2 text-right">₱{product.price.toFixed(2)}</td>
                  <td class="px-4 py-2 text-center">
                    <Button
                      class=""
                      variant="destructive"
                      size="sm"
                      disabled={false}
                      onclick={() => deleteProduct(product.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>

<style>
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-fade-in {
    animation: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
</style>
