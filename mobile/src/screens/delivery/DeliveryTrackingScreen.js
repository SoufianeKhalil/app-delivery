import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../../utils/api';

export default function DeliveryTrackingScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params;
  
  const [order, setOrder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationInterval, setLocationInterval] = useState(null);
  const webViewRef = useRef(null);

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
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur chargement commande:', error);
      Alert.alert('Erreur', 'Impossible de charger la commande');
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

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      // Mettre à jour la position toutes les 10 secondes
      const interval = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const newLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          };
          setCurrentLocation(newLocation);
          
          // Envoyer au serveur
          try {
            await api.post(`/delivery/${orderId}/location`, newLocation);
          } catch (error) {
            console.error('Erreur envoi location:', error);
          }

          // Mettre à jour la carte
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(
              `updateLivreurMarker(${loc.coords.latitude}, ${loc.coords.longitude}); true;`
            );
          }
        } catch (error) {
          console.error('Erreur localisation:', error);
        }
      }, 10000);

      setLocationInterval(interval);
    } catch (error) {
      console.error('Erreur tracking:', error);
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
                navigation.goBack();
              }
            } catch (error) {
              console.error('Erreur:', error);
              Alert.alert('Erreur', 'Erreur lors de la mise à jour');
            }
          }
        }
      ]
    );
  };

  const generateMapHtml = () => {
    if (!order || !currentLocation) return null;

    const livreurLat = currentLocation.latitude;
    const livreurLng = currentLocation.longitude;
    const clientLat = parseFloat(order.latitude_livraison) || 33.5731;
    const clientLng = parseFloat(order.longitude_livraison) || -7.5898;
    const merchantLat = parseFloat(order.commercant_latitude) || 33.5731;
    const merchantLng = parseFloat(order.commercant_longitude) || -7.5898;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"><\/script>
      <style>
        * { margin: 0; padding: 0; }
        html, body, #map { height: 100%; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"><\/div>
      
      <script>
        let map = null;
        let livreurMarker = null;
        let clientMarker = null;
        let merchantMarker = null;
        let routeLine = null;

        function initMap() {
          const centerLat = (${livreurLat} + ${clientLat}) / 2;
          const centerLng = (${livreurLng} + ${clientLng}) / 2;
          
          map = L.map('map').setView([centerLat, centerLng], 14);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
          }).addTo(map);

          // Marqueur livreur (bleu - position en temps réel)
          livreurMarker = L.circleMarker([${livreurLat}, ${livreurLng}], {
            radius: 10,
            fillColor: '#0284c7',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(map)
            .bindPopup('<b>Votre position<\/b><br>Livreur');

          // Marqueur commerçant (vert - point de départ)
          merchantMarker = L.circleMarker([${merchantLat}, ${merchantLng}], {
            radius: 10,
            fillColor: '#10b981',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(map)
            .bindPopup('<b>Commerçant<\/b><br>Point de départ');

          // Marqueur client (rouge - destination)
          clientMarker = L.circleMarker([${clientLat}, ${clientLng}], {
            radius: 10,
            fillColor: '#ef4444',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(map)
            .bindPopup('<b>Client<\/b><br>Destination');

          // Trajet du livreur au client
          routeLine = L.polyline([
            [${livreurLat}, ${livreurLng}],
            [${clientLat}, ${clientLng}]
          ], {
            color: '#0284c7',
            weight: 3,
            opacity: 0.7,
            dashArray: '5, 5'
          }).addTo(map);

          // Centrer pour voir tout
          const group = new L.featureGroup([livreurMarker, clientMarker, merchantMarker]);
          map.fitBounds(group.getBounds().pad(0.1));
        }

        function updateLivreurMarker(lat, lng) {
          if (!map) return;
          
          if (livreurMarker) {
            livreurMarker.setLatLng([lat, lng]);
          }
          
          if (routeLine) {
            routeLine.setLatLngs([
              [lat, lng],
              [${clientLat}, ${clientLng}]
            ]);
          }
          
          map.setView([lat, lng], 14);
        }

        initMap();
      <\/script>
    </body>
    </html>
    `;
  };

  if (loading || !order || !currentLocation) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Livraison #{order.id}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Map */}
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHtml() }}
        style={styles.map}
        scrollEnabled={true}
        zoomEnabled={true}
      />

      {/* Info Box */}
      <View style={styles.infoOverlay}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Livraison en cours</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👤 Client</Text>
            <Text style={styles.infoValue}>{order.client_nom}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Adresse</Text>
            <Text style={styles.infoValueSmall}>{order.adresse_livraison}</Text>
          </View>

          <TouchableOpacity 
            style={styles.deliveredButton}
            onPress={markAsDelivered}
          >
            <Text style={styles.deliveredButtonText}>✓ Marquer comme livrée</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#0284c7',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  map: {
    flex: 1,
  },
  infoOverlay: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  infoBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    maxWidth: '60%',
    textAlign: 'right',
  },
  infoValueSmall: {
    fontSize: 13,
    color: '#374151',
    maxWidth: '60%',
    textAlign: 'right',
  },
  deliveredButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  deliveredButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});
