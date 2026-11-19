import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Hamburger, Printer, Trash2 } from "lucide-react";
import TableDialog from "./TableDialog";
import {
  formatMoney,
  getTabItems,
  getTabLabel,
  getTabTotals,
  type MockTab,
} from "./mockTables";
import styles from "./Tables.module.css";

type Props = {
  tab: MockTab;
  finalizing: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function FinalizeTabModal({
  tab,
  finalizing,
  error,
  onClose,
  onConfirm,
}: Props) {
  const items = getTabItems(tab);
  const totals = getTabTotals(tab);
  const [issuedAt] = useState(() => new Date());
  const receiptRef = useRef<HTMLDivElement>(null);
  const printStyleRef = useRef<HTMLStyleElement>(null);
  const receiptId = tab.id.slice(0, 8).toUpperCase();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const receipt = receiptRef.current;
    const printStyle = printStyleRef.current;
    if (!receipt || !printStyle) return;

    function updatePaperSize() {
      if (!receipt || !printStyle) return;
      // Converte a altura do cupom de pixels para milímetros, sem uma folha A4 fixa.
      const heightInMm =
        Math.ceil((receipt.getBoundingClientRect().height * 25.4) / 96) + 2;
      printStyle.textContent = `@media print { @page { size: 80mm ${heightInMm}mm; margin: 0; } }`;
    }

    updatePaperSize();
    const observer = new ResizeObserver(updatePaperSize);
    observer.observe(receipt);
    window.addEventListener("beforeprint", updatePaperSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", updatePaperSize);
    };
  }, []);

  return (
    <TableDialog
      title="Deseja finalizar a comanda?"
      description="Confira os itens e imprima o resumo antes de finalizar."
      icon={<AlertTriangle />}
      onClose={onClose}
      busy={finalizing}
      className={styles.receiptDialog}
      wide
    >
      <style ref={printStyleRef} />
      <div className={styles.receipt}>
        <h3>Burguer · Resumo da comanda</h3>
        <p>{getTabLabel(tab)}</p>
        <p className={styles.receiptInfo}>
          Aberta em {new Date(tab.openedAt).toLocaleString("pt-BR")}
        </p>
        <table className={styles.receiptTable}>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd.</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.id}-${item.priceInCents}`}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.priceInCents * item.quantity)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3}>Nenhum item nesta comanda.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className={styles.totals}>
          <div>
            <span>Subtotal</span>
            <span>{formatMoney(totals.subtotalInCents)}</span>
          </div>
          {totals.serviceFeeInCents > 0 && (
            <div>
              <span>Taxas</span>
              <span>{formatMoney(totals.serviceFeeInCents)}</span>
            </div>
          )}
          <div className={styles.grandTotal}>
            <strong>Total da comanda</strong>
            <strong>{formatMoney(totals.totalInCents)}</strong>
          </div>
        </div>
        <p className={styles.receiptInfo}>
          Resumo de consumo · Não é comprovante de pagamento.
        </p>
      </div>
      <div ref={receiptRef} className={styles.printReceipt} aria-hidden="true">
        <header className={styles.printBrand}>
          <Hamburger size={30} strokeWidth={1.7} aria-hidden="true" />
          <h3>BURGUER</h3>
          <p>HAMBURGUERIA</p>
        </header>
        <div className={styles.printHeading}>
          <p>RESUMO DE CONSUMO</p>
          <strong>{getTabLabel(tab)}</strong>
        </div>
        <dl className={styles.printMeta}>
          <div>
            <dt>Comanda</dt>
            <dd>#{receiptId}</dd>
          </div>
          <div>
            <dt>Abertura</dt>
            <dd>
              {new Date(tab.openedAt).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </dd>
          </div>
          <div>
            <dt>Emissão</dt>
            <dd>
              {issuedAt.toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </dd>
          </div>
        </dl>
        <table className={styles.printTable}>
          <caption>ITENS DA COMANDA</caption>
          <thead>
            <tr>
              <th>QTD. x UNIT.</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          {items.map((item, index) => (
            <tbody key={`${item.id}-${item.priceInCents}`}>
              <tr className={styles.printItemName}>
                <td colSpan={2}>
                  {String(index + 1).padStart(2, "0")} · {item.name}
                </td>
              </tr>
              <tr>
                <td>
                  {item.quantity} x {formatMoney(item.priceInCents)}
                </td>
                <td>{formatMoney(item.priceInCents * item.quantity)}</td>
              </tr>
            </tbody>
          ))}
          {items.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={2}>Nenhum item nesta comanda.</td>
              </tr>
            </tbody>
          )}
        </table>
        <div className={styles.printTotals}>
          <div>
            <span>Quantidade de itens</span>
            <span>{itemCount}</span>
          </div>
          <div>
            <span>Subtotal</span>
            <span>{formatMoney(totals.subtotalInCents)}</span>
          </div>
          {totals.serviceFeeInCents > 0 && (
            <div>
              <span>Taxas</span>
              <span>{formatMoney(totals.serviceFeeInCents)}</span>
            </div>
          )}
          <div className={styles.printGrandTotal}>
            <strong>TOTAL</strong>
            <strong>{formatMoney(totals.totalInCents)}</strong>
          </div>
        </div>
        {tab.notes.trim() && (
          <div className={styles.printNotes}>
            <strong>Observações</strong>
            <p>{tab.notes}</p>
          </div>
        )}
        <footer className={styles.printFooter}>
          <strong>Obrigado pela preferência!</strong>
          <p>Feito com carinho. Volte sempre!</p>
          <p className={styles.printInfo}>
            Resumo de consumo.
            <br />
            Não é comprovante de pagamento.
          </p>
        </footer>
      </div>
      <div className={styles.deleteNotice} role="note">
        <AlertTriangle size={20} />
        <div>
          <strong>
            {tab.apiTab
              ? "Ao finalizar, esta comanda será excluída permanentemente."
              : "Esta é uma comanda de demonstração."}
          </strong>
          <p>
            {tab.apiTab
              ? "Os pedidos serão mantidos no histórico. A mesa ficará livre. Imprima o resumo antes de confirmar."
              : "A finalização será simulada apenas nesta tela."}
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.dialogFooter}>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={finalizing}
          onClick={onClose}
        >
          Voltar
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={finalizing}
          onClick={() => window.print()}
        >
          <Printer size={17} /> Imprimir
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={finalizing}
          onClick={onConfirm}
        >
          {finalizing ? (
            "Finalizando..."
          ) : (
            <>
              <Trash2 size={17} /> Finalizar
            </>
          )}
        </button>
      </div>
    </TableDialog>
  );
}
