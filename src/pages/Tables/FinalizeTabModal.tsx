import { AlertTriangle, Printer, Trash2 } from "lucide-react";
import TableDialog from "./TableDialog";
import { formatMoney, getTabItems, getTabLabel, getTabTotals, type MockTab } from "./mockTables";
import styles from "./Tables.module.css";

type Props = {
  tab: MockTab;
  finalizing: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function FinalizeTabModal({ tab, finalizing, error, onClose, onConfirm }: Props) {
  const items = getTabItems(tab);
  const totals = getTabTotals(tab);

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
      <div className={styles.receipt}>
        <h3>Burguer · Resumo da comanda</h3>
        <p>{getTabLabel(tab)}</p>
        <p className={styles.receiptInfo}>Aberta em {new Date(tab.openedAt).toLocaleString("pt-BR")}</p>
        <table className={styles.receiptTable}>
          <thead><tr><th>Produto</th><th>Qtd.</th><th>Valor</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.id}-${item.priceInCents}`}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.priceInCents * item.quantity)}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3}>Nenhum item nesta comanda.</td></tr>}
          </tbody>
        </table>
        <div className={styles.totals}>
          <div><span>Subtotal</span><span>{formatMoney(totals.subtotalInCents)}</span></div>
          {totals.serviceFeeInCents > 0 && <div><span>Taxas</span><span>{formatMoney(totals.serviceFeeInCents)}</span></div>}
          <div className={styles.grandTotal}><strong>Total da comanda</strong><strong>{formatMoney(totals.totalInCents)}</strong></div>
        </div>
        <p className={styles.receiptInfo}>Resumo de consumo · Não é comprovante de pagamento.</p>
      </div>
      <div className={styles.deleteNotice} role="note">
        <AlertTriangle size={20} />
        <div>
          <strong>{tab.apiTab ? "Ao finalizar, esta comanda será excluída permanentemente." : "Esta é uma comanda de demonstração."}</strong>
          <p>{tab.apiTab ? "Os pedidos serão mantidos no histórico. A mesa ficará livre. Imprima o resumo antes de confirmar." : "A finalização será simulada apenas nesta tela."}</p>
        </div>
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.dialogFooter}>
        <button type="button" className={styles.secondaryButton} disabled={finalizing} onClick={onClose}>Voltar</button>
        <button type="button" className={styles.secondaryButton} disabled={finalizing} onClick={() => window.print()}><Printer size={17} /> Imprimir</button>
        <button type="button" className={styles.primaryButton} disabled={finalizing} onClick={onConfirm}>{finalizing ? "Finalizando..." : <><Trash2 size={17} /> Finalizar</>}</button>
      </div>
    </TableDialog>
  );
}
