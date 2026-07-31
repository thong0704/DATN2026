import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { fetchMyInvoices } from '../services/api';

import { useIsFocused } from '@react-navigation/native';

export default function MyInvoicesScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadInvoices();
    }
  }, [isFocused, token]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await fetchMyInvoices(token);
      setInvoices(data);
    } catch (e) {
      console.log('[Invoices] Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleShare = async (inv) => {
    try {
      const message = `Hóa Đơn Khách Sạn: ${inv.hotelName || ''}\nMã HĐ: ${inv.invoiceId || inv.bookingId}\nNgày: ${inv.date}\nTổng: ${formatCurrency(inv.amount)}`;
      await Share.share({ message });
    } catch (error) {
      console.log('Share error', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Hóa Đơn Thanh Toán 🧾</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : invoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Chưa có hóa đơn thanh toán nào trong CSDL</Text>
          </View>
        ) : (
          invoices.map((inv, idx) => (
            <TouchableOpacity key={idx} style={styles.invoiceCard} onPress={() => setSelectedInvoice(inv)}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.invCode}>{inv.invoiceId || `INV-${inv.bookingId}`}</Text>
                  <Text style={styles.invDate}>Ngày tạo: {inv.date || '2026-07-30'}</Text>
                </View>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>Đã Thanh Toán</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBottom}>
                <Text style={styles.amountLabel}>Tổng Tiền Đã Trả:</Text>
                <Text style={styles.amountValue}>{formatCurrency(inv.amount)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Invoice Detail Modal */}
      <Modal visible={!!selectedInvoice} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedInvoice(null)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            
            <Text style={styles.detailTitle}>Chi Tiết Hóa Đơn</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mã HĐ:</Text>
              <Text style={styles.detailValue}>{selectedInvoice?.invoiceId || selectedInvoice?.bookingId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày:</Text>
              <Text style={styles.detailValue}>{selectedInvoice?.date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Khách Sạn:</Text>
              <Text style={styles.detailValue}>{selectedInvoice?.hotelName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Thanh Toán Bằng:</Text>
              <Text style={styles.detailValue}>{selectedInvoice?.paymentMethod || 'Chuyển Khoản'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trạng Thái:</Text>
              <Text style={[styles.detailValue, { color: '#15803d' }]}>{selectedInvoice?.paymentStatus || 'Thành Công'}</Text>
            </View>

            <View style={styles.divider} />

            {selectedInvoice?.breakdown && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tạm Tính:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedInvoice.breakdown.subtotal)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Thuế (8%):</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedInvoice.breakdown.tax)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Giảm Giá:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedInvoice.breakdown.discount)}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.totalLabel}>Tổng Cộng:</Text>
              <Text style={styles.totalValue}>{formatCurrency(selectedInvoice?.amount)}</Text>
            </View>

            <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(selectedInvoice)}>
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.shareBtnText}>Chia Sẻ Hóa Đơn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  container: {
    padding: SPACING.md,
  },
  invoiceCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invCode: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  invDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paidBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  paidText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  detailCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  shareBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: 20,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  }
});
