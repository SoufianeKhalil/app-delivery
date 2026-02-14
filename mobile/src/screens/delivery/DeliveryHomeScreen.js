import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../../utils/api';

export default function DeliveryHomeScreen() {
  const navigation = useNavigation();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getLocation();
    loadAvailableOrders();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erreur', 'Permission de localisation requise');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      loadAvailableOrders(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const loadAvailableOrders = async (lat = null, lng = null) => {
    try {
      setLoading(true);
      const params = {};
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }

      const response = await api.get('/delivery/available', { params });
      if (response.data.success) {
        setAvailableOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptDelivery = async (orderId) => {
    try {
      const response = await api.post(`/delivery/${orderId}/accept`);
      if (response.data.success) {
        Alert.alert('Succès', 'Livraison acceptée');
        loadAvailableOrders(location?.latitude, location?.longitude);
        navigation.navigate('DeliveryTracking', { orderId });
      }
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'acceptation');
    }
  };

  const refuseDelivery = async (orderId) => {
    Alert.alert(
      'Refuser la commande',
      'Êtes-vous sûr de vouloir refuser cette commande ?',
      [
        { text: 'Non', onPress: () => {}, style: 'cancel' },
        {
          text: 'Oui, refuser',
          onPress: async () => {
            try {
              const response = await api.post(`/delivery/${orderId}/refuse`);
              if (response.data.success) {
                Alert.alert('Succès', 'Commande refusée');
                loadAvailableOrders(location?.latitude, location?.longitude);
              }
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors du refus');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const openDeliveryMap = (order) => {
    navigation.navigate('DeliveryMap', {
      orderId: order.id,
      clientLat: parseFloat(order.client_latitude),
      clientLng: parseFloat(order.client_longitude),
      clientName: order.client_nom,
      clientAddress: order.client_adresse,
    });
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity onPress={() => openDeliveryMap(item)}>
    <View style={styles.orderCard}>
      {/* Header with Order Number and Distance */}
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Commande #{item.id}</Text>
        {item.distance && (
          <Text style={styles.distance}>{item.distance.toFixed(1)} km</Text>
        )}
      </View>

      {/* Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Produits</Text>
        <Text style={styles.orderProducts}>{item.produits}</Text>
      </View>

      {/* Total */}
      <View style={styles.totalSection}>
        <Text style={styles.orderTotal}>{item.montant_total} DT</Text>
      </View>

      {/* Merchant Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À chercher chez</Text>
        <Text style={styles.infoText}>🏪 {item.commercant_nom}</Text>
        <Text style={styles.infoText}>📍 {item.commercant_adresse}</Text>
      </View>

      {/* Client Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À livrer à</Text>
        <Text style={styles.infoText}>👤 {item.client_nom}</Text>
        <Text style={styles.infoText}>📱 {item.telephone || 'N/A'}</Text>
        <Text style={styles.infoText}>📍 {item.client_adresse || 'Adresse à définir'}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.acceptButton, { flex: 1, marginRight: 8 }]}
          onPress={() => acceptDelivery(item.id)}
        >
          <Text style={styles.acceptButtonText}>✓ Accepter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.refuseButton, { flex: 1 }]}
          onPress={() => refuseDelivery(item.id)}
        >
          <Text style={styles.refuseButtonText}>✕ Refuser</Text>
        </TouchableOpacity>
      </View>
    </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Commandes disponibles</Text>
        <Text style={styles.subtitle}>Sélectionnez une commande à livrer</Text>
      </View>

      <FlatList
        data={availableOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadAvailableOrders(location?.latitude, location?.longitude)}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune commande disponible</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
  },
  distance: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  section: {
    marginVertical: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginVertical: 3,
    lineHeight: 20,
  },
  orderProducts: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  totalSection: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  acceptButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  refuseButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refuseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
