import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../../utils/api';

export default function DeliveryTrackingScreen() {
  const route = useRoute();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationInterval, setLocationInterval] = useState(null);

  useEffect(() => {
    loadOrder();
    startLocationTracking();

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.order);
      }
    } catch (error) {
      console.error('Load order error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erreur', 'Permission de localisation requise');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      const interval = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({});
        const newLocation = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        };
        setCurrentLocation(newLocation);
        
        try {
          await api.post(`/delivery/${orderId}/location`, newLocation);
        } catch (error) {
          console.error('Update location error:', error);
        }
      }, 10000);

      setLocationInterval(interval);
    } catch (error) {
      console.error('Location tracking error:', error);
    }
  };

  const markAsDelivered = async () => {
    Alert.alert(
      'Confirmation',
      'Marquer cette commande comme livrée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const response = await api.put(`/delivery/${orderId}/status`, {
                statut: 'livree'
              });
              if (response.data.success) {
                Alert.alert('Succès', 'Commande marquée comme livrée');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la mise à jour');
            }
          }
        }
      ]
    );
  };

  if (loading || !order) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const destinationCoords = {
    latitude: parseFloat(order.latitude_livraison) || 0,
    longitude: parseFloat(order.longitude_livraison) || 0
  };

  const merchantCoords = {
    latitude: parseFloat(order.commercant_latitude) || 0,
    longitude: parseFloat(order.commercant_longitude) || 0
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>Livraison #{order.id}</Text>
        <Text style={styles.clientName}>Client: {order.client_nom}</Text>
        <Text style={styles.address}>{order.adresse_livraison}</Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || destinationCoords.latitude || 33.5731,
          longitude: currentLocation?.longitude || destinationCoords.longitude || -7.5898,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Votre position"
            pinColor="blue"
          />
        )}
        {destinationCoords.latitude && destinationCoords.longitude && (
          <Marker
            coordinate={destinationCoords}
            title="Destination"
            pinColor="green"
          />
        )}
        {merchantCoords.latitude && merchantCoords.longitude && (
          <Marker
            coordinate={merchantCoords}
            title="Commerce"
            pinColor="red"
          />
        )}
        {currentLocation && destinationCoords.latitude && (
          <Polyline
            coordinates={[currentLocation, destinationCoords]}
            strokeColor="#3b82f6"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.deliveredButton}
          onPress={markAsDelivered}
        >
          <Text style={styles.deliveredButtonText}>Marquer comme livrée</Text>
        </TouchableOpacity>
      </View>
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
  clientName: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
  },
  map: {
    flex: 1,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  deliveredButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deliveredButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
