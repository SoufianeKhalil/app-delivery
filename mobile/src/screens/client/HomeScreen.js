import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import api, { baseURL } from '../../utils/api';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getLocation();
    loadMerchants();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      loadMerchants(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const loadMerchants = async (lat = null, lng = null) => {
    try {
      setLoading(true);
      const params = {};
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }
      if (search) {
        params.search = search;
      }

      const response = await api.get('/merchants', { params });
      if (response.data.success) {
        setMerchants(response.data.merchants);
      }
    } catch (error) {
      console.error('Load merchants error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMerchant = ({ item }) => (
    <TouchableOpacity
      style={styles.merchantCard}
      onPress={() => navigation.navigate('MerchantDetails', { merchantId: item.id })}
    >
      {item.image && (
        <Image
          source={{ uri: item.image.startsWith('http') ? item.image : `${baseURL.replace('/api', '')}/${item.image}` }}
          style={styles.merchantImage}
        />
      )}
      <View style={styles.merchantInfo}>
        <Text style={styles.merchantName}>{item.nom}</Text>
        <Text style={styles.merchantAddress} numberOfLines={1}>
          {item.adresse}
        </Text>
        {item.distance && (
          <Text style={styles.distance}>{item.distance.toFixed(1)} km</Text>
        )}
        {item.note_moyenne && (
          <View style={styles.rating}>
            <Text>⭐ {parseFloat(item.note_moyenne).toFixed(1)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Commerces disponibles</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            loadMerchants(location?.latitude, location?.longitude);
          }}
        />
      </View>

      <FlatList
        data={merchants}
        renderItem={renderMerchant}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => loadMerchants(location?.latitude, location?.longitude)} />
        }
        contentContainerStyle={styles.list}
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
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  merchantCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  merchantImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#e5e7eb',
  },
  merchantInfo: {
    padding: 16,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  merchantAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  distance: {
    fontSize: 12,
    color: '#3b82f6',
    marginBottom: 4,
  },
  rating: {
    marginTop: 4,
  },
});
