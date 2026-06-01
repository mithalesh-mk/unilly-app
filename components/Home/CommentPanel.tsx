import Ionicons from '@expo/vector-icons/Ionicons';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
  TouchableOpacity,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';

type Comment = {
  id: string;
  username: string;
  comment: string;
  createdAt: string;
};

type CommentPanelProps = {
  visible: boolean;
  comments: Comment[];
  onClose: () => void;
  onSendComment?: (text: string) => void;
  colors: {
    bg: string;
    card: string;
    text: string;
    border: string;
    placeholder: string;
    primary: string;
  };
};

export default function CommentPanel({
  visible,
  comments,
  onClose,
  onSendComment,
  colors,
}: CommentPanelProps) {
  const sheetRef =
    React.useRef<React.ElementRef<typeof BottomSheetModal>>(null);
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');
  const [isMounted, setIsMounted] = useState(visible);
  const [sheetKey, setSheetKey] = useState(0);
  const closingRef = React.useRef(false);

  const snapPoints = useMemo(() => ['99%'], []);
  const disabled = useMemo(
    () => commentText.trim().length === 0,
    [commentText],
  );

    React.useEffect(() => {
    if (!isMounted) return;

    const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
        sheetRef.current?.dismiss();
        return true; 
        },
    );

    return () => subscription.remove();
    }, [isMounted]);

  React.useEffect(() => {
    if (visible) {
      closingRef.current = false;
      setIsMounted(true);
      setSheetKey((current) => current + 1);
      return;
    }

    if (isMounted) {
      sheetRef.current?.dismiss();
    }
  }, [isMounted, visible]);

  React.useEffect(() => {
    if (!isMounted) return;

    const frame = requestAnimationFrame(() => {
      sheetRef.current?.present();
    });

    return () => cancelAnimationFrame(frame);
  }, [isMounted, sheetKey]);

  const handleSend = React.useCallback(() => {
    const trimmed = commentText.trim();

    if (!trimmed) return;

    onSendComment?.(trimmed);
    setCommentText('');
  }, [commentText, onSendComment]);

  const handleDismiss = React.useCallback(() => {
    setIsMounted(false);

    if (closingRef.current) return;

    closingRef.current = true;
    onClose();

    requestAnimationFrame(() => {
      closingRef.current = false;
    });
  }, [onClose]);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  const renderComment = React.useCallback(
    ({ item }: { item: Comment }) => (
      <View style={styles.commentRow}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {item.username.slice(0, 1).toUpperCase()}
          </Text>
        </View>

        <View style={styles.commentBody}>
          <View
            style={[
              styles.commentBubble,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.commentMetaRow}>
              <Text
                numberOfLines={1}
                style={[styles.username, { color: colors.text }]}
              >
                {item.username}
              </Text>
              <Text style={[styles.timeText, { color: colors.placeholder }]}>
                {item.createdAt}
              </Text>
            </View>

            <Text style={[styles.commentText, { color: colors.text }]}>
              {item.comment}
            </Text>
          </View>

          <View style={styles.commentActions}>
            <TouchableOpacity activeOpacity={0.75}>
              <Text style={[styles.actionText, { color: colors.placeholder }]}>
                Like
              </Text>
            </TouchableOpacity>
            <Text style={[styles.actionDot, { color: colors.placeholder }]}>
              •
            </Text>
            <TouchableOpacity activeOpacity={0.75}>
              <Text style={[styles.actionText, { color: colors.placeholder }]}>
                Reply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [
      colors.border,
      colors.card,
      colors.placeholder,
      colors.primary,
      colors.text,
    ],
  );

  const ListHeaderComponent = React.useMemo(
    () => (
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top, 10),
          },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Comments
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            sheetRef.current?.dismiss();
          }}
          style={[styles.closeButton, { backgroundColor: colors.card }]}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    ),
    [
      colors.border,
      colors.card,
      colors.placeholder,
      colors.text,
      comments.length,
      insets.top,
    ],
  );

  const ListEmptyComponent = React.useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.placeholder }]}>
          No comments yet
        </Text>
      </View>
    ),
    [colors.placeholder],
  );

  if (!isMounted) return null;

  return (
    <BottomSheetModal
      key={sheetKey}
      ref={sheetRef}
      keyboardBehavior="interactive"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg }}
      enablePanDownToClose
      handleIndicatorStyle={{ backgroundColor: '#fff' }}
      handleStyle={[
        styles.handle,
        {
          backgroundColor: colors.bg,
          borderBottomColor: colors.border,
        },
      ]}
      keyboardBlurBehavior="restore"
      onDismiss={handleDismiss}
      snapPoints={snapPoints}
    //   topInset={insets.top}
    >
      <View style={{ flex: 1 }}>
        <BottomSheetFlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={ListEmptyComponent}
          ListHeaderComponent={ListHeaderComponent}
          contentContainerStyle={[
            styles.commentList,
            comments.length === 0 && styles.emptyList,
          ]}
          renderItem={renderComment}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.bg,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom || 12,
            },
          ]}
        >
          <View
            style={[styles.inputAvatar, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.avatarText}>Y</Text>
          </View>

          <View
            style={[
              styles.composer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <BottomSheetTextInput
              multiline
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor={colors.placeholder}
              style={[styles.input, { color: colors.text }]}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={!commentText.trim()}
              onPress={handleSend}
              style={[
                styles.sendButton,
                {
                  backgroundColor: !commentText.trim()
                    ? '#888'
                    : colors.primary,
                },
              ]}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  handle: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 18,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  closeButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },

  commentList: {
    paddingBottom: 110,
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  emptyList: {
    flexGrow: 1,
  },

  commentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },

  avatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },

  inputAvatar: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    marginTop: 4,
    width: 34,
  },

  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  commentBody: {
    flex: 1,
  },

  commentBubble: {
    borderRadius: 12,
    borderTopLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  commentMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },

  username: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },

  commentText: {
    fontSize: 14,
    lineHeight: 19,
  },

  timeText: {
    fontSize: 11,
  },

  commentActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 5,
    paddingLeft: 10,
  },

  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },

  actionDot: {
    fontSize: 11,
    fontWeight: '800',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },

  emptyText: {
    fontSize: 15,
  },

  footer: {
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  composer: {
    alignItems: 'flex-end',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
  },

  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 110,
    minHeight: 34,
    paddingBottom: 7,
    paddingTop: 7,
  },

  sendButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});
