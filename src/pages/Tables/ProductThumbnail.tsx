import { CupSoda, Hamburger, IceCreamBowl, UtensilsCrossed } from "lucide-react";
import type { MockProduct, ProductCategory } from "./mockTables";
import styles from "./Tables.module.css";

export function CategoryIcon({ category, size = 21 }: { category: ProductCategory; size?: number }) {
  if (category === "DRINK") return <CupSoda size={size} />;
  if (category === "ADDON") return <UtensilsCrossed size={size} />;
  if (category === "DESSERT") return <IceCreamBowl size={size} />;
  return <Hamburger size={size} />;
}

export default function ProductThumbnail({ product }: { product: MockProduct }) {
  return (
    <span className={styles.productThumbnail} aria-hidden="true">
      {product.image ? <img src={product.image} alt="" /> : <CategoryIcon category={product.category} size={26} />}
    </span>
  );
}
