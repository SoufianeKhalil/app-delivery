import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function DeliveryMapScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId, clientLat, clientLng, clientName, clientAddress } = route.params;
  
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distanceKm, setDistanceKm] = useState(0);
  const webViewRef = useRef(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erreur', 'Permission de localisation requise');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc.coords);
      setLoading(false);
    } catch (error) {
      console.error('Erreur localisation:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la localisation');
      setLoading(false);
    }
  };

  const calculateDistance = () => {
    if (!location) return 0;
    
    const lat1 = location.latitude;
    const lon1 = location.longitude;
    const lat2 = parseFloat(clientLat);
    const lon2 = parseFloat(clientLng);

    const R = 6371; // Rayon terrestre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  };

  const generateMapHtml = () => {
    if (!location) return null;
    
    const centerLat = (location.latitude + parseFloat(clientLat)) / 2;
    const centerLng = (location.longitude + parseFloat(clientLng)) / 2;
    
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
        .marker-livreur {
          background: #0284c7;
          border: 3px solid white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .marker-client {
          background: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"><\/div>
      
      <script>
        const map = L.map('map').setView([${centerLat}, ${centerLng}], 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19
        }).addTo(map);

        // Marqueur livreur (bleu)
        const livreurIcon = L.divIcon({
          html: '<div class="marker-livreur">📍<\/div>',
          iconSize: [32, 32],
          className: 'custom-marker'
        });
        
        L.marker([${location.latitude}, ${location.longitude}], { icon: livreurIcon })
          .addTo(map)
          .bindPopup('<b>Votre position<\/b><br>Livreur');

        // Marqueur client (rouge)
        const clientIcon = L.divIcon({
          html: '<div class="marker-client">📍<\/div>',
          iconSize: [32, 32],
          className: 'custom-marker'
        });
        
        L.marker([${clientLat}, ${clientLng}], { icon: clientIcon })
          .addTo(map)
          .bindPopup('<b>${clientName}<\/b><br>${clientAddress}');

        // Ligne entre les deux points
        L.polyline([
          [${location.latitude}, ${location.longitude}],
          [${clientLat}, ${clientLng}]
        ], {
          color: '#0284c7',
          weight: 3,
          opacity: 0.6,
          dashArray: '5, 5'
        }).addTo(map);

        // Centrer pour voir les deux points
        const group = new L.featureGroup([
          L.marker([${location.latitude}, ${location.longitude}]),
          L.marker([${clientLat}, ${clientLng}])
        ]);
        map.fitBounds(group.getBounds().pad(0.1));
      <\/script>
    </body>
    </html>
    `;
  };

  const distance = calculateDistance();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Navigation</Text>
        <View style={{ width: 60 }} />
      </View>
      
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHtml() }}
        style={styles.map}
        scrollEnabled={true}
        zoomEnabled={true}
      />

      {/* Info Overlay */}
      <View style={styles.infoOverlay}>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📦 Commande</Text>
            <Text style={styles.infoValue}>#{orderId}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👤 Client</Text>
            <Text style={styles.infoValue}>{clientName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Adresse</Text>
            <Text style={styles.infoValueSmall}>{clientAddress}</Text>
          </View>

          <View style={[styles.infoRow, styles.distanceRow]}>
            <Text style={styles.distanceLabel}>📏 Distance</Text>
            <Text style={styles.distanceValue}>{distance.toFixed(2)} km</Text>
          </View>
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
  distanceRow: {
    borderBottomWidth: 0,
    backgroundColor: '#f0f9ff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  distanceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0284c7',
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});
