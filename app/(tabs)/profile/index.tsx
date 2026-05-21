import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { radii, spacing, useTheme } from "@/utils/Theme/theme";
import { getApiError } from "@/services/auths/auth.service";
import { fetchFeedPosts } from "@/services/posts/post.service";
import type { PostRecord } from "@/services/posts/post.types";
import { getUserById } from "@/services/users/user.service";
import type { PublicUser } from "@/services/users/user.types";
import { useAuth } from "@/utils/Auths/AuthContext";

type Pagination = {
  total?: number;
  totalItems?: number;
  count?: number;
};

type FeedData = {
  items?: PostRecord[];
  pagination?: Pagination;
};

const getInitials = (name?: string, username?: string) => {
  const source = name?.trim() || username?.trim() || "User";

  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const getPostText = (post: PostRecord) => {
  const title = typeof post.title === "string" ? post.title : "";
  const body = typeof post.Body === "string" ? post.Body : "";

  return title || body || "Campus update";
};

const formatYear = (year?: number) => {
  if (!year) return "NA";
  return String(year);
};

const formatStatus = (status?: string) => {
  if (!status) return "Not verified";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function Profile() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [postTotal, setPostTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUser = profile ?? user;
  const initials = useMemo(
    () => getInitials(displayUser?.name, displayUser?.username),
    [displayUser?.name, displayUser?.username],
  );

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const [publicProfile, feedData] = await Promise.all([
        getUserById(user.id),
        fetchFeedPosts({ page: 1, limit: 12, scope: "mine" }),
      ]);

      const typedFeed = feedData as FeedData;
      const nextPosts = Array.isArray(typedFeed?.items) ? typedFeed.items : [];
      const total =
        typedFeed?.pagination?.total ??
        typedFeed?.pagination?.totalItems ??
        typedFeed?.pagination?.count ??
        nextPosts.length;

      setProfile(publicProfile);
      setPosts(nextPosts);
      setPostTotal(total);
    } catch (requestError) {
      setError(getApiError(requestError).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.usernameRow}>
          <Text
            numberOfLines={1}
            style={[styles.username, { color: colors.text }]}
          >
            {displayUser?.username || "profile"}
          </Text>
          {profile?.verification_status === "verified" && (
            <Ionicons
              name="checkmark-circle"
              size={17}
              color={colors.primary}
            />
          )}
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/(tabs)/create")}
            style={styles.headerIcon}
            accessibilityRole="button"
            accessibilityLabel="Create post"
          >
            <Ionicons name="add-circle-outline" size={25} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/settings")}
            style={styles.headerIcon}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Ionicons name="menu-outline" size={28} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.content}
      >
        {!!error && (
          <View
            style={[
              styles.notice,
              { borderColor: colors.error, backgroundColor: colors.card },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={colors.error}
            />
            <Text style={[styles.noticeText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.profileSummary}>
          <View
            style={[
              styles.avatarRing,
              {
                borderColor: colors.text,
                backgroundColor: isDark ? "#1f1f1f" : "#eeeeee",
              },
            ]}
          >
            {displayUser?.profile_pic ? (
              <Image
                source={displayUser.profile_pic}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={[styles.initials, { color: colors.text }]}>
                {initials}
              </Text>
            )}
          </View>

          <View style={styles.stats}>
            <Stat value={postTotal} label="Posts" />
            <Stat value={displayUser?.course || "NA"} label="Course" />
            <Stat value={formatYear(displayUser?.yop)} label="YOP" />
          </View>
        </View>

        <View style={styles.bio}>
          <Text style={[styles.name, { color: colors.text }]}>
            {displayUser?.name || "Unknown User"}
          </Text>
          <Text style={[styles.bioText, { color: colors.text }]}>
            {displayUser?.course
              ? `${displayUser.course} student`
              : "Unilly student"}
          </Text>
          <Text style={[styles.metaText, { color: colors.subText }]}>
            {displayUser?.email || "No email added"}
          </Text>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color={colors.text}
              />
              <Text style={[styles.badgeText, { color: colors.text }]}>
                {formatStatus(profile?.verification_status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <ProfileButton
            label="Edit profile"
            onPress={() => router.push("/settings")}
          />
          <ProfileButton label="Share profile" onPress={handleRefresh} />
        </View>

        <View style={[styles.profileTabs, { borderTopColor: colors.border }]}>
          <View style={[styles.activeTab, { borderBottomColor: colors.text }]}>
            <Ionicons name="grid-outline" size={22} color={colors.text} />
          </View>
          <View style={styles.inactiveTab}>
            <Ionicons name="person-outline" size={22} color={colors.subText} />
          </View>
        </View>

        {posts.length > 0 ? (
          <View style={styles.grid}>
            {posts.map((post, index) => (
              <Pressable
                key={post.id}
                style={({ pressed }) => [
                  styles.gridItem,
                  {
                    backgroundColor:
                      index % 2 === 0
                        ? isDark
                          ? "#151515"
                          : "#f1f1f1"
                        : colors.card,
                    borderColor: colors.bg,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={colors.subText}
                />
                <Text
                  numberOfLines={4}
                  style={[styles.gridText, { color: colors.text }]}
                >
                  {getPostText(post)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { borderColor: colors.text, backgroundColor: colors.bg },
              ]}
            >
              <Ionicons name="camera-outline" size={34} color={colors.text} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Share campus moments
            </Text>
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              When you create posts, they will show up in this grid.
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/create")}>
              <Text style={[styles.createText, { color: colors.primary }]}>
                Create your first post
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.stat}>
      <Text
        numberOfLines={1}
        style={[styles.statValue, { color: colors.text }]}
      >
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function ProfileButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.profileButton,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.profileButtonText, { color: colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  usernameRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  username: {
    maxWidth: "90%",
    fontSize: 21,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: 96,
  },
  notice: {
    margin: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  profileSummary: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },
  initials: {
    fontSize: 28,
    fontWeight: "800",
  },
  stats: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    maxWidth: "100%",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  bio: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 19,
  },
  badgeRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionsRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  profileButton: {
    flex: 1,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  smallIconButton: {
    width: 42,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  profileTabs: {
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 46,
  },
  activeTab: {
    flex: 1,
    borderBottomWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "33.333%",
    aspectRatio: 1,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    gap: spacing.xs,
  },
  gridText: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    fontWeight: "700",
  },
  emptyState: {
    minHeight: 260,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: spacing.sm,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  createText: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontWeight: "800",
  },
});
