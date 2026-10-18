import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { canonicalOption, filterOptions } from '../lib/nbaPlayerOptions';
import { colors } from '../theme/colors';

type Props = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  /** Max options shown when the search field is empty */
  emptyQueryLimit?: number;
  /** Max options shown when filtering */
  filteredLimit?: number;
  listMaxHeight?: number;
};

export function InlineOptionList({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  emptyQueryLimit = 24,
  filteredLimit = 40,
  listMaxHeight = 220,
}: Props) {
  const [query, setQuery] = useState('');

  const visibleOptions = useMemo(() => {
    const q = query.trim();
    if (!q) {
      if (value) {
        const rest = options.filter((o) => o !== value);
        return [value, ...rest.slice(0, emptyQueryLimit - 1)];
      }
      return options.slice(0, emptyQueryLimit);
    }
    return filterOptions(options, q, filteredLimit);
  }, [options, query, value, emptyQueryLimit, filteredLimit]);

  function selectOption(next: string) {
    const canonical = canonicalOption(options, next);
    if (!canonical || disabled) {
      return;
    }
    setQuery('');
    onChange(canonical);
  }

  return (
    <View style={styles.wrap}>
      {value ? (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>Your pick</Text>
          <Text style={styles.selectedValue}>{value}</Text>
        </View>
      ) : null}
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={query}
        editable={!disabled}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="words"
        clearButtonMode="while-editing"
      />
      <ScrollView
        style={[styles.list, { maxHeight: listMaxHeight }]}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {visibleOptions.length === 0 ? (
          <Text style={styles.empty}>No matches — try another spelling</Text>
        ) : (
          visibleOptions.map((item) => {
            const selected = item === value;
            return (
              <Pressable
                key={item}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && !disabled && styles.optionPressed,
                  disabled && styles.optionDisabled,
                ]}
                onPress={() => selectOption(item)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
      {!query.trim() && options.length > emptyQueryLimit ? (
        <Text style={styles.moreHint}>Type to search all {options.length} names</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  selectedRow: {
    backgroundColor: colors.pickActive,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  selectedLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectedValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  inputDisabled: {
    opacity: 0.55,
  },
  list: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  option: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.pickInactive,
  },
  optionPressed: {
    opacity: 0.88,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '800',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
    padding: 12,
  },
  moreHint: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
