import Animated from 'react-native-reanimated';
import { IconSymbol } from './ui/icon-symbol';
import { COLORS } from '@/constants/theme';

export function HelloWave() {
  return (
    <Animated.View
      style={{
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      <IconSymbol name="hand.wave" size={28} color={COLORS.green600} />
    </Animated.View>
  );
}
