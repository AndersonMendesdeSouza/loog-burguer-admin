import { useState } from "react";
import { Bike, Check, ClipboardList, FlaskConical, Plus, ShoppingBag } from "lucide-react";
import { MdOutlineTableRestaurant } from "react-icons/md";
import NewOrderModal from "./NewOrderModal";
import TabDetailsModal from "./TabDetailsModal";
import TableDialog from "./TableDialog";
import {
  MOCK_TABLE_NUMBERS, ORDER_TYPE_LABELS, appendMockOrder, createMockTabs,
  formatMoney, getTabLabel, getTabTotals,
  type MockOrderItem, type MockTab, type NewOrderDetails,
} from "./mockTables";
import styles from "./Tables.module.css";

type TableFilter = "all" | "occupied" | "free";
type OrderDraft = { targetTabId?: string; tableNumber?: number };

export default function Tables() {
  const [tabs, setTabs] = useState<MockTab[]>(createMockTabs);
  const [filter, setFilter] = useState<TableFilter>("all");
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const [completedTab, setCompletedTab] = useState<MockTab | null>(null);
  const selectedTab = tabs.find((tab) => tab.id === selectedTabId);
  const targetTab = tabs.find((tab) => tab.id === orderDraft?.targetTabId);
  const occupiedTabs = tabs.filter((tab) => !tab.closedAt && tab.type === "table");
  const otherTabs = tabs.filter((tab) => !tab.closedAt && tab.type !== "table");
  const freeCount = MOCK_TABLE_NUMBERS.length - occupiedTabs.length;
  const visibleTables = MOCK_TABLE_NUMBERS.filter((number) => {
    const occupied = occupiedTabs.some((tab) => tab.tableNumber === number);
    if (filter === "occupied") return occupied;
    if (filter === "free") return !occupied;
    return true;
  });

  function openTable(tableNumber: number) {
    const tab = occupiedTabs.find((current) => current.tableNumber === tableNumber);
    if (tab) {
      setSelectedTabId(tab.id);
    } else {
      setOrderDraft({ tableNumber });
    }
  }

  function addItems() {
    if (!selectedTab) return;
    setOrderDraft({ targetTabId: selectedTab.id });
    setSelectedTabId(null);
  }

  function closeNewOrder() {
    if (orderDraft?.targetTabId) setSelectedTabId(orderDraft.targetTabId);
    setOrderDraft(null);
  }

  function saveOrder(details: NewOrderDetails, items: MockOrderItem[]) {
    if (items.length === 0) return;
    let tab = targetTab;
    if (!tab && details.type === "table") {
      tab = occupiedTabs.find((current) => current.tableNumber === details.tableNumber);
    }
    if (!tab) {
      tab = {
        id: crypto.randomUUID(),
        ...details,
        openedAt: new Date().toISOString(),
        notes: "",
        orders: [],
      };
    }
    const updated = appendMockOrder(tab, items);
    setTabs((current) => {
      if (current.some((currentTab) => currentTab.id === updated.id)) {
        return current.map((currentTab) => currentTab.id === updated.id ? updated : currentTab);
      }
      return [...current, updated];
    });
    setOrderDraft(null);
    setSelectedTabId(updated.id);
  }

  function finalizeTab() {
    if (!selectedTab || selectedTab.closedAt) return;
    const finalized = { ...selectedTab, closedAt: new Date().toISOString() };
    setTabs((current) => current.map((tab) => tab.id === finalized.id ? finalized : tab));
    setSelectedTabId(null);
    setCompletedTab(finalized);
  }

  function updateNotes(notes: string) {
    setTabs((current) => current.map((tab) => tab.id === selectedTabId && !tab.closedAt ? { ...tab, notes } : tab));
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>Atendimento da loja</p>
          <p className={styles.pageDescription}>Organize as mesas e acompanhe cada comanda.</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={() => setOrderDraft({})}><Plus size={18} /> Criar pedido</button>
      </div>
      <div className={styles.mockNotice} role="note">
        <FlaskConical size={16} />
        <span><strong>Prévia com dados simulados.</strong> As alterações são descartadas ao sair desta tela ou recarregar.</span>
      </div>

      <div className={styles.scrollArea}>
        <section className={styles.panel} aria-labelledby="tables-heading">
          <div className={styles.panelHeader}>
            <div><h2 id="tables-heading">Mesas da loja <span>({MOCK_TABLE_NUMBERS.length})</span></h2><p>Selecione uma mesa para abrir ou consultar a comanda.</p></div>
            <div className={styles.filters} aria-label="Filtrar mesas">
              <button type="button" className={filter === "all" ? styles.filterActive : styles.filterButton} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas <span>{MOCK_TABLE_NUMBERS.length}</span></button>
              <button type="button" className={filter === "occupied" ? styles.filterActive : styles.filterButton} aria-pressed={filter === "occupied"} onClick={() => setFilter("occupied")}>Ocupadas <span>{occupiedTabs.length}</span></button>
              <button type="button" className={filter === "free" ? styles.filterActive : styles.filterButton} aria-pressed={filter === "free"} onClick={() => setFilter("free")}>Livres <span>{freeCount}</span></button>
            </div>
          </div>
          <div className={styles.tableGrid}>
            {visibleTables.map((number) => {
              const tab = occupiedTabs.find((current) => current.tableNumber === number);
              return (
                <button
                  type="button"
                  key={number}
                  className={`${styles.tableCard} ${tab ? styles.tableOccupied : styles.tableFree}`}
                  onClick={() => openTable(number)}
                  aria-label={`Mesa ${number}, ${tab ? "ocupada, consultar comanda" : "livre, criar pedido"}`}
                >
                  <MdOutlineTableRestaurant className={styles.tableIcon} size={30} />
                  <strong>Mesa {number}</strong>
                  <span className={styles.tableMetrics}>
                    {tab ? <>{tab.orders.length} {tab.orders.length === 1 ? "pedido" : "pedidos"}<span> · </span><b>{formatMoney(getTabTotals(tab).totalInCents)}</b></> : "Pronta para atender"}
                  </span>
                  <span className={`${styles.statusBadge} ${tab ? styles.occupied : styles.free}`}>{tab ? "Ocupada" : "Livre"}</span>
                </button>
              );
            })}
          </div>
          {visibleTables.length === 0 && <p className={styles.emptyState}>Nenhuma mesa {filter === "free" ? "livre" : "ocupada"} no momento.</p>}
          <div className={styles.gridLegend}><span><i className={styles.freeDot} /> {freeCount} livres</span><span><i className={styles.occupiedDot} /> {occupiedTabs.length} ocupadas</span><span>Taxa de serviço simulada: 10% nas mesas.</span></div>
        </section>

        <section className={styles.panel} aria-labelledby="other-orders-heading">
          <div className={styles.panelHeader}><div><h2 id="other-orders-heading">Balcão e delivery <span>({otherTabs.length})</span></h2><p>Comandas abertas fora das mesas.</p></div></div>
          {otherTabs.length === 0 ? (
            <div className={styles.otherEmpty}><ShoppingBag size={23} /><p>Os novos pedidos de balcão e delivery aparecerão aqui.</p></div>
          ) : (
            <div className={styles.otherGrid}>
              {otherTabs.map((tab) => (
                <button type="button" className={styles.otherCard} key={tab.id} onClick={() => setSelectedTabId(tab.id)}>
                  {tab.type === "delivery" ? <Bike size={24} /> : <ShoppingBag size={24} />}
                  <div><span>{ORDER_TYPE_LABELS[tab.type]}</span><strong>{getTabLabel(tab)}</strong></div>
                  <b>{formatMoney(getTabTotals(tab).totalInCents)}</b>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedTab && !orderDraft && (
        <TabDetailsModal tab={selectedTab} onClose={() => setSelectedTabId(null)} onAddItems={addItems} onFinalize={finalizeTab} onNotesChange={updateNotes} />
      )}
      {orderDraft && (
        <NewOrderModal tabs={tabs} targetTab={targetTab} initialTableNumber={orderDraft.tableNumber} onClose={closeNewOrder} onSave={saveOrder} />
      )}
      {completedTab && (
        <TableDialog title="Comanda finalizada!" description="Finalização simulada concluída com sucesso." icon={<Check />} onClose={() => setCompletedTab(null)}>
          <div className={styles.completedContent}>
            <span className={styles.successIcon}><Check size={36} strokeWidth={2} /></span>
            <h3>{getTabLabel(completedTab)}</h3>
            <p>{completedTab.type === "table" ? "A mesa está livre para um novo atendimento." : "O atendimento foi encerrado nesta demonstração."}</p>
            <div className={styles.paidTotal}><span>Total da comanda</span><strong>{formatMoney(getTabTotals(completedTab).totalInCents)}</strong><small>Pagamento não processado · Prévia visual</small></div>
          </div>
          <div className={styles.dialogFooter}>
            <button type="button" className={styles.secondaryButton} onClick={() => { setSelectedTabId(completedTab.id); setCompletedTab(null); }}><ClipboardList size={17} /> Ver detalhes</button>
            <button type="button" className={styles.primaryButton} onClick={() => { setOrderDraft({ tableNumber: completedTab.tableNumber }); setCompletedTab(null); }}><Plus size={17} /> Nova comanda</button>
          </div>
        </TableDialog>
      )}
    </div>
  );
}
