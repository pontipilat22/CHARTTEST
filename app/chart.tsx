// app/Chart.tsx
import { JuliusSansOne_400Regular } from '@expo-google-fonts/julius-sans-one';
import { K2D_400Regular, K2D_500Medium, K2D_600SemiBold, useFonts } from '@expo-google-fonts/k2d';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Svg,
  Text as SvgText
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ===== НАСТРОЙКИ =====
const LINE_WIDTH = 1;
const SHADOW_OFFSET_X = -2;
const SHADOW_OFFSET_Y = -2;
const SHADOW_BASE_WIDTH = 10;
const FILL_OPACITY = 0.4;
const SMOOTHNESS = 0.2;
const START_X = -32;

// ===== НАСТРОЙКИ ЭФФЕКТА ЛУПЫ =====
const MAGNIFIED_FONT_SIZE = 58; // Размер увеличенного текста
const MAGNIFIED_OFFSET_X = -14; // Сдвиг по X относительно обычного текста
const MAGNIFIED_OFFSET_Y = 28; // Сдвиг по Y относительно обычного текста

type ShadowLayer = 'under-fill' | 'between' | 'over-line';

// Типы для периодов
type Period = '24h' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

// Тестовые данные для разных периодов
const periodData: Record<Period, { points: number[]; balance: string }> = {
  '24h': {
    points: [40, 26, 22, 72, 82, 80, 88],
    balance: '$ 11,950',
  },
  '1W': {
    points: [30, 45, 35, 60, 55, 70, 68, 75],
    balance: '$ 12,450',
  },
  '1M': {
    points: [25, 35, 42, 38, 50, 48, 62, 58, 70, 75],
    balance: '$ 13,200',
  },
  '3M': {
    points: [20, 25, 30, 28, 35, 40, 45, 50, 55, 60, 65, 70],
    balance: '$ 14,850',
  },
  '1Y': {
    points: [15, 18, 22, 25, 30, 28, 35, 40, 38, 45, 50, 55, 60, 58, 65, 70],
    balance: '$ 16,750',
  },
  ALL: {
    points: [10, 12, 15, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 78, 82],
    balance: '$ 18,950',
  },
};

const ChartScreen = () => {
  const navigation = useNavigation();
  const [shadowLayer] = React.useState<ShadowLayer>('between');
  const [activePeriod, setActivePeriod] = React.useState<Period>('24h');

  // шрифты
  const [fontsLoaded] = useFonts({
    K2D_400Regular,
    K2D_500Medium,
    K2D_600SemiBold,
    JuliusSansOne_400Regular,
  });

  // настраиваем header
  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        title: '',
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShadowVisible: false,
        headerTintColor: '#000',
      });
    }, [navigation])
  );

  const cardWidth = SCREEN_WIDTH;
  const chartHeight = 180;
  const chartBoxWidth = cardWidth;

  // Получаем данные для текущего периода
  const currentData = periodData[activePeriod];
  const points = currentData.points;

  const paddingX = 0;
  const paddingTop = 26;
  const paddingBottom = 20;

  const getY = (v: number) => {
    const top = paddingTop;
    const bottom = chartHeight - paddingBottom;
    return bottom - (v / 100) * (bottom - top);
  };

  // плавная линия
  const buildSmoothPath = (pts: number[]) => {
    if (!pts.length) return '';

    const step = (chartBoxWidth - paddingX * 2) / (pts.length - 1);
    const startY = chartHeight + 6;
    let d = `M ${START_X} ${startY}`;

    const firstX = paddingX;
    const firstY = getY(pts[0]);
    d += ` C ${START_X + 14} ${startY - 14}, ${firstX - 14} ${firstY + 10}, ${firstX} ${firstY}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const x0 = paddingX + step * i;
      const y0 = getY(pts[i]);

      const x1 = paddingX + step * (i + 1);
      const y1 = getY(pts[i + 1]);

      const x_1 = i === 0 ? START_X : paddingX + step * (i - 1);
      const y_1 = i === 0 ? chartHeight + 6 : getY(pts[i - 1]);

      const x2 = i + 2 >= pts.length ? x1 : paddingX + step * (i + 2);
      const y2 = i + 2 >= pts.length ? y1 : getY(pts[i + 2]);

      const cp1x = x0 + (x1 - x_1) * SMOOTHNESS;
      const cp1y = y0 + (y1 - y_1) * SMOOTHNESS;

      const cp2x = x1 - (x2 - x0) * SMOOTHNESS;
      const cp2y = y1 - (y2 - y0) * SMOOTHNESS;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`;
    }

    return d;
  };

  const buildAreaPath = (pts: number[]) => {
    if (!pts.length) return '';
    const linePath = buildSmoothPath(pts);
    const step = (chartBoxWidth - paddingX * 2) / (pts.length - 1);
    const bottomY = chartHeight;
    const lastX = paddingX + step * (pts.length - 1);
    return `${linePath} L ${lastX} ${bottomY} L ${START_X} ${bottomY} Z`;
  };

  const d = buildSmoothPath(points);
  const area = buildAreaPath(points);

  const markerY = getY(points[points.length - 1]);
  const MARKER_INSET_RIGHT = 30;
  const markerX = chartBoxWidth - MARKER_INSET_RIGHT;

  const renderShadowGroup = () => (
    <>
      <Path
        d={d}
        stroke="rgba(0,0,0,0.02)"
        strokeWidth={LINE_WIDTH + SHADOW_BASE_WIDTH + 16}
        fill="none"
        strokeLinecap="round"
        transform={[{ translateX: SHADOW_OFFSET_X }, { translateY: SHADOW_OFFSET_Y }]}
      />
      <Path
        d={d}
        stroke="rgba(0,0,0,0.03)"
        strokeWidth={LINE_WIDTH + SHADOW_BASE_WIDTH + 10}
        fill="none"
        strokeLinecap="round"
        transform={[{ translateX: SHADOW_OFFSET_X }, { translateY: SHADOW_OFFSET_Y }]}
      />
      <Path
        d={d}
        stroke="rgba(0,0,0,0.01)"
        strokeWidth={LINE_WIDTH + SHADOW_BASE_WIDTH + 5}
        fill="none"
        strokeLinecap="round"
        transform={[{ translateX: SHADOW_OFFSET_X }, { translateY: SHADOW_OFFSET_Y }]}
      />
      <Path
        d={d}
        stroke="rgba(0,0,0,0.06)"
        strokeWidth={LINE_WIDTH + SHADOW_BASE_WIDTH}
        fill="none"
        strokeLinecap="round"
        transform={[{ translateX: SHADOW_OFFSET_X }, { translateY: SHADOW_OFFSET_Y }]}
      />
      <Path
        d={d}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={LINE_WIDTH + 1}
        fill="none"
        strokeLinecap="round"
        transform={[{ translateX: SHADOW_OFFSET_X }, { translateY: SHADOW_OFFSET_Y }]}
      />
    </>
  );

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#F0F0F0' }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F0F0' }}>
      {/* статус-бар: белый фон, чёрные иконки */}
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {/* белая карточка поверх серого фона */}
        <View style={[styles.card, { width: cardWidth }]}>
          {/* ты хотел без текста хедера тут — оставляю пусто */}
          <View style={styles.headerRow} />

          {/* чарт */}
          <View style={styles.chartWrapper}>
            <View style={[styles.chartBox, { width: '100%', height: chartHeight }]}>
              {/* фон: серый → белый */}
              <Svg
                width="100%"
                height="100%"
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              >
                <Defs>
                  <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="0.7">
                    <Stop offset="0" stopColor="#3170f7ff" stopOpacity="0.1" />
                    <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" rx={26} fill="url(#bgGrad)" />
              </Svg>

              {/* inner */}
              <Svg pointerEvents="none" style={styles.innerShadowSvg} width="100%" height="100%">
                <Defs>
                  <LinearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="rgba(0,0,0,0.9)" stopOpacity="0.09" />
                    <Stop offset="1" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
                  </LinearGradient>
                  <LinearGradient id="leftShade" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="rgba(0,0,0,0.03)" stopOpacity="0.0" />
                    <Stop offset="1" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
                  </LinearGradient>
                  <RadialGradient id="cornerShade" cx="0" cy="0" r="1">
                    <Stop offset="0" stopColor="rgba(0,0,0,0.11)" stopOpacity="0.11" />
                    <Stop offset="1" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="7" rx="26" fill="url(#topShade)" />
                <Rect x="0" y="0" width="9" height="100%" rx="26" fill="url(#leftShade)" />
                <Rect x="-12" y="-12" width="46" height="46" fill="url(#cornerShade)" />
              </Svg>

              {/* Базовый текст обычного размера */}
              <Text style={styles.balanceOnChart}>{currentData.balance}</Text>

              {/* График */}
              <Svg width={chartBoxWidth} height={chartHeight} style={StyleSheet.absoluteFillObject}>
                {/* Тени графика */}
                {shadowLayer === 'under-fill' && renderShadowGroup()}

                {/* Заливка графика - полупрозрачная */}
                <Path d={area} fill={`rgba(255,255,255,${FILL_OPACITY})`} />

                {/* Тени между заливкой и линией */}
                {shadowLayer === 'between' && renderShadowGroup()}

                {/* Линия графика */}
                <Path
                  d={d}
                  stroke="#ffffffa3"
                  strokeWidth={LINE_WIDTH}
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Тени поверх линии */}
                {shadowLayer === 'over-line' && renderShadowGroup()}
              </Svg>

              {/* Увеличенный текст ПОВЕРХ графика, только в области графика */}
              <Svg
                width={chartBoxWidth}
                height={chartHeight}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              >
                <Defs>
                  <ClipPath id="graphClip">
                    <Path d={area} />
                  </ClipPath>
                </Defs>
                <G clipPath="url(#graphClip)">
                  <SvgText
                    x={chartBoxWidth * 0.18 + MAGNIFIED_OFFSET_X}
                    y={chartHeight * 0.43 - 26 + 54 + MAGNIFIED_OFFSET_Y}
                    fontSize={MAGNIFIED_FONT_SIZE}
                    fontFamily="K2D_600SemiBold"
                    fill="rgba(34,114,255,1)"
                    fontWeight="700"
                  >
                    {currentData.balance}
                  </SvgText>
                </G>
              </Svg>
            </View>

            {/* маркер */}
            <View
              pointerEvents="none"
              style={[
                styles.marker,
                {
                  left: markerX - 10,
                  top: markerY - 10,
                },
              ]}
            >
              <View style={styles.markerInner} />
            </View>
          </View>

          {/* табы */}
          <View style={styles.tabsWrapper}>
            {(['24h', '1W', '1M', '3M', '1Y', 'ALL'] as Period[]).map((item) => {
              const active = item === activePeriod;
              return (
                <Pressable
                  key={item}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setActivePeriod(item)}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ChartScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F0F0', // ← твой цвет
  },
  content: {
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 16,
  },
  headerRow: {
    height: 8,
  },
  chartWrapper: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  chartBox: {
    backgroundColor: '#F1F2F4',
    borderRadius: 26,
    overflow: 'hidden',
    position: 'absolute',
    inset: 0,
  },
  innerShadowSvg: {
    position: 'absolute',
    inset: 0,
  },
  balanceOnChart: {
    position: 'absolute',
    top: '43%',
    left: '18%',
    transform: [{ translateY: -26 }],
    fontSize: 54,
    fontFamily: 'K2D_600SemiBold',
    color: 'rgba(34,114,255,0.9)',
  },
  marker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#2F80FF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerInner: {
    flex: 1,
    borderRadius: 999,
  },
  tabsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: '#2F80FF',
  },
  tabText: {
    fontSize: 12,
    color: '#9AA1A8',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
