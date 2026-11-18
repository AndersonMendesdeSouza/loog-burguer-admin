import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('services de mesas e comandas seguem os contratos da API', async (t) => {
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    configFile: false,
    server: { middlewareMode: true, hmr: false },
    logLevel: 'silent',
  });
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key) => key === 'token' ? 'test-token' : null },
  });

  try {
    const { default: api } = await server.ssrLoadModule('/src/service/api.ts');
    const { TableService } = await server.ssrLoadModule('/src/service/table.service.ts');
    const { TabService } = await server.ssrLoadModule('/src/service/tab.service.ts');
    const { OrderService } = await server.ssrLoadModule('/src/service/order.service.ts');
    const table = { id: 'table-id', number: 1, isActive: true };
    const tab = {
      id: 'tab-id', table, status: 'OPEN', orders: [],
      subtotal: '0.00', total: '0.00', openedAt: '2026-11-18T12:00:00.000Z',
      closedAt: null, closingTotal: null, paymentMethod: null,
    };
    const items = [{ productId: 'product-id', quantity: 2 }];
    const removed = { message: 'Mesa removida com sucesso' };
    let request;
    let responseData;
    let requestError;

    // Todas as requisições ficam em memória, sem acessar a API configurada.
    api.defaults.adapter = async (config) => {
      request = config;
      if (requestError) throw requestError;
      return { data: responseData, status: 200, statusText: 'OK', headers: {}, config };
    };

    const cases = [
      ['criar mesa', () => TableService.create({ number: 1 }), 'post', '/tables', { number: 1 }, table],
      ['listar mesas', () => TableService.findAll(), 'get', '/tables/find-all', undefined, [table]],
      ['consultar mesa', () => TableService.findOne(table.id), 'get', '/tables/table-id', undefined, table],
      ['atualizar mesa', () => TableService.update(table.id, { number: 1, isActive: false }), 'put', '/tables/table-id', { number: 1, isActive: false }, { ...table, isActive: false }],
      ['remover mesa', () => TableService.remove(table.id), 'delete', '/tables/table-id', undefined, removed],
      ['criar comanda', () => TabService.create({ tableId: table.id }), 'post', '/tabs', { tableId: table.id }, tab],
      ['criar pedido na mesa', () => TabService.createOrder({ tableId: table.id, items }), 'post', '/tabs/orders', { tableId: table.id, items }, tab],
      ['adicionar pedido', () => TabService.addOrder(tab.id, { items }), 'post', '/tabs/tab-id/orders', { items }, tab],
      ['listar comandas', () => TabService.findAll(), 'get', '/tabs/find-all', undefined, [tab]],
      ['consultar comanda', () => TabService.findOne(tab.id), 'get', '/tabs/tab-id', undefined, tab],
      ['fechar comanda', () => TabService.update(tab.id, { status: 'CLOSED' }), 'patch', '/tabs/tab-id', { status: 'CLOSED' }, { ...tab, status: 'CLOSED' }],
      ['cancelar comanda', () => TabService.update(tab.id, { status: 'CANCELLED' }), 'patch', '/tabs/tab-id', { status: 'CANCELLED' }, { ...tab, status: 'CANCELLED' }],
      ['excluir comanda', () => TabService.remove(tab.id), 'delete', '/tabs/tab-id', undefined, { message: 'Comanda excluída com sucesso' }],
      ['criar retirada', () => OrderService.createAdmin({ type: 'PICKUP', items }), 'post', '/orders/admin', { type: 'PICKUP', items }, { id: 'order-id', userId: null, type: 'PICKUP' }],
    ];

    for (const [name, call, method, url, body, result] of cases) {
      await t.test(name, async () => {
        responseData = result;
        assert.deepEqual(await call(), result);
        assert.equal(request.method, method);
        assert.equal(request.url, url);
        assert.deepEqual(request.data ? JSON.parse(request.data) : undefined, body);
        assert.equal(request.headers.Authorization, 'Bearer test-token');
      });
    }

    await t.test('preserva erros da API para a tela tratar', async () => {
      requestError = new Error('Já existe uma comanda aberta nesta mesa');
      requestError.response = { status: 409 };
      await assert.rejects(TabService.create({ tableId: table.id }), (error) => error === requestError);
      await assert.rejects(TableService.remove(table.id), (error) => error === requestError);
    });
  } finally {
    await server.close();
    if (originalStorage) {
      Object.defineProperty(globalThis, 'localStorage', originalStorage);
    } else {
      delete globalThis.localStorage;
    }
  }
});
