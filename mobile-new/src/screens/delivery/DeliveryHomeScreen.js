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

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Commande #{item.id}</Text>
        {item.distance && (
          <Text style={styles.distance}>{item.distance.toFixed(1)} km</Text>
        )}
      </View>
      <Text style={styles.orderProducts}>{item.produits}</Text>
      <Text style={styles.orderTotal}>{item.montant_total} MAD</Text>
      <Text style={styles.merchantAddress}>
        📍 {item.commercant_adresse}
      </Text>
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => acceptDelivery(item.id)}
      >
        <Text style={styles.acceptButtonText}>Accepter la livraison</Text>
      </TouchableOpacity>
    </View>
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
  orderProducts: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  merchantAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
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
