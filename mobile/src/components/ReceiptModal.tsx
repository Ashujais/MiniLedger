import React from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

interface ReceiptModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  imageUrl,
  onClose
}) => {
  const [loading, setLoading] = React.useState(true);

  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Text style={styles.title}>Attached Receipt Photo</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        {/* Image Container */}
        <View style={styles.imageWrapper}>
          {loading && (
            <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
          )}
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullImage}
            resizeMode="contain"
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700'
  },
  closeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20
  },
  loader: {
    position: 'absolute'
  },
  fullImage: {
    width: '100%',
    height: '100%'
  }
});
