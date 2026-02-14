import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

export default function LocationPickerMobile({ onLocationSelect, initialLat, initialLng }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState(initialLat || 36.8);
  const [lng, setLng] = useState(initialLng || 10.2);
  const webViewRef = useRef(null);

  const handleGetLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erreur', 'Permission de localisation refusée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      setLat(location.coords.latitude);
      setLng(location.coords.longitude);
      
      // Update map
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `updateMap(${location.coords.latitude}, ${location.coords.longitude}); true;`
        );
      }
      
      Alert.alert('Succès', 'Position capturée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accéder à la localisation');
      console.error('Location error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'mapClick') {
      setLat(data.latitude);
      setLng(data.longitude);
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      latitude: lat,
      longitude: lng,
      address: `Position: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    });
    setIsOpen(false);
  };

  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { height: 100%; width: 100%; }
    .info {
      position: fixed;
      bottom: 20px;
      left: 10px;
      right: 10px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="info">
    <strong>Latitude:</strong> <span id="lat">${lat.toFixed(6)}</span><br/>
    <strong>Longitude:</strong> <span id="lng">${lng.toFixed(6)}</span>
  </div>

  <script>
    let map = L.map('map').setView([${lat}, ${lng}], 13);
    let marker = null;
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    function updateMarker(latitude, longitude) {
      if (marker) {
        marker.setLatLng([latitude, longitude]);
      } else {
        marker = L.marker([latitude, longitude]).addTo(map);
      }
      map.setView([latitude, longitude], 13);
      document.getElementById('lat').textContent = latitude.toFixed(6);
      document.getElementById('lng').textContent = longitude.toFixed(6);
      
      // Send to React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapClick',
        latitude: latitude,
        longitude: longitude
      }));
    }

    function updateMap(latitude, longitude) {
      updateMarker(latitude, longitude);
    }

    // Initialize marker
    marker = L.marker([${lat}, ${lng}]).addTo(map);

    // Click to set location
    map.on('click', function(e) {
      updateMarker(e.latlng.lat, e.latlng.lng);
    });
  </script>
</body>
</html>
  `;

  return (
    <>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.locationButtonText}>📍 Sélectionner sur la carte</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.closeButtonText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Votre localisation</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* WebView Map */}
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.webview}
            onMessage={handleMapMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />

          {/* Info Overlay */}
          <View style={styles.infoOverlay}>
            <View style={styles.coordsBox}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <Text style={styles.coordValue}>{lat.toFixed(6)}</Text>
              
              <Text style={styles.coordLabel}>Longitude</Text>
              <Text style={styles.coordValue}>{lng.toFixed(6)}</Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.getLocationButton, loading && styles.buttonDisabled]}
              onPress={handleGetLocation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.getLocationButtonText}>📍 Ma position actuelle</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Terminé</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
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
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  coordsBox: {
    marginBottom: 12,
  },
  coordLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    marginTop: 8,
  },
  coordValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 6,
  },
  getLocationButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  getLocationButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  locationButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  locationButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
