import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('exibição das comandas preserva os dados da API', async (t) => {
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    configFile: false,
    server: { middlewareMode: true, hmr: false },
    logLevel: 'silent',
  });
  try {
    const { toTableTab } = await server.ssrLoadModule('/src/pages/Tables/tableTabs.ts');
    const { getTabItems, getTabTotals } = await server.ssrLoadModule('/src/pages/Tables/mockTables.ts');
    const order = {
      id: 'order-id', status: 'RECEIVED', createdAt: '2026-11-18T12:00:00Z',
      items: [{ id: 'product-id', productId: 'product-id', name: 'Produto salvo', quantity: 2, unitPrice: 25.50, imageUrl: '/produto.png' }],
    };
    const response = {
      id: 'tab-id', table: { id: 'table-id', number: 17, isActive: true },
      status: 'OPEN', orders: [order], openedAt: '2026-11-18T12:00:00Z',
      closedAt: null, subtotal: '51.00', total: '49.00', paymentMethod: null,
    };

    await t.test('usa IDs, quantidades, preços e imagem do pedido salvo', () => {
      const tab = toTableTab(response);
      assert.equal(tab.id, 'tab-id');
      assert.equal(tab.apiTab.table.id, 'table-id');
      assert.equal(tab.tableNumber, 17);
      assert.equal(tab.orders[0].id, 'order-id');
      assert.equal(getTabItems(tab)[0].id, 'product-id');
      assert.equal(getTabItems(tab)[0].quantity, 2);
      assert.equal(getTabItems(tab)[0].priceInCents, 2550);
      assert.equal(getTabItems(tab)[0].image, '/produto.png');
    });

    await t.test('exibe total do servidor sem adicionar taxa simulada', () => {
      assert.deepEqual(getTabTotals(toTableTab(response)), {
        subtotalInCents: 5100, totalInCents: 4900, serviceFeeInCents: 0,
      });
    });

    await t.test('mantém pedidos cancelados no histórico e fora do resumo', () => {
      const tab = toTableTab({ ...response, orders: [order, { ...order, id: 'cancelled-order', status: 'CANCELED' }] });
      assert.equal(tab.orders.length, 2);
      assert.equal(tab.orders[1].cancelled, true);
      assert.equal(getTabItems(tab)[0].quantity, 2);
    });

    await t.test('reconhece comandas abertas, fechadas e canceladas', () => {
      assert.equal(toTableTab(response).closedAt, undefined);
      for (const status of ['CLOSED', 'CANCELLED']) {
        assert.ok(toTableTab({ ...response, status }).closedAt);
      }
    });
  } finally {
    await server.close();
  }
});
