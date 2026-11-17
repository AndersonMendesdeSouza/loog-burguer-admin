import { useId, useState } from "react";
import { ClipboardList, CreditCard, History, MapPin, MessageSquare, Plus } from "lucide-react";
import { MdOutlineTableRestaurant } from "react-icons/md";
import TableDialog from "./TableDialog";
import ProductThumbnail from "./ProductThumbnail";
import { formatDeliveryPhone, formatMoney, getTabItems, getTabLabel, getTabTotals, ORDER_TYPE_LABELS, type MockTab } from "./mockTables";
import styles from "./Tables.module.css";

type Props = {
  tab: MockTab;
  onClose: () => void;
  onAddItems: () => void;
  onFinalize: () => void;
  onNotesChange: (notes: string) => void;
};

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function TabDetailsModal({ tab, onClose, onAddItems, onFinalize, onNotesChange }: Props) {
  const [section, setSection] = useState<"summary" | "history" | "notes">("summary");
  const noteId = useId();
  const items = getTabItems(tab);
  const totals = getTabTotals(tab);
  const finalized = Boolean(tab.closedAt);

  return (
    <TableDialog
      title={getTabLabel(tab)}
      description={`${tab.orders.length} ${tab.orders.length === 1 ? "pedido" : "pedidos"} · Iniciada às ${formatTime(tab.openedAt)}`}
      icon={<MdOutlineTableRestaurant />}
      onClose={onClose}
      wide
    >
      <div className={styles.tabMeta}>
        <span className={`${styles.statusBadge} ${finalized ? styles.free : styles.occupied}`}>{finalized ? "Finalizada" : "Em aberto"}</span>
        <span>{ORDER_TYPE_LABELS[tab.type]}</span>
        <span className={styles.demoLabel}>Comanda de demonstração</span>
      </div>
      <div className={styles.categoryTabs} aria-label="Informações da comanda">
        <button type="button" className={section === "summary" ? styles.categoryActive : styles.categoryButton} aria-pressed={section === "summary"} onClick={() => setSection("summary")}><ClipboardList size={18} /> Comanda</button>
        <button type="button" className={section === "history" ? styles.categoryActive : styles.categoryButton} aria-pressed={section === "history"} onClick={() => setSection("history")}><History size={18} /> Pedidos ({tab.orders.length})</button>
        <button type="button" className={section === "notes" ? styles.categoryActive : styles.categoryButton} aria-pressed={section === "notes"} onClick={() => setSection("notes")}><MessageSquare size={18} /> Observações</button>
      </div>

      {section === "summary" && (
        <div className={styles.detailsBody}>
          <div className={styles.sectionHeading}>
            <h3>Itens {tab.type === "table" ? "da mesa" : "da comanda"}</h3>
            {!finalized && <button type="button" className={styles.outlineButton} onClick={onAddItems}><Plus size={16} /> Adicionar itens</button>}
          </div>
          <div className={styles.summaryItems}>
            {items.map((item) => (
              <div key={`${item.id}-${item.priceInCents}`} className={styles.summaryItem}>
                <ProductThumbnail product={item} />
                <strong>{item.name}</strong>
                <span className={styles.itemQuantity}>{item.quantity}×</span>
                <span className={styles.itemTotal}>{formatMoney(item.priceInCents * item.quantity)}</span>
              </div>
            ))}
          </div>
          {tab.type === "delivery" && tab.deliveryAddress && (
            <section className={styles.deliverySummary} aria-label="Dados da entrega">
              <h3><MapPin size={17} /> Endereço de entrega</h3>
              <strong>{tab.customerName}</strong>
              {tab.customerPhone && <p>{formatDeliveryPhone(tab.customerPhone)}</p>}
              <address>
                <p>{tab.deliveryAddress.street}, {tab.deliveryAddress.number}{tab.deliveryAddress.block && ` · Quadra ${tab.deliveryAddress.block}`}</p>
                <p>{tab.deliveryAddress.neighborhood} · {tab.deliveryAddress.city}/{tab.deliveryAddress.state}</p>
                <p>CEP {tab.deliveryAddress.zipCode}</p>
                {tab.deliveryAddress.complement && <p>Complemento: {tab.deliveryAddress.complement}</p>}
                {tab.deliveryAddress.reference && <p>Referência: {tab.deliveryAddress.reference}</p>}
              </address>
            </section>
          )}
        </div>
      )}

      {section === "history" && (
        <div className={styles.orderHistory}>
          {tab.orders.map((order, index) => (
            <article className={styles.historyEntry} key={order.id}>
              <div><strong>Pedido {String(index + 1).padStart(2, "0")}</strong><time dateTime={order.createdAt}>{formatTime(order.createdAt)}</time></div>
              {order.items.map((item) => <p key={item.id}><span>{item.quantity}× {item.name}</span><strong>{formatMoney(item.priceInCents * item.quantity)}</strong></p>)}
            </article>
          ))}
        </div>
      )}

      {section === "notes" && (
        <div className={styles.field}>
          <label htmlFor={noteId}>Observações da comanda</label>
          <textarea id={noteId} rows={4} maxLength={500} readOnly={finalized} value={tab.notes} onChange={(event) => onNotesChange(event.target.value)} placeholder="Preferências ou informações sobre o atendimento..." />
          <p className={styles.fieldHint}>{finalized ? "Esta comanda está finalizada." : "Observações mantidas apenas durante esta demonstração."} {tab.notes.length}/500</p>
        </div>
      )}

      <div className={styles.totals}>
        <div><span>Subtotal</span><span>{formatMoney(totals.subtotalInCents)}</span></div>
        {tab.type === "table" && <div><span>Taxa de serviço (10%)</span><span>{formatMoney(totals.serviceFeeInCents)}</span></div>}
        <div className={styles.grandTotal}><strong>Total {tab.type === "table" ? "da mesa" : "da comanda"}</strong><strong>{formatMoney(totals.totalInCents)}</strong></div>
      </div>
      <div className={styles.dialogFooter}>
        <button type="button" className={styles.secondaryButton} onClick={onClose}>Voltar às mesas</button>
        {!finalized && <button type="button" className={styles.primaryButton} onClick={onFinalize}><CreditCard size={18} /> Finalizar comanda</button>}
      </div>
    </TableDialog>
  );
}
