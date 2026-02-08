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
import api from '../../utils/api';

export default function DeliveryOrdersScreen() {
  const navigation = useNavigation();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/delivery/my-deliveries');
      if (response.data.success) {
        setDeliveries(response.data.deliveries);
      }
    } catch (error) {
      console.error('Load deliveries error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const response = await api.put(`/delivery/${orderId}/status`, { statut: status });
      if (response.data.success) {
        Alert.alert('Succès', 'Statut mis à jour');
        loadDeliveries();
        if (status === 'livree') {
          navigation.goBack();
        }
      }
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'en_livraison': '#8b5cf6',
      'livree': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const renderDelivery = ({ item }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <Text style={styles.deliveryId}>Commande #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.statut) }]}>
            {item.statut === 'en_livraison' ? 'En cours' : 'Livrée'}
          </Text>
        </View>
      </View>
      <Text style={styles.deliveryProducts}>{item.produits}</Text>
      <Text style={styles.clientAddress}>
        📍 {item.client_adresse}
      </Text>
      <Text style={styles.deliveryTotal}>{item.montant_total} MAD</Text>
      
      {item.statut === 'en_livraison' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => navigation.navigate('DeliveryTracking', { orderId: item.id })}
          >
            <Text style={styles.trackButtonText}>Suivre sur la carte</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => updateStatus(item.id, 'livree')}
          >
            <Text style={styles.completeButtonText}>Marquer comme livrée</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDeliveries} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune livraison</Text>
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
  list: {
    padding: 16,
  },
  deliveryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryId: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deliveryProducts: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  clientAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  deliveryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 12,
  },
  actions: {
    gap: 8,
  },
  trackButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
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
