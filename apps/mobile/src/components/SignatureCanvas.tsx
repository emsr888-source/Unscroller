import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Point = {
  x: number;
  y: number;
};

const toSvgPath = (segments: Point[][]): string =>
  segments
    .map(segment => {
      if (segment.length === 0) {
        return '';
      }
      const [{ x: startX, y: startY }, ...rest] = segment;
      const lineCommands = rest.map(point => `L ${point.x} ${point.y}`).join(' ');
      return `M ${startX} ${startY}${lineCommands ? ` ${lineCommands}` : ''}`;
    })
    .join(' ');

export interface SignatureCanvasHandle {
  clear: () => void;
  getPath: () => string;
}

export interface SignatureCanvasProps {
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  onDrawingChange?: (hasDrawing: boolean) => void;
  onPathEnd?: (path: string) => void;
}

export const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
  (
    {
      strokeColor = '#111827',
      strokeWidth = 3,
      backgroundColor = '#FFFFFF',
      width = '100%',
      height = '100%',
      onDrawingChange,
      onPathEnd,
    },
    ref
  ) => {
    const [segments, setSegments] = useState<Point[][]>([]);
    const currentSegmentRef = useRef<Point[] | null>(null);

    const hasDrawing = useMemo(() => segments.some(segment => segment.length > 0), [segments]);

    useEffect(() => {
      onDrawingChange?.(hasDrawing);
    }, [hasDrawing, onDrawingChange]);

    const lastEmittedPathRef = useRef('');
    const pathData = useMemo(() => toSvgPath(segments), [segments]);

    useEffect(() => {
      if (pathData !== lastEmittedPathRef.current) {
        lastEmittedPathRef.current = pathData;
        onPathEnd?.(pathData);
      }
    }, [onPathEnd, pathData]);

    useImperativeHandle(
      ref,
      () => ({
        clear: () => {
          currentSegmentRef.current = null;
          setSegments([]);
          lastEmittedPathRef.current = '';
        },
        getPath: () => pathData,
      }),
      [pathData, onPathEnd]
    );

    const handleStart = useCallback((x: number, y: number) => {
      const segment: Point[] = [{ x, y }];
      currentSegmentRef.current = segment;
      setSegments(prev => [...prev, segment]);
    }, []);

    const handleMove = useCallback(
      (x: number, y: number, gestureState: PanResponderGestureState) => {
        if (gestureState.numberActiveTouches > 1) {
          return;
        }

        const segment = currentSegmentRef.current;
        if (!segment) {
          return;
        }

        segment.push({ x, y });
        setSegments(prev => {
          if (prev.length === 0) {
            return prev;
          }

          const updated = prev.slice();
          updated[updated.length - 1] = [...segment];
          return updated;
        });
      },
      []
    );

    const handleEnd = useCallback(() => {
      const segment = currentSegmentRef.current;
      if (!segment || segment.length === 0) {
        currentSegmentRef.current = null;
        return;
      }

      setSegments(prev => {
        if (prev.length === 0) {
          return prev;
        }

        const updated = prev.slice();
        updated[updated.length - 1] = [...segment];
        return updated;
      });

      currentSegmentRef.current = null;
    }, [onPathEnd]);

    const panResponder = useMemo<PanResponderInstance>(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onStartShouldSetPanResponderCapture: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: (event, gestureState) => {
            const { locationX, locationY } = event.nativeEvent;
            handleStart(locationX, locationY);
            handleMove(locationX, locationY, gestureState);
          },
          onPanResponderMove: (event, gestureState) => {
            const { locationX, locationY } = event.nativeEvent;
            handleMove(locationX, locationY, gestureState);
          },
          onPanResponderRelease: () => {
            handleEnd();
          },
          onPanResponderTerminate: () => {
            handleEnd();
          },
        }),
      [handleEnd, handleMove, handleStart]
    );

    const containerStyle = useMemo<StyleProp<ViewStyle>>(
      () => [styles.container, { backgroundColor, width, height }],
      [backgroundColor, width, height]
    );

    return (
      <View style={containerStyle} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          <Path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  }
);

SignatureCanvas.displayName = 'SignatureCanvas';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default SignatureCanvas;
