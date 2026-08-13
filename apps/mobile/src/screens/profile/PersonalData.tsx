import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COUNTRIES } from '@artisan/shared';
import Screen from '../../components/ui/Screen';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { updateProfile } from '../../services/api';
import { useAuthStore } from '../../store';
import { colors, g } from '../../theme';

/** Modifica nome/cognome/telefono — PATCH /users/me. Email e paese sono di sola lettura. */
export default function PersonalData() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  if (!user) return null;

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const country = COUNTRIES.find((c) => c.code === user.country);
  const dirty = firstName !== user.firstName || lastName !== user.lastName || phone !== user.phone;

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen pad={false}>
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={g.h2}>{t('profile.personalData')}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input label={t('auth.firstName')} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label={t('auth.lastName')} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
          </View>
        </View>

        <Input label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Input label={t('auth.email')} value={user.email} editable={false} style={{ color: colors.sub }} />

        <Input label={t('personalData.country')} value={country ? `${country.flag}  ${country.name}` : user.country}
          editable={false} style={{ color: colors.sub }} />
        <Text style={[g.small, { marginTop: -8, marginBottom: 14 }]}>{t('personalData.countryNote')}</Text>

        <Button title={saved ? t('personalData.saved') : t('common.save')} onPress={save}
          loading={saving} disabled={!dirty} style={{ marginTop: 8 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border
  }
});
