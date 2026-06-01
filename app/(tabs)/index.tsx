import React from 'react';

import { fetchFeedPosts } from '@/services/posts/post.service';
import { FlashList } from '@shopify/flash-list';
import { BodyText, ThemedScreen } from '@/utils/Theme/ThemedScreen';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeedPost } from '@/services/posts/post.types';
import { useTheme } from '@/utils/Theme/theme';

const Home = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [posts, setPosts] = React.useState<FeedPost[]>([]);
  const pageRef = React.useRef(1);
  const isFetchingRef = React.useRef(false);
  const hasNextPageRef = React.useRef(true);
  const { colors } = useTheme();

  const fetchPosts = React.useCallback(async ({ reset = false } = {}) => {
    if (isFetchingRef.current || (!reset && !hasNextPageRef.current)) return;

    isFetchingRef.current = true;
    setLoading(!reset);
    setRefreshing(reset);
    setError(null);

    try {
      const nextPage = reset ? 1 : pageRef.current;
      const data = await fetchFeedPosts({
        page: nextPage,
        limit: 20,
        scope: 'all',
      });
      const items = data.data.items ?? [];
      const pagination = data.data.pagination;

      setPosts((prev) => {
        const basePosts = reset ? [] : prev;
        const seenPostIds = new Set(basePosts.map((post) => post.id));
        const uniqueItems = items.filter((post) => {
          if (seenPostIds.has(post.id)) return false;

          seenPostIds.add(post.id);
          return true;
        });

        return [...basePosts, ...uniqueItems];
      });

      hasNextPageRef.current = Boolean(pagination?.has_next);
      pageRef.current = pagination?.page ? pagination.page + 1 : nextPage + 1;
    } catch (err: any) {
      setError(err.message || 'Failed to load posts.');
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const renderPost = React.useCallback(
    ({ item }: { item: FeedPost }) => <PostCard feedData={item} />,
    [],
  );

  const keyExtractor = React.useCallback((item: FeedPost) => {
    return item.id.toString();
  }, []);

  const handleRefresh = React.useCallback(() => {
    fetchPosts({ reset: true });
  }, [fetchPosts]);

  const handleEndReached = React.useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (error && posts.length === 0 && !loading) {
    return (
      <ThemedScreen title="Home">
        <BodyText>{error}</BodyText>
      </ThemedScreen>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
      <FlashList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.35}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        removeClippedSubviews
        // initialNumToRender={6}
        // maxToRenderPerBatch={8}
        // updateCellsBatchingPeriod={50}
        // windowSize={7}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="newspaper-outline"
                size={28}
                color={colors.subText}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No posts yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.subText }]}>
                Pull down to refresh or check back later.
              </Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.headerCopy}>
              <View style={styles.headerTitleRow}>
                <Text style={[styles.screenTitle, { color: colors.text }]}>
                  Home
                </Text>
                <View
                  style={[
                    styles.feedPill,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="radio-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.feedPillText, { color: colors.text }]}>
                    Feed
                  </Text>
                </View>
              </View>
              <Text style={[styles.screenSubtitle, { color: colors.subText }]}>
                Catch the latest posts from your campus.
              </Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

type PostCardProps = {
  feedData: FeedPost;
};

const PostCard = React.memo(function PostCard({ feedData }: PostCardProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const carouselRef = React.useRef<FlatList<string>>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const imageUrls = feedData.image_urls ?? [];
  const postImageWidth = Math.max(width, 1);
  const likesCount = feedData.stats.likes_count;
  const commentsCount = feedData.stats.comments_count;
  const imageCount = imageUrls.length;
  const visibleImageIndex =
    imageCount > 0 ? Math.min(activeImageIndex, imageCount - 1) : 0;

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

      {imageCount > 0 && (
        <View
          style={[
            styles.postImageFrame,
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
              <View style={{ width: postImageWidth }}>
                <Image
                  source={{ uri: item }}
                  style={[styles.postImage, { width: postImageWidth }]}
                  resizeMode="contain"
                />
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
          <TouchableOpacity activeOpacity={0.75} style={styles.actionIconButton}>
            <Ionicons name="heart-outline" size={25} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.75} style={styles.actionIconButton}>
            <Ionicons
              name="chatbubble-outline"
              size={23}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.75} style={styles.actionIconButton}>
            <Ionicons name="paper-plane-outline" size={23} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.75} style={styles.actionIconButton}>
          <Ionicons name="bookmark-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.postContent}>
        <Text style={[styles.likesText, { color: colors.text }]}>
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </Text>

        <Text style={[styles.caption, { color: colors.text }]}>
          <Text style={styles.captionAuthor}>{feedData?.author?.username}</Text>
          {feedData?.title ? ` ${feedData.title}` : ''}
        </Text>

        {feedData?.body ? (
          <Text style={[styles.body, { color: colors.text }]}>
            {feedData.body}
          </Text>
        ) : null}

        {commentsCount > 0 && (
          <TouchableOpacity activeOpacity={0.75}>
            <Text style={[styles.commentsText, { color: colors.subText }]}>
              View all {commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

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
    aspectRatio: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },

  postImage: {
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
  },

  primaryActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },

  actionIconButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },

  postContent: {
    paddingBottom: 14,
    paddingHorizontal: 14,
    paddingTop: 4,
  },

  likesText: {
    fontSize: 14,
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

export default Home;
