import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

const MAPPING: Record<string, MaterialIconName> = {
  'arrow.up.right': 'trending-up',
  'arrow.down.left': 'trending-down',
  alert: 'warning',
  bag: 'shopping-bag',
  'banknote': 'attach-money',
  'banknote.fill': 'attach-money',
  bell: 'notifications',
  'book.closed': 'book',
  'building.2': 'business',
  calendar: 'calendar-today',
  'chart.bar': 'bar-chart',
  'chart.line.uptrend.xyaxis': 'show-chart',
  'chart.pie': 'pie-chart',
  checkmark: 'check',
  'checkmark.circle.fill': 'check-circle',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  clock: 'schedule',
  'circle.fill': 'lens',
  'dollarsign.circle': 'attach-money',
  edit: 'edit',
  'exclamationmark.triangle.fill': 'warning',
  export: 'file-download',
  file: 'description',
  'fork.knife': 'restaurant',
  gear: 'settings',
  globe: 'language',
  'hand.wave': 'pan-tool',
  house: 'home',
  key: 'vpn-key',
  lightbulb: 'lightbulb',
  location: 'place',
  logout: 'logout',
  'list.bullet': 'format-list-bulleted',
  magnifyingglass: 'search',
  moon: 'dark-mode',
  message: 'message',
  minus: 'remove',
  'minus.circle': 'remove-circle',
  package: 'inventory-2',
  'person.2': 'people',
  person: 'person',
  phone: 'phone',
  plus: 'add',
  'plus.circle': 'add-circle',
  shippingbox: 'local-shipping',
  'square.and.arrow.down': 'save',
  'star.fill': 'star',
  tag: 'label',
  tray: 'inbox',
  trash: 'delete',
  'wrench.and.screwdriver': 'build',
  scissors: 'content-cut',
  share: 'share',
  shield: 'lock',
  store: 'storefront',
  sync: 'sync',
  vehicle: 'directions-car',
  visibility: 'visibility',
  xmark: 'close',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name] ?? 'help-outline';
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
