import {Languages, LogOut, Moon} from 'lucide-react-native';
import React, {useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import {env} from '@/app/env';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {logout, refreshUser} from '@/core/auth/session';
import {useFormat} from '@/core/format/useFormat';
import {LANG_OPTIONS, type Lang} from '@/core/i18n/core';
import {useT} from '@/core/i18n/useT';
import {setLang, setThemeMode, type ThemeMode} from '@/core/prefs/prefsSlice';
import {useTheme} from '@/core/theme/useTheme';
import {AppText} from '@/shared/AppText';
import {Badge} from '@/shared/Badge';
import {Button} from '@/shared/Button';
import {Card} from '@/shared/Card';
import {ConfirmDialog} from '@/shared/ConfirmDialog';
import {InfoList} from '@/shared/InfoList';
import {PageHeader} from '@/shared/PageHeader';
import {Screen} from '@/shared/Screen';
import {Segmented} from '@/shared/Segmented';
import {version} from '../../../package.json';

// Violet gradient avatar with initials, same as the user card in the web sidebar
function Avatar({initials}: {initials: string}) {
  return (
    <View style={styles.avatar}>
      <Svg width={52} height={52} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="avatar" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#8468E8" />
            <Stop offset="1" stopColor="#5835BE" />
          </LinearGradient>
        </Defs>
        <Circle cx={26} cy={26} r={26} fill="url(#avatar)" />
      </Svg>
      <AppText variant="heading" color="onPrimary">
        {initials}
      </AppText>
    </View>
  );
}

export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.session.user);
  const themeMode = useAppSelector(state => state.prefs.themeMode);
  const {colors, tones} = useTheme();
  const {t, lang} = useT();
  const f = useFormat();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const initials =
    user?.full_name
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') ?? '?';

  // Re-reads /auth/me so role or permission changes apply without signing in again
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(refreshUser());
    } finally {
      setRefreshing(false);
    }
  };

  const permissions = user?.permissions.length ? (
    <View style={styles.badges}>
      {user.permissions.map(permission => (
        <Badge key={permission} label={permission} tone="violet" dot={false} />
      ))}
    </View>
  ) : (
    t('profile.readOnly')
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        <PageHeader title={t('profile.title')} />
        <View style={styles.body}>
          <Card>
            <View style={styles.userRow}>
              <Avatar initials={initials} />
              <View style={styles.flex}>
                <AppText variant="heading">{user?.full_name}</AppText>
                <AppText color="ink3">{user?.email}</AppText>
              </View>
            </View>
            <View style={[styles.divider, {borderTopColor: colors.line}]}>
              <InfoList
                items={[
                  [
                    t('profile.role'),
                    user ? <Badge label={user.role_name} tone="brand" /> : '-',
                  ],
                  [t('profile.lastLogin'), f.dateTime(user?.last_login_at)],
                  [t('profile.permissions'), permissions],
                ]}
              />
            </View>
          </Card>

          <Card title={t('profile.appearance')}>
            <View style={styles.settings}>
              <View style={styles.setting}>
                <View style={styles.settingLabel}>
                  <Languages size={18} color={colors.ink2} />
                  <AppText weight="medium" color="ink2">
                    {t('common.language')}
                  </AppText>
                </View>
                <Segmented<Lang>
                  accessibilityLabel={t('common.language')}
                  value={lang}
                  onChange={value => dispatch(setLang(value))}
                  options={LANG_OPTIONS}
                />
              </View>
              <View style={styles.setting}>
                <View style={styles.settingLabel}>
                  <Moon size={18} color={colors.ink2} />
                  <AppText weight="medium" color="ink2">
                    {t('profile.theme')}
                  </AppText>
                </View>
                <Segmented<ThemeMode>
                  accessibilityLabel={t('profile.theme')}
                  value={themeMode}
                  onChange={value => dispatch(setThemeMode(value))}
                  options={[
                    {value: 'system', label: t('profile.theme.system')},
                    {value: 'light', label: t('profile.theme.light')},
                    {value: 'dark', label: t('profile.theme.dark')},
                  ]}
                />
              </View>
            </View>
          </Card>

          <Card title={t('profile.about')}>
            <InfoList
              items={[
                [t('profile.version'), version],
                [t('profile.server'), env.apiBaseUrl],
              ]}
            />
          </Card>

          <Button
            label={t('profile.logout')}
            variant="secondary"
            icon={<LogOut size={18} color={tones.danger.fg} />}
            onPress={() => setLogoutOpen(true)}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={logoutOpen}
        title={t('profile.logoutConfirm')}
        description={user?.email ?? ''}
        confirmLabel={t('profile.logout')}
        confirmVariant="danger"
        onConfirm={() => {
          setLogoutOpen(false);
          dispatch(logout());
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {paddingBottom: 32},
  body: {paddingHorizontal: 16, gap: 14},
  userRow: {flexDirection: 'row', alignItems: 'center', gap: 14},
  avatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {borderTopWidth: 1, marginTop: 16, paddingTop: 16},
  badges: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  settings: {gap: 16},
  setting: {gap: 8},
  settingLabel: {flexDirection: 'row', alignItems: 'center', gap: 8},
});
