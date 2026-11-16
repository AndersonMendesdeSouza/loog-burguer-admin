import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrencyInput, currencyToInput, parseCurrencyInput } from '../src/utils/currency.ts';

test('digitação sequencial desloca os centavos', () => {
  let value = '';
  const expected = ['0,03', '0,35', '3,50', '35,00'];
  for (const [index, digit] of [...'3500'].entries()) {
    value = formatCurrencyInput(value + digit);
    assert.equal(value, expected[index]);
  }
});

test('aceita zero e mantém campos opcionais vazios', () => {
  assert.equal(formatCurrencyInput('0000'), '0,00');
  assert.equal(formatCurrencyInput(''), '');
  assert.equal(currencyToInput(null), '');
  assert.equal(currencyToInput(undefined), '');
  assert.equal(currencyToInput(0), '0,00');
});

test('formata colagem com milhares e símbolo de moeda', () => {
  assert.equal(formatCurrencyInput('R$ 1.234,56'), '1.234,56');
  assert.equal(parseCurrencyInput('1.234,56'), 1234.56);
});

test('backspace e limpeza mantêm os centavos consistentes', () => {
  assert.equal(formatCurrencyInput('35,00'.slice(0, -1)), '3,50');
  assert.equal(formatCurrencyInput('3,50'.slice(0, -1)), '0,35');
  assert.equal(formatCurrencyInput('0,00'.slice(0, -1)), '0,00');
  assert.equal(formatCurrencyInput(''), '');
});

test('carrega preços da API sem multiplicar ou dividir o valor', () => {
  for (const value of [35, 35.9, 0.01, 1000.5, '35.90', '1000.50']) {
    assert.equal(parseCurrencyInput(currencyToInput(value)), Number(value));
  }
  assert.equal(currencyToInput('1.000,50'), '1.000,50');
});

test('rejeita valores inválidos, negativos e acima da precisão segura', () => {
  for (const value of ['', 'abc', '-35,00', '1,234', '1,2,3', '99999999999999999999,00']) {
    assert.equal(Number.isNaN(parseCurrencyInput(value)), true);
  }
  assert.equal(formatCurrencyInput('-35,00'), '');
  assert.equal(currencyToInput('inválido'), '');
});
