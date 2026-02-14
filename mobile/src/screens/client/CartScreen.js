import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import LocationPickerMobile from '../../components/LocationPickerMobile';
import api from '../../utils/api';

export default function CartScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cart, merchantId } = route.params || { cart: [], merchantId: null };
  const [cartItems, setCartItems] = useState(cart || []);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [Phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const updateQuantity = (productId, change) => {
    setCartItems(items =>
      items.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + change;
          if (newQuantity <= 0) {
            return null;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.prix * item.quantity, 0);
  };

  const getLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erreur', 'Permission de localisation refusée');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      setLocation(currentLocation.coords);
      setAddress(`Position capturée (${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)})`);
      Alert.alert('Succès', 'Position capturée avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder à votre position');
      console.error('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSelect = (locationData) => {
    setLocation({
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
    setAddress(locationData.address);
  };

  const handleOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Erreur', 'Votre panier est vide');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse de livraison');
      return;
    }

    if (!Phone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/orders', {
        produits: cartItems.map(item => ({
          produit_id: item.id,
          quantite: item.quantity
        })),
        adresse_livraison: address,
        methode_paiement: paymentMethod,
        telephone: Phone,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null
      });

      if (response.data.success) {
        Alert.alert('Succès', 'Commande passée avec succès', [
          { text: 'OK', onPress: () => navigation.navigate('ClientTabs') }
        ]);
      }
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Cart Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre Panier</Text>
          {cartItems.length === 0 ? (
            <Text style={styles.emptyText}>Aucun article dans le panier</Text>
          ) : (
            cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.nom}</Text>
                  <Text style={styles.itemPrice}>{item.prix} DT/unité</Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, -1)}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Checkout Form */}
        {showCheckout && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Finaliser la commande</Text>

            {/* Address */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Adresse de livraison *</Text>
              <LocationPickerMobile 
                onLocationSelect={handleLocationSelect}
                initialLat={location?.latitude || 36.8}
                initialLng={location?.longitude || 10.2}
              />
              <TextInput
                style={styles.input}
                placeholder="Entrez votre adresse"
                value={address}
                onChangeText={setAddress}
              />
              {location && (
                <Text style={styles.coordsText}>
                  Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                </Text>
              )}
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Téléphone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+216 90 123 456"
                value={Phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Payment Method */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Méthode de paiement</Text>
              <TouchableOpacity
                style={[styles.radioOption, paymentMethod === 'cash' && styles.radioSelected]}
                onPress={() => setPaymentMethod('cash')}
              >
                <Text style={styles.radioText}>💵 Paiement à la livraison</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{getTotal().toFixed(2)} DT</Text>
        </View>
        {!showCheckout ? (
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => setShowCheckout(true)}
          >
            <Text style={styles.proceedButtonText}>Continuer vers le paiement</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.orderButton, loading && styles.orderButtonDisabled]}
            onPress={handleOrder}
            disabled={loading}
          >
            <Text style={styles.orderButtonText}>
              {loading ? 'Traitement...' : 'Confirmer la commande'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f2937',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginVertical: 20,
  },
  cartItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1f2937',
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
    color: '#1f2937',
  },
  locationButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  coordsText: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 6,
  },
  radioOption: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  radioSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  radioText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  proceedButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
