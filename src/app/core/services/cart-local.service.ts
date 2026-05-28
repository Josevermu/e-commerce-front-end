import { Injectable } from '@angular/core';

export interface CartLocalItem {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  sellerId: string;
  categoria?: string;
}

/**
 * CartLocalService — Carrito de compras en memoria local.
 * No requiere backend. Los items se guardan en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class CartLocalService {
  private readonly KEY = 'konrad_cart';

  getItems(): CartLocalItem[] {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) ?? '[]');
    } catch { return []; }
  }

  addItem(item: CartLocalItem): void {
    const items = this.getItems();
    const existing = items.find(i => i.productoId === item.productoId);
    if (existing) {
      existing.cantidad += item.cantidad;
    } else {
      items.push(item);
    }
    localStorage.setItem(this.KEY, JSON.stringify(items));
  }

  removeItem(productoId: string): void {
    const items = this.getItems().filter(i => i.productoId !== productoId);
    localStorage.setItem(this.KEY, JSON.stringify(items));
  }

  updateQuantity(productoId: string, cantidad: number): void {
    const items = this.getItems().map(i =>
      i.productoId === productoId ? { ...i, cantidad } : i
    );
    localStorage.setItem(this.KEY, JSON.stringify(items));
  }

  clear(): void {
    localStorage.removeItem(this.KEY);
  }

  getTotal(): number {
    return this.getItems().reduce((s, i) => s + i.precio * i.cantidad, 0);
  }

  getCount(): number {
    return this.getItems().reduce((s, i) => s + i.cantidad, 0);
  }
}