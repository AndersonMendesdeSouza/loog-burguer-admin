import test from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_PRODUCTS, appendMockOrder, createMockTabs, formatDeliveryPhone, getDeliveryError, getTabItems, getTabTotals } from '../src/pages/Tables/mockTables.ts';

test('soma os pedidos da mesa e calcula o serviço apenas uma vez', () => {
  const table = createMockTabs()[0];
  assert.equal(table.orders.length, 3);
  assert.deepEqual(getTabTotals(table), {
    subtotalInCents: 7800,
    serviceFeeInCents: 780,
    totalInCents: 8580,
  });
});

test('adiciona um pedido e agrupa produtos sem modificar o histórico anterior', () => {
  const table = createMockTabs()[0];
  const coke = MOCK_PRODUCTS.find((product) => product.id === 'coke');
  const addedItems = [{ ...coke, quantity: 1 }];
  const updated = appendMockOrder(table, addedItems);
  assert.equal(updated.orders.length, 4);
  assert.equal(table.orders.length, 3);
  assert.equal(getTabItems(updated).find((item) => item.id === 'coke').quantity, 3);
  assert.equal(getTabItems(table).find((item) => item.id === 'coke').quantity, 2);
  assert.equal(getTabTotals(updated).totalInCents, 9130);
  addedItems[0].quantity = 10;
  assert.equal(updated.orders[3].items[0].quantity, 1);
});

test('mantém separados produtos com preços diferentes no histórico', () => {
  const table = createMockTabs()[0];
  const coke = MOCK_PRODUCTS.find((product) => product.id === 'coke');
  const updated = appendMockOrder(table, [{ ...coke, priceInCents: 600, quantity: 1 }]);
  assert.equal(getTabItems(updated).filter((item) => item.id === 'coke').length, 2);
  assert.equal(getTabTotals(updated).subtotalInCents, 8400);
});

test('balcão e delivery não recebem taxa de serviço da mesa', () => {
  const table = createMockTabs()[0];
  for (const type of ['pickup', 'delivery']) {
    assert.deepEqual(getTabTotals({ ...table, type, tableNumber: undefined }), {
      subtotalInCents: 7800,
      serviceFeeInCents: 0,
      totalInCents: 7800,
    });
  }
});

test('não adiciona pedidos vazios ou itens a comandas finalizadas', () => {
  const table = createMockTabs()[0];
  const closed = { ...table, closedAt: new Date().toISOString() };
  assert.equal(appendMockOrder(table, []), table);
  assert.equal(appendMockOrder(closed, [{ ...MOCK_PRODUCTS[0], quantity: 1 }]), closed);
});

test('cada demonstração começa com dados independentes', () => {
  const first = createMockTabs();
  first[0].orders[0].items[0].quantity = 20;
  first[0].notes = 'Alteração local';
  const second = createMockTabs();
  assert.equal(second[0].orders[0].items[0].quantity, 1);
  assert.equal(getTabTotals(second[0]).totalInCents, 8580);
  assert.notEqual(second[0].notes, first[0].notes);
});

function deliveryDetails() {
  return {
    type: 'delivery',
    customerName: 'Cliente de teste',
    customerPhone: '64999999687',
    deliveryAddress: {
      street: 'Rua das Flores', number: '120', block: '12', neighborhood: 'Centro',
      city: 'Rio Verde', state: 'GO', zipCode: '75900-000', complement: '', reference: '',
    },
  };
}

test('delivery exige destinatário, telefone e endereço completo', () => {
  const details = deliveryDetails();
  assert.equal(getDeliveryError(details), '');
  assert.notEqual(getDeliveryError({ ...details, customerName: '   ' }), '');
  assert.notEqual(getDeliveryError({ ...details, customerPhone: '999' }), '');
  assert.notEqual(getDeliveryError({ ...details, deliveryAddress: undefined }), '');
  for (const field of ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode']) {
    assert.notEqual(getDeliveryError({ ...details, deliveryAddress: { ...details.deliveryAddress, [field]: ' ' } }), '', field);
  }
  assert.notEqual(getDeliveryError({ ...details, deliveryAddress: { ...details.deliveryAddress, state: '1A' } }), '');
  assert.notEqual(getDeliveryError({ ...details, deliveryAddress: { ...details.deliveryAddress, zipCode: '75900' } }), '');
});

test('quadra, complemento e referência são opcionais; mesa e balcão não exigem endereço', () => {
  const details = deliveryDetails();
  assert.equal(getDeliveryError({ ...details, deliveryAddress: { ...details.deliveryAddress, block: '', complement: '', reference: '' } }), '');
  assert.equal(getDeliveryError({ type: 'table', tableNumber: 1, customerName: '' }), '');
  assert.equal(getDeliveryError({ type: 'pickup', customerName: '' }), '');
});

test('telefone é exibido com DDD para celular e telefone fixo', () => {
  assert.equal(formatDeliveryPhone('64999999687'), '(64) 99999-9687');
  assert.equal(formatDeliveryPhone('6433334444'), '(64) 3333-4444');
  assert.equal(formatDeliveryPhone('64'), '64');
});

test('adicionar novos itens preserva os dados de entrega da comanda', () => {
  const details = deliveryDetails();
  const tab = { ...createMockTabs()[0], ...details, tableNumber: undefined };
  const updated = appendMockOrder(tab, [{ ...MOCK_PRODUCTS[0], quantity: 1 }]);
  assert.deepEqual(updated.deliveryAddress, details.deliveryAddress);
  assert.equal(updated.customerPhone, details.customerPhone);
  assert.equal(updated.customerName, details.customerName);
});
