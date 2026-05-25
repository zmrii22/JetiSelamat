import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View, ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImagePreviewModalProps {
  images: string[];
  visible: boolean;
  initialIndex?: number;
  onClose: () => void;
}

export const ImagePreviewModal = ({ images, visible, initialIndex = 0, onClose }: ImagePreviewModalProps) => {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<string>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!visible || images.length === 0) {
      return;
    }

    const safeIndex = Math.max(0, Math.min(initialIndex, images.length - 1));
    setCurrentIndex(safeIndex);

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: safeIndex, animated: false });
    });
  }, [initialIndex, images.length, visible]);

  const getItemLayout = (_: ArrayLike<string> | null | undefined, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  const onScrollToIndexFailed = (info: { index: number }) => {
    setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: info.index * width,
        animated: false,
      });
    }, 80);
  };

  const goPrev = () => {
    const next = Math.max(0, currentIndex - 1);
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  };

  const goNext = () => {
    const next = Math.min(images.length - 1, currentIndex + 1);
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<string>[] }) => {
      const index = viewableItems?.[0]?.index ?? 0;
      setCurrentIndex(index);
    },
  ).current;

  const viewabilityConfig = useMemo(() => ({ viewAreaCoveragePercentThreshold: 70 }), []);

  return (
    <Modal visible={visible && images.length > 0} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/90">
        <Pressable className="absolute right-5 top-14 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/15" onPress={onClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        <View className="absolute left-0 right-0 top-16 z-10 items-center">
          <Text className="rounded-full bg-black/35 px-3 py-1 text-xs font-bold text-white">
            {currentIndex + 1} / {images.length}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(item, index) => `${item}-${index}`}
          horizontal
          pagingEnabled
          initialNumToRender={1}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={onScrollToIndexFailed}
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => (
            <View style={{ width }} className="items-center justify-center px-4">
              <ScrollView
                key={`${item}-${index}`}
                style={{ width: '100%', height: Math.min(height * 0.74, 620) }}
                contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', minHeight: Math.min(height * 0.74, 620) }}
                maximumZoomScale={5}
                minimumZoomScale={1}
                zoomScale={1}
                bouncesZoom
                pinchGestureEnabled
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                centerContent
              >
                <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} className="rounded-2xl" resizeMode="contain" />
              </ScrollView>
            </View>
          )}
        />

        {images.length > 1 ? (
          <>
            <Pressable
              className={`absolute left-4 h-11 w-11 items-center justify-center rounded-full ${currentIndex === 0 ? 'bg-white/10' : 'bg-white/20'}`}
              onPress={goPrev}
              disabled={currentIndex === 0}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>

            <Pressable
              className={`absolute right-4 h-11 w-11 items-center justify-center rounded-full ${currentIndex === images.length - 1 ? 'bg-white/10' : 'bg-white/20'}`}
              onPress={goNext}
              disabled={currentIndex === images.length - 1}
            >
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </Pressable>

            <View className="absolute bottom-12 flex-row items-center justify-center">
              {images.map((_, idx) => (
                <View
                  key={`dot-${idx}`}
                  className={`mx-1 h-2 w-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
};
