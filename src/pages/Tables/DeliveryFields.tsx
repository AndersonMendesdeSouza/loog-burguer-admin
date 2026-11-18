import { useId } from "react";
import { MapPin, UserRound } from "lucide-react";
import { formatDeliveryPhone, type DeliveryAddress } from "./mockTables";
import styles from "./Tables.module.css";

type Props = {
  customerName: string;
  customerPhone: string;
  address: DeliveryAddress;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  onAddressChange: (field: keyof DeliveryAddress, value: string) => void;
};

export default function DeliveryFields({ customerName, customerPhone, address, onNameChange, onPhoneChange, onAddressChange }: Props) {
  const id = useId();

  return (
    <div className={styles.deliveryFields}>
      <h3 className={styles.deliverySectionTitle}><UserRound size={17} /> Dados do cliente</h3>
      <div className={styles.addressFields}>
        <div className={styles.field}>
          <label htmlFor={`${id}-name`}>Nome completo</label>
          <input id={`${id}-name`} name="customerName" autoComplete="shipping name" value={customerName} onChange={(event) => onNameChange(event.target.value)} placeholder="Nome de quem vai receber" maxLength={80} required />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-phone`}>Telefone / WhatsApp</label>
          <input id={`${id}-phone`} name="customerPhone" type="tel" autoComplete="shipping tel-national" value={customerPhone} onChange={(event) => onPhoneChange(formatDeliveryPhone(event.target.value))} placeholder="(64) 99999-9999" maxLength={15} required />
        </div>
      </div>

      <h3 className={styles.deliverySectionTitle}><MapPin size={17} /> Endereço de entrega</h3>
      <div className={styles.addressFields}>
        <div className={styles.field}>
          <label htmlFor={`${id}-zip`}>CEP</label>
          <input id={`${id}-zip`} name="zipCode" inputMode="numeric" autoComplete="shipping postal-code" value={address.zipCode} onChange={(event) => onAddressChange("zipCode", event.target.value.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2"))} placeholder="00000-000" maxLength={9} pattern="[0-9]{5}-[0-9]{3}" required />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-street`}>Rua / Avenida</label>
          <input id={`${id}-street`} name="street" autoComplete="shipping address-line1" value={address.street} onChange={(event) => onAddressChange("street", event.target.value)} placeholder="Nome da rua ou avenida" maxLength={160} required />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-number`}>Número</label>
          <input id={`${id}-number`} name="number" value={address.number} onChange={(event) => onAddressChange("number", event.target.value)} placeholder="Ex.: 120 ou s/n" maxLength={30} required />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-block`}>Quadra <span>(opcional)</span></label>
          <input id={`${id}-block`} name="block" value={address.block} onChange={(event) => onAddressChange("block", event.target.value)} placeholder="Ex.: 12" maxLength={30} />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-lot`}>Lote <span>(opcional)</span></label>
          <input id={`${id}-lot`} name="lot" value={address.lot ?? ""} onChange={(event) => onAddressChange("lot", event.target.value)} placeholder="Ex.: 8" maxLength={30} />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-neighborhood`}>Bairro</label>
          <input id={`${id}-neighborhood`} name="neighborhood" autoComplete="shipping address-level3" value={address.neighborhood} onChange={(event) => onAddressChange("neighborhood", event.target.value)} placeholder="Bairro da entrega" maxLength={80} required />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-city`}>Cidade</label>
          <input id={`${id}-city`} name="city" autoComplete="shipping address-level2" value={address.city} onChange={(event) => onAddressChange("city", event.target.value)} placeholder="Cidade da entrega" maxLength={80} required />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-state`}>UF</label>
          <input id={`${id}-state`} name="state" autoComplete="shipping address-level1" value={address.state} onChange={(event) => onAddressChange("state", event.target.value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase())} placeholder="GO" maxLength={2} pattern="[A-Z]{2}" required />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-complement`}>Complemento <span>(opcional)</span></label>
          <input id={`${id}-complement`} name="complement" autoComplete="shipping address-line2" value={address.complement} onChange={(event) => onAddressChange("complement", event.target.value)} placeholder="Apartamento, bloco, casa..." maxLength={160} />
        </div>
        <div className={`${styles.field} ${styles.fullWidthField}`}>
          <label htmlFor={`${id}-reference`}>Ponto de referência <span>(opcional)</span></label>
          <input id={`${id}-reference`} name="reference" value={address.reference} onChange={(event) => onAddressChange("reference", event.target.value)} placeholder="Ex.: próximo à praça" maxLength={160} />
        </div>
      </div>
      <p className={styles.fieldHint}>O endereço será salvo neste pedido, sem cadastrar um endereço no perfil.</p>
    </div>
  );
}
