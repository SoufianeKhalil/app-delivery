import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRoute } from '@react-navigation/native';
import api, { baseURL } from '../../utils/api';
import io from 'socket.io-client';

export default function OrderTrackingScreen() {
  const route = useRoute();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    
    const socketUrl = baseURL.replace('/api', '');
    const socket = io(socketUrl, {
      transports: ['websocket']
    });
    
    socket.on('connect', () => {
      socket.emit('join-room', order?.client_id);
    });

    socket.on('delivery-location', (data) => {
      if (data.commande_id === orderId) {
        setDeliveryLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    });

    socket.on('order-updated', (data) => {
      if (data.commande_id === orderId) {
        loadOrder();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.order);
        if (response.data.order.livreur_latitude && response.data.order.livreur_longitude) {
          setDeliveryLocation({
            latitude: parseFloat(response.data.order.livreur_latitude),
            longitude: parseFloat(response.data.order.livreur_longitude)
          });
        }
      }
    } catch (error) {
      console.error('Load order error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const deliveryCoords = deliveryLocation || {
    latitude: parseFloat(order.livreur_latitude) || 0,
    longitude: parseFloat(order.livreur_longitude) || 0
  };

  const clientCoords = {
    latitude: parseFloat(order.latitude_livraison) || 0,
    longitude: parseFloat(order.longitude_livraison) || 0
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>Suivi de la commande #{order.id}</Text>
        <Text style={styles.status}>
          Statut: {order.statut === 'en_livraison' ? 'En cours de livraison' : order.statut}
        </Text>
        {order.livreur_nom && (
          <Text style={styles.deliveryPerson}>
            Livreur: {order.livreur_nom}
          </Text>
        )}
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: deliveryCoords.latitude || clientCoords.latitude || 33.5731,
          longitude: deliveryCoords.longitude || clientCoords.longitude || -7.5898,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {deliveryCoords.latitude && deliveryCoords.longitude && (
          <Marker
            coordinate={deliveryCoords}
            title="Livreur"
            pinColor="blue"
          />
        )}
        {clientCoords.latitude && clientCoords.longitude && (
          <Marker
            coordinate={clientCoords}
            title="Destination"
            pinColor="green"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  deliveryPerson: {
    fontSize: 14,
    color: '#3b82f6',
  },
  map: {
    flex: 1,
  },
});
