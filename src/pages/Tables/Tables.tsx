import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Bike, Check, FlaskConical, Plus, ShoppingBag } from "lucide-react";
import { MdOutlineTableRestaurant } from "react-icons/md";
import NewOrderModal from "./NewOrderModal";
import TabDetailsModal from "./TabDetailsModal";
import TableDialog from "./TableDialog";
import FinalizeTabModal from "./FinalizeTabModal";
import type { TableResponseDto } from "../../dtos/response/table-response.dto";
import type { TabResponseDto } from "../../dtos/response/tab-response.dto";
import { TabStatus } from "../../dtos/enums/tab-status.enum";
import { TableStatus } from "../../dtos/enums/table-status.enum";
import { TableService } from "../../service/table.service";
import { TabService } from "../../service/tab.service";
import { OrderService } from "../../service/order.service";
import { OrderType } from "../../dtos/enums/order-type.enum";
import type { CreateAdminOrderRequestDto } from "../../dtos/request/create-admin-order-request.dto";
import { toStandaloneOrder, toTableTab } from "./tableTabs";
import {
  ORDER_TYPE_LABELS,
  formatMoney, getTabLabel, getTabTotals,
  type MockOrderItem, type MockTab, type NewOrderDetails,
} from "./mockTables";
import styles from "./Tables.module.css";

type TableFilter = "all" | "occupied" | "free";
type OrderDraft = { targetTabId?: string; tableNumber?: number };
type TablesProps = { refreshKey: number };

function getRequestError(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function Tables({ refreshKey }: TablesProps) {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabs, setTabs] = useState<MockTab[]>([]);
  const [filter, setFilter] = useState<TableFilter>("all");
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const [completedTab, setCompletedTab] = useState<MockTab | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [openingTableId, setOpeningTableId] = useState<string | null>(null);
  const [openTableError, setOpenTableError] = useState<string | null>(null);
  const openingTable = useRef(false);
  const savingOrder = useRef(false);
  const closingTab = useRef(false);
  const selectedTab = tabs.find((tab) => tab.id === selectedTabId);
  const targetTab = tabs.find((tab) => tab.id === orderDraft?.targetTabId);
  const activeTableNumbers = tables.filter((table) => table.isActive).map((table) => table.number);
  const occupiedTabs = tabs.filter((tab) => !tab.closedAt && tab.type === "table" && activeTableNumbers.includes(tab.tableNumber ?? 0));
  const otherTabs = tabs.filter((tab) => !tab.closedAt && tab.type !== "table");
  const occupiedCount = tables.filter((table) => table.isActive && isTableOccupied(table)).length;
  const freeCount = activeTableNumbers.length - occupiedCount;
  const visibleTables = tables.filter((table) => {
    const occupied = isTableOccupied(table);
    if (filter === "occupied") return table.isActive && occupied;
    if (filter === "free") return table.isActive && !occupied;
    return true;
  });

  function isTableOccupied(table: TableResponseDto) {
    if (table.status) return table.status === TableStatus.OCCUPIED;
    return occupiedTabs.some((tab) => tab.tableNumber === table.number);
  }

  async function loadTables() {
    try {
      setLoading(true);
      setError(null);
      const response = await TableService.findAll();
      const savedTabs: MockTab[] = [];
      for (const table of response) {
        for (const tab of table.tabs ?? []) {
          savedTabs.push(toTableTab({ ...tab, table }));
        }
      }
      const orders = await OrderService.findAll();
      const otherOrders = orders.filter((order) => !order.mesaId && (order.type === OrderType.PICKUP || order.type === OrderType.DELIVERY));
      setTables(response);
      setTabs((current) => [...savedTabs, ...otherOrders.map(toStandaloneOrder)].map((tab) => ({
        ...tab,
        notes: current.find((previous) => previous.id === tab.id)?.notes ?? "",
      })));
    } catch (err) {
      console.error("Erro ao carregar mesas:", err);
      setTables([]);
      setError("Não foi possível carregar as mesas e comandas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTables();
  }, [refreshKey]);

  async function openTable(tableId: string) {
    if (openingTable.current) return;
    openingTable.current = true;
    setOpeningTableId(tableId);
    setOpenTableError(null);
    setSaveError(null);
    setFinalizeError(null);
    try {
      const table = await TableService.findOne(tableId);
      const tableTabs = (table.tabs ?? []).map((tab) => toTableTab({ ...tab, table }));
      setTables((current) => current.map((currentTable) => currentTable.id === table.id ? table : currentTable));
      setTabs((current) => {
        const otherTabs = current.filter((tab) => tab.apiTab?.table.id !== table.id);
        const updatedTabs = tableTabs.map((tab) => ({
          ...tab,
          notes: current.find((previous) => previous.id === tab.id)?.notes ?? "",
        }));
        return [...otherTabs, ...updatedTabs];
      });
      if (!table.isActive) {
        setOpenTableError("Esta mesa está inativa.");
        return;
      }
      const openTab = tableTabs.find((tab) => tab.apiTab?.status === TabStatus.OPEN);
      if (openTab) {
        setSelectedTabId(openTab.id);
      } else {
        setOrderDraft({ tableNumber: table.number });
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes da mesa:", err);
      setOpenTableError(getRequestError(err, "Não foi possível carregar os detalhes da mesa. Tente novamente."));
    } finally {
      openingTable.current = false;
      setOpeningTableId(null);
    }
  }

  function addItems() {
    if (!selectedTab || closingTab.current) return;
    setSaveError(null);
    setOrderDraft({ targetTabId: selectedTab.id });
    setSelectedTabId(null);
  }

  function closeNewOrder() {
    if (savingOrder.current) return;
    if (orderDraft?.targetTabId) setSelectedTabId(orderDraft.targetTabId);
    setOrderDraft(null);
    setSaveError(null);
  }

  function updateSavedTab(response: TabResponseDto) {
    const updated = toTableTab(response);
    const { table: linkedTable, ...savedTab } = response;
    let status: TableStatus = TableStatus.AVAILABLE;
    if (!linkedTable.isActive) {
      status = TableStatus.INACTIVE;
    } else if (response.status === TabStatus.OPEN) {
      status = TableStatus.OCCUPIED;
    }
    setTables((current) => current.map((table) => {
      if (table.id !== linkedTable.id) return table;
      const tableTabs = table.tabs ?? [];
      const otherTabs = tableTabs.filter((tab) => tab.id !== savedTab.id);
      return { ...table, status, tabs: [...otherTabs, savedTab] };
    }));
    setTabs((current) => {
      const previous = current.find((tab) => tab.id === updated.id);
      if (previous) {
        return current.map((tab) => tab.id === updated.id ? { ...updated, notes: previous.notes } : tab);
      }
      return [...current, updated];
    });
    return updated;
  }

  async function saveOrder(details: NewOrderDetails, items: MockOrderItem[]) {
    if (items.length === 0 || savingOrder.current) return;
    setSaveError(null);

    if (details.type === "table") {
      const table = tables.find((current) => current.number === details.tableNumber);
      if (!table || !table.isActive) {
        setSaveError("Selecione uma mesa ativa para salvar o pedido.");
        return;
      }

      savingOrder.current = true;
      setSaving(true);
      try {
        let tab = targetTab ?? occupiedTabs.find((current) => current.apiTab?.table.id === table.id);
        if (!tab) {
          const created = await TabService.create({ tableId: table.id });
          tab = updateSavedTab(created);
          // Guarda o ID mesmo se a próxima etapa falhar.
          setOrderDraft((current) => current ? { ...current, targetTabId: created.id } : current);
        }

        const orderItems = items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        }));
        const response = await TabService.addOrder(tab.id, { items: orderItems });
        const updated = updateSavedTab(response);
        setOrderDraft(null);
        setSelectedTabId(updated.id);
      } catch (err) {
        console.error("Erro ao salvar pedido na comanda:", err);
        setSaveError(getRequestError(err, "Não foi possível salvar o pedido. Confira a comanda antes de tentar novamente."));
      } finally {
        savingOrder.current = false;
        setSaving(false);
      }
      return;
    }

    savingOrder.current = true;
    setSaving(true);
    try {
      const dto: CreateAdminOrderRequestDto = {
        type: details.type === "pickup" ? OrderType.PICKUP : OrderType.DELIVERY,
        customerName: details.customerName || undefined,
        customerPhone: details.customerPhone || undefined,
        deliveryAddress: details.type === "delivery" ? details.deliveryAddress : undefined,
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      };
      const response = await OrderService.createAdmin(dto);
      const savedOrder = toStandaloneOrder(response);
      setTabs((current) => [...current, savedOrder]);
      setOrderDraft(null);
      setSelectedTabId(savedOrder.id);
    } catch (err) {
      console.error("Erro ao criar pedido de balcão ou delivery:", err);
      setSaveError(getRequestError(err, "Não foi possível salvar o pedido. Confira a lista de pedidos antes de tentar novamente."));
    } finally {
      savingOrder.current = false;
      setSaving(false);
    }
  }

  async function finalizeTab() {
    if (!selectedTab || selectedTab.closedAt || !confirmFinalize || closingTab.current) return;
    setFinalizeError(null);
    if (selectedTab.apiTab) {
      closingTab.current = true;
      setFinalizing(true);
      try {
        await TabService.remove(selectedTab.id);
        const finalized = { ...selectedTab, closedAt: new Date().toISOString() };
        setTabs((current) => current.filter((tab) => tab.id !== selectedTab.id));
        setTables((current) => current.map((table) => {
          if (table.id !== selectedTab.apiTab?.table.id) return table;
          const tableTabs = (table.tabs ?? []).filter((tab) => tab.id !== selectedTab.id);
          let status: TableStatus = TableStatus.AVAILABLE;
          if (!table.isActive) status = TableStatus.INACTIVE;
          else if (tableTabs.some((tab) => tab.status === TabStatus.OPEN)) status = TableStatus.OCCUPIED;
          return { ...table, tabs: tableTabs, status };
        }));
        setConfirmFinalize(false);
        setSelectedTabId(null);
        setCompletedTab(finalized);
      } catch (err) {
        console.error("Erro ao finalizar comanda:", err);
        setFinalizeError(getRequestError(err, "Não foi possível finalizar a comanda. Tente novamente."));
      } finally {
        closingTab.current = false;
        setFinalizing(false);
      }
      return;
    }
    const finalized = { ...selectedTab, closedAt: new Date().toISOString() };
    setTabs((current) => current.map((tab) => tab.id === finalized.id ? finalized : tab));
    setSelectedTabId(null);
    setConfirmFinalize(false);
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
        <button type="button" className={styles.primaryButton} disabled={loading || !!error || openingTableId !== null} onClick={() => { setSaveError(null); setOrderDraft({}); }}><Plus size={18} /> Criar pedido</button>
      </div>
      <div className={styles.mockNotice} role="note">
        <FlaskConical size={16} />
        <span><strong>Mesas, balcão e delivery integrados à API.</strong> Observações da comanda são mantidas apenas nesta tela.</span>
      </div>

      <div className={styles.scrollArea}>
        <section className={styles.panel} aria-labelledby="tables-heading">
          <div className={styles.panelHeader}>
            <div><h2 id="tables-heading">Mesas da loja <span>({tables.length})</span></h2><p>Selecione uma mesa para abrir ou consultar a comanda.</p></div>
            <div className={styles.filters} aria-label="Filtrar mesas">
              <button type="button" className={filter === "all" ? styles.filterActive : styles.filterButton} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas <span>{tables.length}</span></button>
              <button type="button" className={filter === "occupied" ? styles.filterActive : styles.filterButton} aria-pressed={filter === "occupied"} onClick={() => setFilter("occupied")}>Ocupadas <span>{occupiedCount}</span></button>
              <button type="button" className={filter === "free" ? styles.filterActive : styles.filterButton} aria-pressed={filter === "free"} onClick={() => setFilter("free")}>Livres <span>{freeCount}</span></button>
            </div>
          </div>
          {loading && <p role="status" className={styles.emptyState}>Carregando mesas...</p>}
          {openingTableId && <p role="status" className={styles.emptyState}>Carregando detalhes da mesa...</p>}
          {openTableError && <p role="alert" className={styles.error}>{openTableError}</p>}
          {error && (
            <div className={styles.emptyState}>
              <p role="alert">{error}</p>
              <button type="button" className={styles.secondaryButton} onClick={() => void loadTables()}>Tentar novamente</button>
            </div>
          )}
          {!loading && !error && <div className={styles.tableGrid}>
            {visibleTables.map((table) => {
              const tab = occupiedTabs.find((current) => current.tableNumber === table.number);
              let cardClass = styles.tableFree;
              let statusClass = styles.free;
              let statusLabel = "Livre";
              let actionLabel = "livre, criar pedido";
              let description = "Pronta para atender";

              if (!table.isActive) {
                cardClass = styles.tableInactive;
                statusClass = styles.inactive;
                statusLabel = "Inativa";
                actionLabel = "inativa";
                description = "Indisponível para atendimento";
              } else if (isTableOccupied(table)) {
                cardClass = styles.tableOccupied;
                statusClass = styles.occupied;
                statusLabel = "Ocupada";
                actionLabel = "ocupada, consultar comanda";
                description = "Comanda em aberto";
              }

              return (
                <button
                  type="button"
                  key={table.id}
                  disabled={!table.isActive || openingTableId !== null}
                  aria-busy={openingTableId === table.id}
                  className={`${styles.tableCard} ${cardClass}`}
                  onClick={() => void openTable(table.id)}
                  aria-label={`Mesa ${table.number}, ${actionLabel}`}
                >
                  <MdOutlineTableRestaurant className={styles.tableIcon} size={30} />
                  <strong>Mesa {table.number}</strong>
                  <span className={styles.tableMetrics}>
                    {tab ? <>{tab.orders.length} {tab.orders.length === 1 ? "pedido" : "pedidos"}<span> · </span><b>{formatMoney(getTabTotals(tab).totalInCents)}</b></> : description}
                  </span>
                  <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</span>
                </button>
              );
            })}
          </div>}
          {!loading && !error && visibleTables.length === 0 && <p className={styles.emptyState}>{tables.length === 0 ? "Nenhuma mesa cadastrada." : "Nenhuma mesa encontrada neste filtro."}</p>}
          {!loading && !error && <div className={styles.gridLegend}><span><i className={styles.freeDot} /> {freeCount} livres</span><span><i className={styles.occupiedDot} /> {occupiedCount} ocupadas</span><span>Status e totais das mesas retornados pela API.</span></div>}
        </section>

        <section className={styles.panel} aria-labelledby="other-orders-heading">
          <div className={styles.panelHeader}><div><h2 id="other-orders-heading">Balcão e delivery <span>({otherTabs.length})</span></h2><p>Pedidos em andamento para retirada ou entrega.</p></div></div>
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

      {selectedTab && !orderDraft && !confirmFinalize && (
        <TabDetailsModal tab={selectedTab} finalizing={finalizing} finalizeError={null} onClose={() => { if (!closingTab.current) setSelectedTabId(null); }} onAddItems={addItems} onFinalize={() => { setFinalizeError(null); setConfirmFinalize(true); }} onNotesChange={updateNotes} onViewOrder={() => navigate(`/orders-details/${selectedTab.apiOrder?.id}`)} />
      )}
      {selectedTab && confirmFinalize && (
        <FinalizeTabModal tab={selectedTab} finalizing={finalizing} error={finalizeError} onClose={() => { if (!closingTab.current) { setConfirmFinalize(false); setFinalizeError(null); } }} onConfirm={() => void finalizeTab()} />
      )}
      {orderDraft && (
        <NewOrderModal tabs={tabs} tableNumbers={activeTableNumbers} targetTab={targetTab} initialTableNumber={orderDraft.tableNumber} saving={saving} saveError={saveError} onClose={closeNewOrder} onSave={saveOrder} />
      )}
      {completedTab && (
        <TableDialog title="Comanda finalizada!" description={completedTab.apiTab ? "Comanda excluída com sucesso. Os pedidos foram preservados." : "Finalização simulada concluída com sucesso."} icon={<Check />} onClose={() => setCompletedTab(null)}>
          <div className={styles.completedContent}>
            <span className={styles.successIcon}><Check size={36} strokeWidth={2} /></span>
            <h3>{getTabLabel(completedTab)}</h3>
            <p>{completedTab.type === "table" ? "A mesa está livre para um novo atendimento." : "O atendimento foi encerrado nesta demonstração."}</p>
            <div className={styles.paidTotal}><span>Total da comanda</span><strong>{formatMoney(getTabTotals(completedTab).totalInCents)}</strong><small>{completedTab.apiTab ? "Pagamento não processado por esta tela" : "Pagamento não processado · Prévia visual"}</small></div>
          </div>
          <div className={styles.dialogFooter}>
            <button type="button" className={styles.secondaryButton} onClick={() => setCompletedTab(null)}>Voltar às mesas</button>
            <button type="button" className={styles.primaryButton} onClick={() => { setOrderDraft({ tableNumber: completedTab.tableNumber }); setCompletedTab(null); }}><Plus size={17} /> Nova comanda</button>
          </div>
        </TableDialog>
      )}
    </div>
  );
}
