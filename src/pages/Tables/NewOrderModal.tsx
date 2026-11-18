import { useEffect, useId, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShoppingBag, ShoppingCart, Bike } from "lucide-react";
import { MdOutlineTableRestaurant } from "react-icons/md";
import TableDialog from "./TableDialog";
import DeliveryFields from "./DeliveryFields";
import ProductThumbnail, { CategoryIcon } from "./ProductThumbnail";
import type { ProductResponse } from "../../dtos/response/product-response.dto";
import { ProductStatusEnum } from "../../dtos/enums/product-status.enum";
import { ProductService } from "../../service/product.service";
import {
  ORDER_TYPE_LABELS, PRODUCT_CATEGORIES,
  formatMoney, getDeliveryError, getTabLabel,
  type DeliveryAddress, type MockOrderItem, type MockTab, type NewOrderDetails, type OrderType, type ProductCategory,
} from "./mockTables";
import styles from "./Tables.module.css";

type Props = {
  tabs: MockTab[];
  tableNumbers: number[];
  targetTab?: MockTab;
  initialTableNumber?: number;
  saving: boolean;
  saveError: string | null;
  onClose: () => void;
  onSave: (details: NewOrderDetails, items: MockOrderItem[]) => Promise<void>;
};

export default function NewOrderModal({ tabs, tableNumbers, targetTab, initialTableNumber, saving, saveError, onClose, onSave }: Props) {
  const id = useId();
  const [step, setStep] = useState<"details" | "items">(targetTab ? "items" : "details");
  const [type, setType] = useState<OrderType>(targetTab?.type ?? "table");
  const [tableNumber, setTableNumber] = useState(String(targetTab?.tableNumber ?? initialTableNumber ?? ""));
  const [customerName, setCustomerName] = useState(targetTab?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(targetTab?.customerPhone ?? "");
  const [address, setAddress] = useState<DeliveryAddress>(() => ({
    street: "", number: "", block: "", lot: "", neighborhood: "", city: "Buriti Alegre", state: "GO",
    zipCode: "75660-000", complement: "", reference: "", ...targetTab?.deliveryAddress,
  }));
  const [category, setCategory] = useState<ProductCategory>("FOOD");
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const orderProducts = products.map((product) => {
    const image = product.images.find((image) => image.isPrimary) ?? product.images[0];
    return {
      ...product,
      description: product.description ?? "",
      priceInCents: Math.round(Number(product.promoPrice ?? product.price) * 100),
      image: image?.imageUrl ?? image?.url,
    };
  });
  const visibleProducts = orderProducts.filter((product) => product.category === category);
  const selectedItems = orderProducts
    .filter((product) => product.isActive === ProductStatusEnum.ACTIVED)
    .filter((product) => (quantities[product.id] ?? 0) > 0)
    .map((product) => ({ ...product, quantity: quantities[product.id] }));
  const itemCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const totalInCents = selectedItems.reduce((total, item) => total + item.priceInCents * item.quantity, 0);
  const occupiedTab = tabs.find((tab) => !tab.closedAt && tab.type === "table" && tab.tableNumber === Number(tableNumber));
  const details: NewOrderDetails = {
    type,
    tableNumber: type === "table" ? Number(tableNumber) : undefined,
    customerName: customerName.trim(),
  };
  if (type === "delivery") {
    details.customerPhone = customerPhone.replace(/\D/g, "");
    details.deliveryAddress = {
      street: address.street.trim(),
      number: address.number.trim(),
      block: address.block.trim(),
      lot: address.lot?.trim(),
      neighborhood: address.neighborhood.trim(),
      city: address.city.trim(),
      state: address.state.trim().toUpperCase(),
      zipCode: address.zipCode.trim(),
      complement: address.complement.trim(),
      reference: address.reference.trim(),
    };
  }
  let destination = ORDER_TYPE_LABELS[type];
  if (type === "table") destination = `Mesa ${tableNumber}`;
  if (targetTab) destination = getTabLabel(targetTab);

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      setProductsError(null);
      const response = await ProductService.findAll();
      setProducts(response);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setProducts([]);
      setProductsError("Não foi possível carregar os produtos. Tente novamente.");
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (type === "table" && !tableNumbers.includes(Number(tableNumber))) {
      setError("Selecione uma mesa para continuar.");
      return;
    }
    const deliveryError = getDeliveryError(details);
    if (deliveryError) {
      setError(deliveryError);
      return;
    }
    setError("");
    setStep("items");
  }

  function changeQuantity(productId: string, amount: number) {
    if (saving) return;
    setQuantities((current) => ({
      ...current,
      [productId]: Math.max(0, Math.min(99, (current[productId] ?? 0) + amount)),
    }));
  }

  function saveItems() {
    if (saving || loadingProducts || productsError || selectedItems.length === 0) return;
    void onSave(details, selectedItems);
  }

  return (
    <TableDialog
      title={step === "details" ? "Novo pedido" : `Adicionar itens · ${destination}`}
      description={step === "details" ? "Crie um pedido para mesa, balcão ou delivery." : "Selecione os produtos e as quantidades para a comanda."}
      icon={step === "details" ? <ShoppingCart /> : <MdOutlineTableRestaurant />}
      onClose={onClose}
      busy={saving}
      wide={step === "items" || type === "delivery"}
    >
      <div className={styles.stepIndicator} aria-label={`Etapa ${step === "details" ? "1" : "2"} de 2`}>
        <span className={styles.stepDone}>1 <span>Tipo do pedido</span></span>
        <span className={step === "items" ? styles.stepDone : ""}>2 <span>Adicionar itens</span></span>
      </div>

      {step === "details" ? (
        <form onSubmit={nextStep} className={styles.orderForm}>
          <fieldset className={styles.orderTypeField}>
            <legend>Tipo do pedido</legend>
            <div className={styles.orderTypes}>
              {(["table", "pickup", "delivery"] as const).map((orderType) => (
                <button
                  key={orderType}
                  type="button"
                  aria-pressed={type === orderType}
                  className={`${styles.orderType} ${type === orderType ? styles.orderTypeSelected : ""}`}
                  onClick={() => { setType(orderType); setError(""); }}
                >
                  {type === orderType && <Check className={styles.typeCheck} size={15} />}
                  {orderType === "table" && <MdOutlineTableRestaurant />}
                  {orderType === "pickup" && <ShoppingBag />}
                  {orderType === "delivery" && <Bike />}
                  <span>{ORDER_TYPE_LABELS[orderType]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {type === "table" && (
            <div className={styles.field}>
              <label htmlFor={`${id}-table`}>Selecione a mesa</label>
              <select id={`${id}-table`} value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} required>
                <option value="" disabled>Escolha uma mesa</option>
                {tableNumbers.map((number) => (
                  <option key={number} value={number}>
                    Mesa {number} · {tabs.some((tab) => !tab.closedAt && tab.type === "table" && tab.tableNumber === number) ? "Ocupada" : "Livre"}
                  </option>
                ))}
              </select>
              <p className={styles.fieldHint}>
                {occupiedTab ? "Esta mesa já possui uma comanda. Os itens serão adicionados a ela." : "A comanda será aberta ao adicionar os primeiros itens."}
              </p>
            </div>
          )}
          {type === "pickup" && (
            <div className={styles.field}>
              <label htmlFor={`${id}-customer`}>Nome do cliente <span>(opcional)</span></label>
              <input id={`${id}-customer`} value={customerName} maxLength={80} placeholder="Como identificar este pedido?" onChange={(event) => setCustomerName(event.target.value)} />
              <p className={styles.fieldHint}>Use o nome para identificar a retirada no balcão.</p>
            </div>
          )}
          {type === "delivery" && (
            <DeliveryFields
              customerName={customerName}
              customerPhone={customerPhone}
              address={address}
              onNameChange={setCustomerName}
              onPhoneChange={setCustomerPhone}
              onAddressChange={(field, value) => setAddress((current) => ({ ...current, [field]: value }))}
            />
          )}
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <div className={styles.dialogFooter}>
            <button className={styles.secondaryButton} type="button" onClick={onClose}>Cancelar</button>
            <button className={styles.primaryButton} type="submit">Próximo <ArrowRight size={17} /></button>
          </div>
        </form>
      ) : (
        <>
          <div className={styles.categoryTabs} aria-label="Categorias de produtos">
            {PRODUCT_CATEGORIES.map((productCategory) => (
              <button
                type="button"
                key={productCategory.id}
                className={category === productCategory.id ? styles.categoryActive : styles.categoryButton}
                aria-pressed={category === productCategory.id}
                onClick={() => setCategory(productCategory.id)}
              >
                <CategoryIcon category={productCategory.id} size={19} /> {productCategory.label}
              </button>
            ))}
          </div>
          <div className={styles.productList}>
            {loadingProducts && <p role="status" className={styles.emptyState}>Carregando produtos...</p>}
            {productsError && (
              <div className={styles.emptyState}>
                <p role="alert">{productsError}</p>
                <button type="button" className={styles.secondaryButton} onClick={() => void loadProducts()}>Tentar novamente</button>
              </div>
            )}
            {!loadingProducts && !productsError && visibleProducts.length === 0 && (
              <p className={styles.emptyState}>{products.length === 0 ? "Nenhum produto cadastrado." : "Nenhum produto nesta categoria."}</p>
            )}
            {!loadingProducts && !productsError && visibleProducts.map((product) => {
              const quantity = quantities[product.id] ?? 0;
              const inactive = product.isActive !== ProductStatusEnum.ACTIVED;
              return (
                <div key={product.id} className={styles.productRow}>
                  <ProductThumbnail product={product} />
                  <div className={styles.productInfo}>
                    <strong>{product.name}</strong>
                    <p>{product.description}</p>
                    {inactive && <span className={styles.fieldHint}>Produto inativo</span>}
                  </div>
                  <span className={styles.productPrice}>{formatMoney(product.priceInCents)}</span>
                  <div className={styles.quantityControl}>
                    <button type="button" aria-label={`Diminuir ${product.name}`} disabled={saving || quantity === 0} onClick={() => changeQuantity(product.id, -1)}><Minus size={15} /></button>
                    <output aria-label={`Quantidade de ${product.name}`} aria-live="polite">{quantity}</output>
                    <button type="button" aria-label={`Adicionar ${product.name}`} disabled={saving || inactive || quantity === 99} onClick={() => changeQuantity(product.id, 1)}><Plus size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className={styles.selectionSummary} aria-live="polite">
            {itemCount === 0 ? "Selecione pelo menos um item para continuar." : `${itemCount} ${itemCount === 1 ? "item selecionado" : "itens selecionados"} em todas as categorias.`}
          </p>
          {saveError && <p role="alert" className={styles.error}>{saveError}</p>}
          <div className={styles.dialogFooter}>
            <button className={styles.secondaryButton} type="button" disabled={saving} onClick={targetTab ? onClose : () => setStep("details")}>
              {targetTab ? "Cancelar" : <><ArrowLeft size={16} /> Voltar</>}
            </button>
            <button className={styles.primaryButton} type="button" disabled={saving || loadingProducts || !!productsError || itemCount === 0} onClick={saveItems}>
              {saving ? "Salvando pedido..." : <><Plus size={17} /> Adicionar ({itemCount}) · {formatMoney(totalInCents)}</>}
            </button>
          </div>
        </>
      )}
    </TableDialog>
  );
}
