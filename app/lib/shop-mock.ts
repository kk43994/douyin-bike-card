import type { SceneKey } from "./amap-mock";

/**
 * 抖音小店商品 mock 数据层 (装备推荐 / 变现演示)
 *
 * 根据识别出的骑行场景 (山地/城市) 智能选品。商品图为本地真实骑行图
 * (public/products/, 来自 Pexels 免费商用图库)。
 * 当前为 mock; 未来替换为抖音开放平台 (巨量引擎 / 精选联盟) 商品接口, 组件零改动。
 */

export type ShopCategory = "helmet" | "bike" | "accessory" | "apparel";

export type ShopProduct = {
  id: string;
  title: string;
  /** 本地真实商品图路径 */
  image: string;
  category: ShopCategory;
  price: number;
  originalPrice: number;
  soldText: string;
  shop: string;
  rating: number;
  /** 营销标签: 热销 / 独家 / 新品 / 直降 */
  tag?: string;
  /** 优惠券面额 (元), 有则展示抖店满减券角标 */
  coupon?: number;
  /** 达人带货佣金比例 (%) — 数据层保留, UI 不展示 */
  commissionPct: number;
  /** 抖音小店商品深链 (mock) */
  douyinLink: string;
};

export const SHOP_CATEGORIES: { key: ShopCategory | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "helmet", label: "头盔护具" },
  { key: "bike", label: "整车" },
  { key: "accessory", label: "配件" },
  { key: "apparel", label: "服饰" },
];

const MOUNTAIN_PRODUCTS: ShopProduct[] = [
  {
    id: "m1",
    title: "FOX Proframe RS 山地速降全盔 透气轻量",
    image: "/products/helmet-1.jpg",
    category: "helmet",
    price: 1899,
    originalPrice: 2380,
    soldText: "3.2万",
    shop: "FOX骑行官方旗舰店",
    rating: 4.9,
    tag: "热销",
    coupon: 100,
    commissionPct: 8,
    douyinLink: "douyin://shop/product/m1",
  },
  {
    id: "m2",
    title: "玛吉斯 防穿刺越野外胎 27.5×2.4 真空胎",
    image: "/products/bike-3.jpg",
    category: "accessory",
    price: 289,
    originalPrice: 399,
    soldText: "1.8万",
    shop: "玛吉斯轮胎专营店",
    rating: 4.8,
    tag: "直降",
    coupon: 30,
    commissionPct: 12,
    douyinLink: "douyin://shop/product/m2",
  },
  {
    id: "m3",
    title: "POC 护膝护肘四件套 越野下坡防摔骑行手套",
    image: "/products/helmet-2.jpg",
    category: "apparel",
    price: 168,
    originalPrice: 259,
    soldText: "9821",
    shop: "POC护具旗舰店",
    rating: 4.9,
    tag: "独家",
    commissionPct: 15,
    douyinLink: "douyin://shop/product/m3",
  },
  {
    id: "m4",
    title: "CamelBak 骑行水袋背包 10L 越野补给",
    image: "/products/gear-1.jpg",
    category: "accessory",
    price: 329,
    originalPrice: 499,
    soldText: "6543",
    shop: "CamelBak户外旗舰店",
    rating: 4.7,
    coupon: 50,
    commissionPct: 10,
    douyinLink: "douyin://shop/product/m4",
  },
  {
    id: "m5",
    title: "崔克 Marlin 7 硬尾山地车 入门越野24速",
    image: "/products/bike-1.jpg",
    category: "bike",
    price: 4280,
    originalPrice: 4980,
    soldText: "3210",
    shop: "TREK崔克官方旗舰店",
    rating: 4.8,
    tag: "新品",
    coupon: 300,
    commissionPct: 5,
    douyinLink: "douyin://shop/product/m5",
  },
];

const CITY_PRODUCTS: ShopProduct[] = [
  {
    id: "c1",
    title: "迈极炫 智能尾灯 刹车感应 夜骑警示灯",
    image: "/products/bike-2.jpg",
    category: "accessory",
    price: 129,
    originalPrice: 199,
    soldText: "4.5万",
    shop: "迈极炫MagicShine旗舰店",
    rating: 4.9,
    tag: "热销",
    coupon: 20,
    commissionPct: 14,
    douyinLink: "douyin://shop/product/c1",
  },
  {
    id: "c2",
    title: "佳明 Edge 540 GPS码表 无线导航功率",
    image: "/products/gear-1.jpg",
    category: "accessory",
    price: 899,
    originalPrice: 1099,
    soldText: "2.1万",
    shop: "佳明Garmin官方旗舰店",
    rating: 4.8,
    tag: "直降",
    coupon: 100,
    commissionPct: 6,
    douyinLink: "douyin://shop/product/c2",
  },
  {
    id: "c3",
    title: "大行 折叠通勤公路车 变速轻量便携",
    image: "/products/ride-1.jpg",
    category: "bike",
    price: 2399,
    originalPrice: 2999,
    soldText: "8765",
    shop: "大行DAHON官方旗舰店",
    rating: 4.7,
    tag: "新品",
    coupon: 200,
    commissionPct: 7,
    douyinLink: "douyin://shop/product/c3",
  },
  {
    id: "c4",
    title: "GUB 一体成型骑行头盔 通勤透气安全",
    image: "/products/helmet-3.jpg",
    category: "helmet",
    price: 259,
    originalPrice: 369,
    soldText: "1.3万",
    shop: "GUB骑行装备旗舰店",
    rating: 4.8,
    tag: "独家",
    coupon: 30,
    commissionPct: 13,
    douyinLink: "douyin://shop/product/c4",
  },
  {
    id: "c5",
    title: "速干骑行服套装 反光夜骑 男女同款长袖",
    image: "/products/helmet-2.jpg",
    category: "apparel",
    price: 199,
    originalPrice: 329,
    soldText: "2.7万",
    shop: "兰帕达骑行服旗舰店",
    rating: 4.6,
    commissionPct: 16,
    douyinLink: "douyin://shop/product/c5",
  },
];

/** 按骑行场景智能选品 (路线匹配) */
export function getGearProducts(scene: SceneKey): ShopProduct[] {
  return scene === "mountain" ? MOUNTAIN_PRODUCTS : CITY_PRODUCTS;
}

/** 到手价折扣, 返回如 "8.0" 表示 8 折 */
export function discountText(price: number, original: number): string {
  if (original <= 0 || price >= original) return "";
  return ((price / original) * 10).toFixed(1);
}
