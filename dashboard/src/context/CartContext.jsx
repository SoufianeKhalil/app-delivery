import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Charger le panier du localStorage au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart')
      if (stored) setItems(JSON.parse(stored))
    } catch (e) {
      console.error('Erreur lors du chargement du panier:', e)
    }
  }, [])

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items))
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du panier:', e)
    }
  }, [items])

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.produit_id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.produit_id === product.id
            ? { ...item, quantite: item.quantite + quantity }
            : item
        )
      }
      return [
        ...prev,
        {
          produit_id: product.id,
          nom: product.nom,
          prix: product.prix,
          image: product.image,
          quantite: quantity,
          merchant_id: product.merchant_id
        }
      ]
    })
  }

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.produit_id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.produit_id === productId ? { ...item, quantite: quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalItems = () => items.reduce((sum, item) => sum + item.quantite, 0)
  const getTotalPrice = () =>
    items.reduce((sum, item) => sum + item.prix * item.quantite, 0).toFixed(2)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isLoading,
        setIsLoading
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
