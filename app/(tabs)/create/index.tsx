import { Ionicons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getApiError } from "@/services/auths/auth.service";
import { createPost, uploadPostMedia } from "@/services/posts/post.service";
import { radii, spacing, useTheme } from "@/utils/Theme/theme";

const MAX_DESCRIPTION = 1000;
const MAX_IMAGES = 5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const PREVIEW_STAGE_HEIGHT = 330;

type ImageRatio = "portrait" | "landscape";

type SelectedImage = {
  id: string;
  uri: string;
  name?: string;
  type?: string;
  width?: number;
  height?: number;
  ratio: ImageRatio;
  focusX: number;
  focusY: number;
  zoom: number;
};

const getDefaultRatio = (asset: ImagePicker.ImagePickerAsset): ImageRatio => {
  if (!asset.width || !asset.height) return "portrait";
  return asset.width > asset.height ? "landscape" : "portrait";
};

const clampFocus = (value: number) => Math.max(0, Math.min(1, value));

const clampZoom = (value: number) =>
  Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));

const getTargetAspectRatio = (ratio: ImageRatio) =>
  ratio === "portrait" ? 4 / 5 : 16 / 9;

const getCropFrameSize = (ratio: ImageRatio, width: number) => {
  const maxWidth = Math.max(220, width - spacing.md * 4);
  const maxHeight = PREVIEW_STAGE_HEIGHT - spacing.md * 2;
  const targetAspectRatio = getTargetAspectRatio(ratio);

  if (ratio === "portrait") {
    const frameHeight = maxHeight;
    const frameWidth = frameHeight * targetAspectRatio;

    return {
      width: Math.min(frameWidth, maxWidth * 0.78),
      height: Math.min(maxHeight, (maxWidth * 0.78) / targetAspectRatio),
    };
  }

  const frameWidth = maxWidth;

  return {
    width: frameWidth,
    height: frameWidth / targetAspectRatio,
  };
};

const getCropMetrics = (image: SelectedImage) => {
  if (!image.width || !image.height) return null;

  const sourceWidth = image.width;
  const sourceHeight = image.height;
  const targetAspectRatio = getTargetAspectRatio(image.ratio);
  const sourceAspectRatio = sourceWidth / sourceHeight;
  const baseCropWidth =
    sourceAspectRatio > targetAspectRatio
      ? sourceHeight * targetAspectRatio
      : sourceWidth;
  const baseCropHeight =
    sourceAspectRatio > targetAspectRatio
      ? sourceHeight
      : sourceWidth / targetAspectRatio;
  const cropWidth = Math.max(1, Math.round(baseCropWidth / image.zoom));
  const cropHeight = Math.max(1, Math.round(baseCropHeight / image.zoom));
  const maxOriginX = Math.max(0, sourceWidth - cropWidth);
  const maxOriginY = Math.max(0, sourceHeight - cropHeight);
  const originX = Math.round(maxOriginX * image.focusX);
  const originY = Math.round(maxOriginY * image.focusY);

  return {
    sourceWidth,
    sourceHeight,
    crop: {
      originX,
      originY,
      width: cropWidth,
      height: cropHeight,
    },
    maxOriginX,
    maxOriginY,
  };
};

const getTouchDistance = (
  touches: GestureResponderEvent["nativeEvent"]["touches"],
) => {
  if (touches.length < 2) return 0;

  const [first, second] = touches;
  const deltaX = first.pageX - second.pageX;
  const deltaY = first.pageY - second.pageY;

  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

const getMediaId = (mediaId: number | string) => {
  const numericId = Number(mediaId);
  return Number.isNaN(numericId) ? null : numericId;
};

const getSaveFormat = (type?: string) =>
  type === "image/png" ? SaveFormat.PNG : SaveFormat.JPEG;

const getCroppedFileName = (image: SelectedImage, index: number) => {
  const extension =
    getSaveFormat(image.type) === SaveFormat.PNG ? "png" : "jpg";
  const baseName =
    image.name?.replace(/\.[^/.]+$/, "") || `post-image-${index + 1}`;

  return `${baseName}-cropped.${extension}`;
};

const cropImageForUpload = async (image: SelectedImage, index: number) => {
  const cropMetrics = getCropMetrics(image);

  if (!cropMetrics) {
    return {
      uri: image.uri,
      name: image.name,
      type: image.type,
    };
  }

  const format = getSaveFormat(image.type);
  const croppedImage = await manipulateAsync(
    image.uri,
    [{ crop: cropMetrics.crop }],
    {
      compress: 0.92,
      format,
    },
  );

  return {
    uri: croppedImage.uri,
    name: getCroppedFileName(image, index),
    type: format === SaveFormat.PNG ? "image/png" : "image/jpeg",
  };
};

export default function CreatePostScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();

  const [description, setDescription] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [carouselScrollEnabled, setCarouselScrollEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const trimmedDescription = description.trim();
  const canSubmit = !!trimmedDescription || images.length > 0;
  const imageSlotsLeft = MAX_IMAGES - images.length;
  const carouselPageWidth = width - spacing.md * 2;

  const selectedImageLabel = useMemo(() => {
    if (images.length === 0) return "No images selected";
    return `${images.length}/${MAX_IMAGES} images selected`;
  }, [images.length]);

  const pickImages = async () => {
    if (imageSlotsLeft <= 0) {
      Alert.alert(
        "Image limit reached",
        `You can add up to ${MAX_IMAGES} images.`,
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo access to add images to your post.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      orderedSelection: true,
      quality: 1,
      selectionLimit: imageSlotsLeft,
    });

    if (result.canceled) return;

    const nextImages = result.assets.slice(0, imageSlotsLeft).map((asset) => ({
      id: `${asset.assetId ?? asset.uri}-${Date.now()}-${Math.random()}`,
      uri: asset.uri,
      name: asset.fileName ?? undefined,
      type: asset.mimeType ?? undefined,
      width: asset.width,
      height: asset.height,
      ratio: getDefaultRatio(asset),
      focusX: 0.5,
      focusY: 0.5,
      zoom: 1,
    }));

    setImages((current) => [...current, ...nextImages]);
  };

  const replaceImage = async (id: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    setImages((current) =>
      current.map((image) =>
        image.id === id
          ? {
              ...image,
              uri: asset.uri,
              name: asset.fileName ?? undefined,
              type: asset.mimeType ?? undefined,
              width: asset.width,
              height: asset.height,
              ratio: getDefaultRatio(asset),
              focusX: 0.5,
              focusY: 0.5,
              zoom: 1,
            }
          : image,
      ),
    );
  };

  const removeImage = (id: string) => {
    const nextCount = images.length - 1;

    setImages((current) => current.filter((image) => image.id !== id));
    setActiveImageIndex((index) => Math.max(0, Math.min(index, nextCount - 1)));
  };

  const updateImage = (id: string, updates: Partial<SelectedImage>) => {
    setImages((current) =>
      current.map((image) =>
        image.id === id ? { ...image, ...updates } : image,
      ),
    );
  };

  const handleCarouselScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / carouselPageWidth,
    );

    setActiveImageIndex(nextIndex);
  };

  const handlePost = async () => {
    if (!canSubmit || submitting) return;

    try {
      setSubmitting(true);

      const uploadedMediaIds = await Promise.all(
        images.map(async (image, index) => {
          const croppedImage = await cropImageForUpload(image, index);
          const response = await uploadPostMedia({
            uri: croppedImage.uri,
            name: croppedImage.name,
            type: croppedImage.type,
          });

          return getMediaId(response.data.media_id);
        }),
      );

      await createPost({
        title: trimmedDescription,
        Body: trimmedDescription,
        tagged_user_ids: [],
        Media_ids: uploadedMediaIds.filter((id): id is number => id !== null),
      });

      setDescription("");
      setImages([]);
      Alert.alert("Post created", "Your post has been shared.", [
        {
          text: "View profile",
          onPress: () => router.push("/(tabs)/profile"),
        },
        { text: "Create another" },
      ]);
    } catch (error) {
      Alert.alert("Could not create post", getApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.heading, { color: colors.text }]}>
            Create post
          </Text>
          <Pressable
            onPress={handlePost}
            disabled={!canSubmit || submitting}
            style={({ pressed }) => [
              styles.headerPostButton,
              {
                backgroundColor: canSubmit ? colors.primary : colors.border,
                opacity: pressed || submitting ? 0.72 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.bg} />
            ) : (
              <Text style={[styles.headerPostText, { color: colors.bg }]}>
                Post
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.composer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              multiline
              maxLength={MAX_DESCRIPTION}
              value={description}
              onChangeText={setDescription}
              placeholder="What's happening on campus?"
              placeholderTextColor={colors.subText}
              style={[
                styles.description,
                {
                  color: colors.text,
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                },
              ]}
            />
            <View style={styles.descriptionMeta}>
              <Text style={[styles.helperText, { color: colors.subText }]}>
                {selectedImageLabel}
              </Text>
              <Text
                style={[
                  styles.counter,
                  {
                    color:
                      description.length > MAX_DESCRIPTION - 80
                        ? colors.error
                        : colors.subText,
                  },
                ]}
              >
                {description.length}/{MAX_DESCRIPTION}
              </Text>
            </View>
          </View>

          <View style={styles.mediaHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Images
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.subText }]}>
                Preview the visible crop and adjust the focus before posting.
              </Text>
            </View>
            <Pressable
              onPress={pickImages}
              disabled={imageSlotsLeft <= 0 || submitting}
              style={({ pressed }) => [
                styles.addImageButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: pressed || imageSlotsLeft <= 0 ? 0.62 : 1,
                },
              ]}
            >
              <Ionicons name="images-outline" size={19} color={colors.text} />
              <Text style={[styles.addImageText, { color: colors.text }]}>
                Add
              </Text>
            </Pressable>
          </View>

          {images.length > 0 ? (
            <View style={styles.carouselWrap}>
              <ScrollView
                horizontal
                pagingEnabled
                scrollEnabled={carouselScrollEnabled}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleCarouselScroll}
                scrollEventThrottle={16}
              >
                {images.map((image, index) => (
                  <View
                    key={image.id}
                    style={[styles.carouselPage, { width: carouselPageWidth }]}
                  >
                    <ImagePreviewCard
                      image={image}
                      index={index}
                      submitting={submitting}
                      isDark={isDark}
                      onReplace={() => replaceImage(image.id)}
                      onRemove={() => removeImage(image.id)}
                      onUpdate={(updates) => updateImage(image.id, updates)}
                      onGestureActiveChange={setCarouselScrollEnabled}
                    />
                  </View>
                ))}
              </ScrollView>

              <View style={styles.carouselMeta}>
                <Text style={[styles.carouselCount, { color: colors.subText }]}>
                  {activeImageIndex + 1}/{images.length}
                </Text>
                <View style={styles.dots}>
                  {images.map((image, index) => (
                    <View
                      key={image.id}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            index === activeImageIndex
                              ? colors.text
                              : colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={pickImages}
              style={({ pressed }) => [
                styles.emptyMedia,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: pressed ? 0.76 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.emptyIcon,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.bg,
                  },
                ]}
              >
                <Ionicons name="image-outline" size={30} color={colors.text} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Add images
              </Text>
              <Text style={[styles.emptyText, { color: colors.subText }]}>
                Select up to {MAX_IMAGES} images and preview their post size.
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ImagePreviewCard({
  image,
  index,
  submitting,
  isDark,
  onReplace,
  onRemove,
  onUpdate,
  onGestureActiveChange,
}: {
  image: SelectedImage;
  index: number;
  submitting: boolean;
  isDark: boolean;
  onReplace: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<SelectedImage>) => void;
  onGestureActiveChange: (enabled: boolean) => void;
}) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const imageRef = useRef(image);
  const updateRef = useRef(onUpdate);
  const gestureActiveRef = useRef(onGestureActiveChange);
  const cropFrameWidthRef = useRef(1);
  const gestureStart = useRef({
    focusX: image.focusX,
    focusY: image.focusY,
    zoom: image.zoom,
    distance: 0,
    originX: 0,
    originY: 0,
    centerX: 0,
    centerY: 0,
  });
  const lastTap = useRef(0);
  const didMove = useRef(false);
  const cropFrameSize = getCropFrameSize(image.ratio, width);
  const previewWidth = Math.max(260, width - spacing.md * 4);
  const cropFrameLeft = (previewWidth - cropFrameSize.width) / 2;
  const cropFrameTop = (PREVIEW_STAGE_HEIGHT - cropFrameSize.height) / 2;
  const cropMetrics = getCropMetrics(image);
  const previewScale = cropMetrics
    ? cropFrameSize.width / cropMetrics.crop.width
    : 1;
  const previewImageStyle = cropMetrics
    ? {
        width: cropMetrics.sourceWidth * previewScale,
        height: cropMetrics.sourceHeight * previewScale,
        left: cropFrameLeft - cropMetrics.crop.originX * previewScale,
        top: cropFrameTop - cropMetrics.crop.originY * previewScale,
      }
    : StyleSheet.absoluteFillObject;

  imageRef.current = image;
  updateRef.current = onUpdate;
  gestureActiveRef.current = onGestureActiveChange;
  cropFrameWidthRef.current = cropFrameSize.width;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const currentImage = imageRef.current;
          const currentMetrics = getCropMetrics(currentImage);
          const originX = currentMetrics?.crop.originX ?? 0;
          const originY = currentMetrics?.crop.originY ?? 0;

          gestureActiveRef.current(false);
          didMove.current = false;
          gestureStart.current = {
            focusX: currentImage.focusX,
            focusY: currentImage.focusY,
            zoom: currentImage.zoom,
            distance: getTouchDistance(event.nativeEvent.touches),
            originX,
            originY,
            centerX: currentMetrics
              ? originX + currentMetrics.crop.width / 2
              : 0,
            centerY: currentMetrics
              ? originY + currentMetrics.crop.height / 2
              : 0,
          };
        },
        onPanResponderMove: (event, gesture) => {
          const currentImage = imageRef.current;
          const currentMetrics = getCropMetrics(currentImage);
          const touches = event.nativeEvent.touches;

          if (!currentMetrics) return;

          if (touches.length >= 2) {
            const distance = getTouchDistance(touches);

            if (distance <= 0) return;

            if (gestureStart.current.distance <= 0) {
              const baselineMetrics = getCropMetrics(currentImage);

              gestureStart.current = {
                focusX: currentImage.focusX,
                focusY: currentImage.focusY,
                zoom: currentImage.zoom,
                distance,
                originX: baselineMetrics?.crop.originX ?? 0,
                originY: baselineMetrics?.crop.originY ?? 0,
                centerX: baselineMetrics
                  ? baselineMetrics.crop.originX +
                    baselineMetrics.crop.width / 2
                  : 0,
                centerY: baselineMetrics
                  ? baselineMetrics.crop.originY +
                    baselineMetrics.crop.height / 2
                  : 0,
              };

              return;
            }

            didMove.current = true;
            const zoom = clampZoom(
              gestureStart.current.zoom *
                (distance / gestureStart.current.distance),
            );
            const nextMetrics = getCropMetrics({
              ...currentImage,
              zoom,
            });
            const focusX =
              nextMetrics && nextMetrics.maxOriginX > 0
                ? clampFocus(
                    (gestureStart.current.centerX -
                      nextMetrics.crop.width / 2) /
                      nextMetrics.maxOriginX,
                  )
                : 0.5;
            const focusY =
              nextMetrics && nextMetrics.maxOriginY > 0
                ? clampFocus(
                    (gestureStart.current.centerY -
                      nextMetrics.crop.height / 2) /
                      nextMetrics.maxOriginY,
                  )
                : 0.5;

            updateRef.current({ zoom, focusX, focusY });

            return;
          }

          if (Math.abs(gesture.dx) < 2 && Math.abs(gesture.dy) < 2) return;

          didMove.current = true;

          const frameScale =
            cropFrameWidthRef.current / currentMetrics.crop.width;
          const nextOriginX =
            gestureStart.current.originX - gesture.dx / frameScale;
          const nextOriginY =
            gestureStart.current.originY - gesture.dy / frameScale;

          updateRef.current({
            focusX:
              currentMetrics.maxOriginX > 0
                ? clampFocus(nextOriginX / currentMetrics.maxOriginX)
                : 0.5,
            focusY:
              currentMetrics.maxOriginY > 0
                ? clampFocus(nextOriginY / currentMetrics.maxOriginY)
                : 0.5,
          });
        },
        onPanResponderRelease: () => {
          const currentImage = imageRef.current;

          gestureActiveRef.current(true);

          const now = Date.now();

          if (!didMove.current && now - lastTap.current < 280) {
            updateRef.current({
              zoom: currentImage.zoom > 1.15 ? 1 : 1.75,
              focusX: currentImage.zoom > 1.15 ? 0.5 : currentImage.focusX,
              focusY: currentImage.zoom > 1.15 ? 0.5 : currentImage.focusY,
            });
          }

          lastTap.current = now;
        },
        onPanResponderTerminate: () => {
          gestureActiveRef.current(true);
        },
      }),
    [],
  );

  return (
    <View
      style={[
        styles.imageCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.imageCardHeader}>
        <View>
          <Text style={[styles.imageTitle, { color: colors.text }]}>
            Image {index + 1}
          </Text>
          <Text style={[styles.imageHint, { color: colors.subText }]}>
            Drag to reposition. Pinch out to zoom in, pinch in to zoom out.
          </Text>
        </View>
        <View style={styles.imageActions}>
          <Pressable
            onPress={onReplace}
            disabled={submitting}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={`Replace image ${index + 1}`}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={21}
              color={colors.text}
            />
          </Pressable>
          <Pressable
            onPress={onRemove}
            disabled={submitting}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={`Remove image ${index + 1}`}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <View
        {...panResponder.panHandlers}
        style={[
          styles.cropStage,
          {
            backgroundColor: isDark ? "#050505" : "#eeeeee",
          },
        ]}
      >
        <Image
          source={{ uri: image.uri }}
          resizeMode="stretch"
          style={[styles.previewImage, previewImageStyle]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.cropDim,
            {
              borderTopWidth: cropFrameTop,
              borderBottomWidth: cropFrameTop,
              borderLeftWidth: cropFrameLeft,
              borderRightWidth: cropFrameLeft,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.cropFrame,
            {
              width: cropFrameSize.width,
              height: cropFrameSize.height,
              top: cropFrameTop,
              left: cropFrameLeft,
              borderColor: isDark
                ? "rgba(255,255,255,0.74)"
                : "rgba(0,0,0,0.42)",
            },
          ]}
        />
      </View>

      <View style={styles.ratioToggle}>
        <RatioButton
          active={image.ratio === "portrait"}
          label="Portrait"
          icon="phone-portrait-outline"
          onPress={() => onUpdate({ ratio: "portrait" })}
        />
        <RatioButton
          active={image.ratio === "landscape"}
          label="Landscape"
          icon="tablet-landscape-outline"
          onPress={() => onUpdate({ ratio: "landscape" })}
        />
      </View>
    </View>
  );
}

function RatioButton({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.ratioButton,
        {
          borderColor: active ? colors.text : colors.border,
          backgroundColor: active ? colors.text : colors.bg,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={active ? colors.bg : colors.text}
      />
      <Text
        style={[
          styles.ratioButtonText,
          { color: active ? colors.bg : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerPostButton: {
    minWidth: 76,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  headerPostText: {
    fontSize: 15,
    fontWeight: "700",
  },
  content: {
    padding: spacing.md,
    paddingBottom: 104,
    gap: spacing.lg,
  },
  composer: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  description: {
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: 174,
    padding: spacing.md,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  descriptionMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
  },
  counter: {
    fontSize: 13,
    fontWeight: "600",
  },
  mediaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 245,
  },
  addImageButton: {
    height: 42,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  addImageText: {
    fontSize: 14,
    fontWeight: "700",
  },
  carouselWrap: {
    gap: spacing.sm,
  },
  carouselPage: {
    paddingRight: spacing.md,
  },
  imageCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  imageCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  imageHint: {
    marginTop: 3,
    fontSize: 12,
  },
  imageActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  cropStage: {
    width: "100%",
    height: PREVIEW_STAGE_HEIGHT,
    alignSelf: "center",
    borderRadius: radii.md,
    overflow: "hidden",
  },
  previewImage: {
    position: "absolute",
  },
  cropDim: {
    ...StyleSheet.absoluteFillObject,
    borderColor: "rgba(0,0,0,0.42)",
  },
  cropFrame: {
    position: "absolute",
    borderWidth: 1,
  },
  ratioToggle: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  ratioButton: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  ratioButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  carouselMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: spacing.md,
  },
  carouselCount: {
    fontSize: 13,
    fontWeight: "700",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  emptyMedia: {
    minHeight: 232,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});
