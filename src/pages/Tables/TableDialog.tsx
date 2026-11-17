import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Tables.module.css";

type Props = {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
};

export default function TableDialog({ title, description, icon, children, onClose, wide = false }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${wide ? styles.wideDialog : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
    >
      <div className={styles.dialogHeader}>
        <span className={styles.dialogIcon} aria-hidden="true">{icon}</span>
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button type="button" className={styles.closeButton} aria-label="Fechar modal" onClick={onClose}><X size={20} /></button>
      </div>
      {children}
    </dialog>
  );
}
