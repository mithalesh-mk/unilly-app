import { FeedPost } from '@/services/posts/post.types';
import { useTheme } from '@/utils/Theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import ImageCard from './ImageCard';

type PostCardProps = {
  feedData: FeedPost
  onOpenComments: () => void
}
type ImageDimensions = {
  width: number;
  height: number;
};

const getPostImageHeight = (
  postImageWidth: number,
  dimensions?: ImageDimensions,
) => {
  const landscapeHeight = postImageWidth * (9 / 16);
  const portraitHeight = postImageWidth * (5 / 4);

  if (!dimensions?.width || !dimensions?.height) {
    return postImageWidth;
  }

  const naturalHeight = postImageWidth / (dimensions.width / dimensions.height);

  return Math.min(Math.max(naturalHeight, landscapeHeight), portraitHeight);
};

const PostCard = React.memo(function PostCard({ feedData, onOpenComments }: PostCardProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const carouselRef = React.useRef<FlatList<string>>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [expanded, setExpanded] = React.useState(false);
  const [imageDimensions, setImageDimensions] = React.useState<
    Record<string, ImageDimensions>
  >({});

  const [showComments, setShowComments] = React.useState(false)
  const imageUrls = React.useMemo(
    () => feedData.image_urls ?? [],
    [feedData.image_urls],
  );
  const postImageWidth = Math.max(width, 1);
  const likesCount = feedData.stats.likes_count;
  const commentsCount = feedData.stats.comments_count;
  const imageCount = imageUrls.length;
  const visibleImageIndex =
    imageCount > 0 ? Math.min(activeImageIndex, imageCount - 1) : 0;
  const frameImageUrl = imageUrls[0];
  const postImageHeight = getPostImageHeight(
    postImageWidth,
    frameImageUrl ? imageDimensions[frameImageUrl] : undefined,
  );

  React.useEffect(() => {
    let cancelled = false;

    imageUrls.forEach((imageUrl) => {
      if (!imageUrl || imageDimensions[imageUrl]) return;

      Image.getSize(
        imageUrl,
        (imageWidth, imageHeight) => {
          if (cancelled) return;

          setImageDimensions((current) => {
            if (current[imageUrl]) return current;

            return {
              ...current,
              [imageUrl]: { width: imageWidth, height: imageHeight },
            };
          });
        },
        () => undefined,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [imageDimensions, imageUrls]);

  React.useEffect(() => {
    setActiveImageIndex(0);
    scrollX.setValue(0);

    const frame = requestAnimationFrame(() => {
      carouselRef.current?.scrollToOffset({ offset: 0, animated: false });
    });

    return () => cancelAnimationFrame(frame);
  }, [feedData.id, postImageWidth, scrollX]);

  const handleImageScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (imageCount <= 0) return;

      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / postImageWidth,
      );

      setActiveImageIndex(Math.min(Math.max(nextIndex, 0), imageCount - 1));
    },
    [imageCount, postImageWidth],
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.postHeader}>
        <Image
          source={{
            uri: feedData?.author?.profile_pic,
          }}
          style={[
            styles.avatar,
            { backgroundColor: colors.bg, borderColor: colors.border },
          ]}
        />

        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: colors.text }]}>
            {feedData?.author?.username}
          </Text>

          <Text style={[styles.name, { color: colors.subText }]}>
            {feedData?.author?.name}
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.75} style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.postContent}>
        {feedData?.body ? (
          <View>
            <Text
              style={[styles.body, { color: colors.text }]}
              numberOfLines={expanded ? undefined : 3}
              ellipsizeMode="tail"
            >
              {feedData.body}
            </Text>
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text style={{ color: colors.subText }}>
                {expanded ? 'Show less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {imageCount > 0 && (
        <View
          style={[
            styles.postImageFrame,
            { height: postImageHeight },
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <FlatList
            key={`${feedData.id}-${postImageWidth}`}
            ref={carouselRef}
            data={imageUrls}
            horizontal
            bounces={false}
            decelerationRate="normal"
            disableIntervalMomentum
            directionalLockEnabled
            getItemLayout={(_, index) => ({
              length: postImageWidth,
              offset: postImageWidth * index,
              index,
            })}
            onMomentumScrollEnd={handleImageScrollEnd}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false },
            )}
            overScrollMode="never"
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={postImageWidth}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <View style={{ width: postImageWidth, height: postImageHeight }}>
                <ImageCard imageUrl={item} />
              </View>
            )}
          />

          {imageCount > 0 && (
            <>
              <View
                style={[
                  styles.imageCounter,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.imageCounterText, { color: colors.text }]}>
                  {visibleImageIndex + 1}/{imageCount}
                </Text>
              </View>

              <View style={styles.imageDots}>
                {imageUrls.map((imageUrl, index) => (
                  <Animated.View
                    key={`${imageUrl}-${index}-dot`}
                    style={[
                      styles.imageDot,
                      {
                        backgroundColor:
                          index === visibleImageIndex
                            ? colors.primary
                            : colors.border,
                        transform: [
                          {
                            scale: scrollX.interpolate({
                              inputRange: [
                                (index - 1) * postImageWidth,
                                index * postImageWidth,
                                (index + 1) * postImageWidth,
                              ],
                              outputRange: [1, 1.45, 1],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      )}
      <View style={styles.postActions}>
        <View style={styles.primaryActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.actionIconButton}
          >
            <Ionicons name="heart-outline" size={27} color={colors.text} />
            <Text style={[styles.likesText, { color: colors.text }]}>
              {likesCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.actionIconButton}
            onPress={onOpenComments}
          >
            <Ionicons name="chatbubble-outline" size={27} color={colors.text} />
            <Text style={[styles.likesText, { color: colors.text }]}>
              {commentsCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.actionIconButton}
          >
            <Ionicons
              name="paper-plane-outline"
              size={27}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.75} style={styles.actionIconButton}>
          <Ionicons name="bookmark-outline" size={27} color={colors.text} />
        </TouchableOpacity>
      </View>
      
    </View>
  );
});

export default PostCard;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  listContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
  },

  emptyCard: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 24,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },

  footerLoader: {
    paddingVertical: 20,
  },

  listHeader: {
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  headerCopy: {
    gap: 6,
  },

  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  screenTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0,
  },

  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  feedPill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  feedPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },

  postHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
  },

  userInfo: {
    flex: 1,
    marginLeft: 12,
  },

  username: {
    fontSize: 14,
    fontWeight: '800',
  },

  name: {
    fontSize: 12,
    marginTop: 2,
  },

  moreButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },

  body: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },

  postImageFrame: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },

  postImage: {
    width: '100%',
    height: '100%',
  },

  imageCounter: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: 'absolute',
    right: 10,
    top: 10,
  },

  imageCounterText: {
    fontSize: 12,
    fontWeight: '800',
  },

  imageDots: {
    alignItems: 'center',
    bottom: 10,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },

  imageDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },

  postActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },

  primaryActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  actionIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  postContent: {
    paddingBottom: 14,
    paddingHorizontal: 14,
    paddingTop: 4,
  },

  likesText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },

  caption: {
    fontSize: 14,
    lineHeight: 20,
  },

  captionAuthor: {
    fontWeight: '800',
  },

  commentsText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
});
