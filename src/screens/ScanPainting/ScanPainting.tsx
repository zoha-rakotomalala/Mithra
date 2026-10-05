import type { Painting } from '@/types/painting';

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import { EmptyState } from '@/components/molecules';
import { COLORS } from '@/constants/colors';
import { getMuseumBadgeInfo } from '@/services/unifiedMuseumService';
import { buttons } from '@/styles';
import { museumImageSource } from '@/utils/imageSource';
import { useScanPainting } from '@/hooks/domain/museum/useScanPainting';
import { searchStyles } from '@/screens/Search/Search.styles';

import { scanStyles as styles } from './ScanPainting.styles';

/**
 * A single match card. Visually identical to the Search result grid so that a
 * scanned match looks and behaves exactly like a searched one.
 */
const ScanResultCard = React.memo(
  ({
    isLiked,
    onPress,
    onToggleLike,
    painting,
  }: {
    readonly isLiked?: boolean;
    readonly onPress: () => void;
    readonly onToggleLike?: () => void;
    readonly painting: Painting;
  }) => {
    const [imageLoading, setImageLoading] = React.useState(true);
    const [imageError, setImageError] = React.useState(false);
    const badgeInfo = getMuseumBadgeInfo(painting);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={searchStyles.resultCard}
      >
        <View style={searchStyles.imageContainer}>
          {painting.imageUrl || painting.thumbnailUrl ? (
            <>
              {imageLoading && !imageError && (
                <View style={searchStyles.imageLoadingOverlay}>
                  <ActivityIndicator color={COLORS.gold} size="small" />
                </View>
              )}
              <FastImage
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
                onLoadEnd={() => setImageLoading(false)}
                onLoadStart={() => setImageLoading(true)}
                resizeMode={FastImage.resizeMode.cover}
                source={museumImageSource(
                  painting.thumbnailUrl || painting.imageUrl,
                )}
                style={searchStyles.resultImage}
              />
            </>
          ) : (
            <View
              style={[
                searchStyles.placeholderImage,
                { backgroundColor: painting.color },
              ]}
            >
              <Text style={searchStyles.placeholderIcon}>🎨</Text>
            </View>
          )}

          {imageError && (
            <View
              style={[
                searchStyles.placeholderImage,
                { backgroundColor: painting.color },
              ]}
            >
              <Text style={searchStyles.placeholderIcon}>🖼️</Text>
            </View>
          )}

          <View
            style={[
              searchStyles.museumBadge,
              { backgroundColor: badgeInfo.color },
            ]}
          >
            <Text style={searchStyles.museumBadgeText}>
              {badgeInfo.shortName}
            </Text>
          </View>

          {onToggleLike && (
            <TouchableOpacity
              hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleLike();
              }}
              style={searchStyles.likeButton}
            >
              <Text style={searchStyles.likeButtonText}>
                {isLiked ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text numberOfLines={2} style={searchStyles.resultTitle}>
          {painting.title}
        </Text>
        <Text numberOfLines={1} style={searchStyles.resultArtist}>
          {painting.artist}
        </Text>
        {painting.year && (
          <Text style={searchStyles.resultYear}>{painting.year}</Text>
        )}
      </TouchableOpacity>
    );
  },
);

export function ScanPainting() {
  const {
    errorMessage,
    goBack,
    handleLike,
    handlePaintingPress,
    isLiked,
    matches,
    phase,
    previewUri,
    reset,
    scanFromLibrary,
    scanWithCamera,
    visitId,
  } = useScanPainting();

  const renderItem = useCallback(
    ({ item }: { readonly item: Painting }) => (
      <ScanResultCard
        isLiked={visitId ? isLiked(item) : undefined}
        onPress={() => handlePaintingPress(item)}
        onToggleLike={visitId ? () => handleLike(item) : undefined}
        painting={item}
      />
    ),
    [visitId, isLiked, handlePaintingPress, handleLike],
  );

  const keyExtractor = useCallback(
    (item: Painting) => `scan-${item.id}`,
    [],
  );

  const isBusy = phase === 'analyzing' || phase === 'searching';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.black} barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SCAN</Text>
        </View>

        {phase === 'idle' && (
          <View style={styles.intro}>
            <Text style={styles.introIcon}>📷</Text>
            <Text style={styles.introTitle}>Scan a Painting</Text>
            <Text style={styles.introSubtitle}>
              Point your camera at an artwork or its wall label. We'll identify
              it and find it across the museums in your collection.
            </Text>
            <TouchableOpacity
              onPress={scanWithCamera}
              style={[buttons.primary, styles.introButton]}
            >
              <Text style={buttons.primaryText}>📸  Scan with Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={scanFromLibrary}
              style={[buttons.secondary, styles.introButton]}
            >
              <Text style={buttons.secondaryText}>🖼️  Choose from Library</Text>
            </TouchableOpacity>
          </View>
        )}

        {isBusy && (
          <View style={styles.busy}>
            {previewUri && (
              <FastImage
                resizeMode={FastImage.resizeMode.cover}
                source={{ uri: previewUri }}
                style={styles.previewImage}
              />
            )}
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={styles.busyText}>
              {phase === 'analyzing'
                ? 'Identifying the artwork…'
                : 'Matching against museum collections…'}
            </Text>
            <Text style={styles.busySubtext}>This usually takes a moment.</Text>
          </View>
        )}

        {phase === 'results' && (
          <FlatList
            columnWrapperStyle={searchStyles.gridRow}
            contentContainerStyle={searchStyles.gridContainer}
            data={matches}
            initialNumToRender={12}
            keyExtractor={keyExtractor}
            ListHeaderComponent={
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  {matches.length} possible match
                  {matches.length === 1 ? '' : 'es'}
                </Text>
                <Text style={styles.resultsHint}>
                  Tap a painting to open it{visitId ? ', or ♥ to like it' : ''}.
                </Text>
              </View>
            }
            ListFooterComponent={
              <TouchableOpacity
                onPress={reset}
                style={[buttons.secondary, styles.scanAgainFooter]}
              >
                <Text style={buttons.secondaryText}>Scan Again</Text>
              </TouchableOpacity>
            }
            numColumns={3}
            removeClippedSubviews
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}

        {phase === 'noMatch' && (
          <EmptyState
            action={{ label: 'Try Again', onPress: reset }}
            icon="🔍"
            subtitle="We couldn't confidently identify that artwork. Try getting closer, reducing glare, or photographing the wall label instead."
            title="No match found"
          />
        )}

        {phase === 'error' && (
          <EmptyState
            action={{ label: 'Try Again', onPress: reset }}
            icon="⚠️"
            subtitle={errorMessage ?? 'Please try scanning again.'}
            title="Something went wrong"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
