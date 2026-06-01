import { Image } from "expo-image";
import { StyleSheet } from "react-native";

type ImageCardProps = {
  imageUrl: string;
};

export default function ImageCard({ imageUrl }: ImageCardProps) {
  return (
    <Image
      source={{ uri: imageUrl }}
      resizeMode="cover"
      style={styles.postImage}
    />
  );
}

const styles = StyleSheet.create({
      postImage: {
        width: '100%',
        height: '100%',
      },
})