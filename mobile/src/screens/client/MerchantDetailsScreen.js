import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api, { baseURL } from '../../utils/api';

export default function MerchantDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { merchantId } = route.params || {};
  const [merchant, setMerchant] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMerchant();
    loadProducts();
  }, [merchantId]);

  const loadMerchant = async () => {
    try {
      const response = await api.get(`/merchants/${merchantId}`);
      if (response.data.success) {
        setMerchant(response.data.merchant);
      }
    } catch (error) {
      console.error('Load merchant error:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/merchant/${merchantId}`);
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find((p) => p.id === product.id);
    if (existing) {
      setCart(cart.map((p) => (p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const goToCart = () => {
    if (cart.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des produits avant de commander');
      return;
    }
    navigation.navigate('Cart', { cart, merchantId });
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      {item.image && (
        <Image
          source={{ uri: item.image.startsWith('http') ? item.image : `${baseURL.replace('/api', '')}/${item.image}` }}
          style={styles.productImage}
        />
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.nom}</Text>
        <Text style={styles.productPrice}>{item.prix} MAD</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!merchant) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {merchant.image && (
          <Image
            source={{ uri: merchant.image.startsWith('http') ? merchant.image : `${baseURL.replace('/api', '')}/${merchant.image}` }}
            style={styles.merchantImage}
          />
        )}
        <Text style={styles.merchantName}>{merchant.nom}</Text>
        <Text style={styles.merchantAddress}>{merchant.adresse}</Text>
        <TouchableOpacity
          style={[styles.cartButton, cart.length === 0 && styles.cartButtonEmpty]}
          onPress={goToCart}
        >
          <Text style={styles.cartButtonText}>
            Panier ({cart.length}) - Voir le panier
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadProducts} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun produit</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  merchantImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  merchantName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  merchantAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  cartButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cartButtonEmpty: {
    backgroundColor: '#9ca3af',
  },
  cartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    flex: 0.48,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
  },
  productImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  productInfo: {
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
