import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { canonicalOption, filterOptions } from '../lib/nbaPlayerOptions';
import { colors } from '../theme/colors';

type Props = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  const displayQuery = open ? query : value;

  const suggestions = useMemo(
    () => filterOptions(options, open ? query : value),
    [options, open, query, value],
  );

  function commitSelection(next: string) {
    const canonical = canonicalOption(options, next);
    if (!canonical) {
      return;
    }
    setQuery(canonical);
    setOpen(false);
    onChange(canonical);
  }

  function onBlurValidate() {
    setOpen(false);
    const canonical = canonicalOption(options, query);
    if (canonical) {
      setQuery(canonical);
      if (canonical !== value) {
        onChange(canonical);
      }
      return;
    }
    setQuery(value);
  }

  return (
    <View style={styles.wrap}>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={displayQuery}
        editable={!disabled}
        onFocus={() => {
          if (disabled) {
            return;
          }
          setOpen(true);
          setQuery(value);
        }}
        onChangeText={(text) => {
          setQuery(text);
          setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => onBlurValidate(), 150);
        }}
        autoCorrect={false}
        autoCapitalize="words"
      />
      {open && !disabled && suggestions.length > 0 ? (
        <View style={styles.dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            data={suggestions}
            keyExtractor={(item) => item}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => commitSelection(item)}
              >
                <Text style={styles.optionText}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      ) : open && !disabled && query.trim() ? (
        <View style={styles.dropdown}>
          <Text style={styles.empty}>No matches — keep typing or pick from the list</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    zIndex: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  inputDisabled: {
    opacity: 0.55,
  },
  dropdown: {
    marginTop: 4,
    maxHeight: 220,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  list: {
    maxHeight: 220,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionPressed: {
    backgroundColor: colors.pickInactive,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 12,
    padding: 12,
  },
});
