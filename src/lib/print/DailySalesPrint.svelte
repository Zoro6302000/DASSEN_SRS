<script lang="ts">
  import type { Denomination } from '../types';

  interface Props {
    salesDate: string;
    shift: string;
    cashier: string;
    dailyRows: Array<{
      product: string;
      opening: number;
      closing: number;
      openingPeso: number;
      closingPeso: number;
    }>;
    denominations: Denomination[];
    coinsAmount: number;
    checkPayment: number;
    bankTransfer: number;
    totalSales: number;
    totalLubricants: number;
    totalExpenses: number;
    cashOnHand: number;
    actualCash: number;
    cashVariance: number;
  }

  let { 
    salesDate, 
    shift, 
    cashier, 
    dailyRows, 
    denominations, 
    coinsAmount, 
    checkPayment, 
    bankTransfer,
    totalSales,
    totalLubricants,
    totalExpenses,
    cashOnHand,
    actualCash,
    cashVariance
  }: Props = $props();

  const formatPrintDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const weekday = d.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
      const date = d.toLocaleDateString();
      return `${date} - ${weekday}`;
    } catch {
      return iso;
    }
  };

  const formatPeso = (amount: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
</script>

<div id="print-layout">
  <div style="font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; padding: 20px;">
    <!-- Header -->
    <div style="margin-bottom: 20px;">
      <div style="margin-bottom: 4px; font-weight: bold;">DATE AND DAY</div>
      <div style="margin-bottom: 8px;">{formatPrintDate(salesDate)}</div>
      <div style="margin-bottom: 4px; font-weight: bold;">SHIFT</div>
      <div style="margin-bottom: 8px;">{shift.toUpperCase()}</div>
      <div style="margin-bottom: 4px; font-weight: bold;">CASHIER ON DUTY</div>
      <div>{cashier.toUpperCase()}</div>
    </div>

    <!-- Pumps Table -->
    <div style="margin-bottom: 30px;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #000;"></th>
            <th style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #000;"></th>
            <th style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #000;">OPENING</th>
            <th style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #000;">CLOSING</th>
            <th style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #000;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {#each dailyRows as row, index}
            {@const volume = row.closing - row.opening}
            {@const sales = row.closingPeso - row.openingPeso}
            <tr>
              <td style="padding: 2px 8px; font-weight: bold;">PUMP {index + 1}</td>
              <td style="padding: 2px 8px;">LITER</td>
              <td style="padding: 2px 8px;">{row.opening || '-'}</td>
              <td style="padding: 2px 8px;">{row.closing || '-'}</td>
              <td style="padding: 2px 8px;">{volume > 0 ? volume.toFixed(2) : '-'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 8px; padding-bottom: 8px;">{row.product.toUpperCase()}</td>
              <td style="padding: 2px 8px; padding-bottom: 8px;">PESO</td>
              <td style="padding: 2px 8px; padding-bottom: 8px;">{row.openingPeso || '-'}</td>
              <td style="padding: 2px 8px; padding-bottom: 8px;">{row.closingPeso || '-'}</td>
              <td style="padding: 2px 8px; padding-bottom: 8px;">{sales > 0 ? formatPeso(sales) : '-'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Summary and Cash Count (Two Columns) -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px;">
      <!-- Left: Summary -->
      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>TOTAL SALES</span>
          <span style="text-align: right; min-width: 90px;">{formatPeso(totalSales)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>TOTAL LUBRICANTS</span>
          <span style="text-align: right; min-width: 90px;">{formatPeso(totalLubricants)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>TOTAL EXPENSES</span>
          <span style="text-align: right; min-width: 90px;">{formatPeso(totalExpenses)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>EXPECTED CASH ON HAND</span>
          <span style="text-align: right; min-width: 90px;">{formatPeso(cashOnHand)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>ACTUAL CASH COUNT</span>
          <span style="text-align: right; min-width: 90px;">{formatPeso(actualCash)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>SHORT/OVER</span>
          <span style="text-align: right; min-width: 90px;">{formatPeso(cashVariance)}</span>
        </div>
      </div>

      <!-- Right: Cash Count -->
      <div>
        <div style="font-weight: bold; margin-bottom: 8px;">ACTUAL CASH COUNT</div>
        {#each denominations as denom}
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>{denom.label}</span>
            <span>{formatPeso(denom.value * denom.count)}</span>
          </div>
        {/each}
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px; margin-top: 8px;">
          <span>COINS</span>
          <span>{formatPeso(coinsAmount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>CHECK PAYMENT</span>
          <span>{formatPeso(checkPayment)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>BANK TRANSFER</span>
          <span>{formatPeso(bankTransfer)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 12px; padding-top: 8px; border-top: 1px solid #000;">
          <span>TOTAL CASH COUNT</span>
          <span>{formatPeso(actualCash)}</span>
        </div>
      </div>
    </div>

    <!-- Received By Section -->
    <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #000;">
      <div style="font-weight: bold; font-size: 11px; margin-bottom: 10px;">RECEIVED BY:</div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 9px; margin-bottom: 4px;">Name:</div>
        <div style="border-bottom: 1px solid #000; height: 18px;"></div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 9px; margin-bottom: 4px;">Actual Cash Received:</div>
        <div style="border-bottom: 1px solid #000; height: 18px;"></div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 9px; margin-bottom: 4px;">Signature:</div>
        <div style="border-bottom: 1px solid #000; height: 24px;"></div>
      </div>
    </div>
  </div>
</div>

<style>
  #print-layout {
    display: none;
  }
</style>
