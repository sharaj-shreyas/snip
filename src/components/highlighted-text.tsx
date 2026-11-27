import { Text, type StyleProp, type TextStyle } from 'react-native';

type Props = {
  /** Text where `**keyword**` segments are highlighted. */
  children: string;
  style?: StyleProp<TextStyle>;
  highlightColor: string;
};

export function HighlightedText({ children, style, highlightColor }: Props) {
  const parts = children.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <Text key={i} style={{ color: highlightColor, fontWeight: '900' }}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}
