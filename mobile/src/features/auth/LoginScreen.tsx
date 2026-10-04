import React, {useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {env} from '@/app/env';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {errorMessage} from '@/core/api/errorMessage';
import {ApiError} from '@/core/api/http';
import {login} from '@/core/auth/session';
import {noticeCleared} from '@/core/auth/sessionSlice';
import {LANG_OPTIONS, type Lang, type TKey} from '@/core/i18n/core';
import {useT} from '@/core/i18n/useT';
import {setLang} from '@/core/prefs/prefsSlice';
import type {Tone} from '@/core/theme/colors';
import {font} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';
import {AppText} from '@/shared/AppText';
import {Badge} from '@/shared/Badge';
import {Banner} from '@/shared/Banner';
import {Button} from '@/shared/Button';
import {Card} from '@/shared/Card';
import {Logo} from '@/shared/Logo';
import {Segmented} from '@/shared/Segmented';
import {TextField} from '@/shared/TextField';

// Dev accounts seeded by db/init/02_seed_dev.sql (same as the web app).
// Only shown when env.showDemoAccounts is true, i.e. never in production builds.
const DEMO_PASSWORD = 'Password123!';
const DEMO_ACCOUNTS: {
  email: string;
  role: TKey;
  access: TKey;
  tone: Tone;
}[] = [
  {
    email: 'admin@example.com',
    role: 'login.role.admin',
    access: 'login.access.admin',
    tone: 'violet',
  },
  {
    email: 'staff@example.com',
    role: 'login.role.staff',
    access: 'login.access.staff',
    tone: 'info',
  },
];

export function LoginScreen() {
  const dispatch = useAppDispatch();
  const notice = useAppSelector(state => state.session.notice);
  const {colors} = useTheme();
  const {t, lang} = useT();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  // Hero size for the SVG gradient background (percentages are unreliable inside absoluteFill)
  const [hero, setHero] = useState({width: 0, height: 0});

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    setFormError(null);
  };

  const submit = async () => {
    if (submitting) {
      return;
    }
    const errors = {
      email: email.trim() ? undefined : t('login.emailRequired'),
      password: password ? undefined : t('login.passwordRequired'),
    };
    setFieldErrors(errors);
    if (errors.email || errors.password) {
      return;
    }

    setSubmitting(true);
    setFormError(null);
    dispatch(noticeCleared());
    try {
      await dispatch(login(email, password));
    } catch (err) {
      setFormError(errorMessage(err instanceof ApiError ? err.data : err, t));
      setSubmitting(false);
    }
  };

  const banner =
    formError ??
    (notice === 'expired'
      ? t('session.expired')
      : notice === 'inactive'
      ? t('session.inactive')
      : null);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, {backgroundColor: colors.canvas}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: 24 + insets.bottom},
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero, like the left panel of the web login page */}
        <View
          style={[styles.hero, {paddingTop: insets.top + 16}]}
          onLayout={e =>
            setHero({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }
        >
          {hero.width > 0 ? (
            <Svg
              width={hero.width}
              height={hero.height}
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#2A1A5E" />
                  <Stop offset="0.55" stopColor="#4B2FB0" />
                  <Stop offset="1" stopColor="#6E4FE0" />
                </LinearGradient>
              </Defs>
              <Rect width={hero.width} height={hero.height} fill="url(#hero)" />
            </Svg>
          ) : null}
          <View style={styles.heroTop}>
            <Logo onDark />
            <View style={styles.lang}>
              <Segmented<Lang>
                accessibilityLabel={t('common.language')}
                value={lang}
                onChange={value => dispatch(setLang(value))}
                options={LANG_OPTIONS}
              />
            </View>
          </View>
          <AppText variant="display" color="onPrimary" style={styles.heroTitle}>
            {t('login.heroTitle')}
          </AppText>
          <AppText color="onPrimary" style={styles.heroText}>
            {t('login.heroText')}
          </AppText>
        </View>

        <View style={[styles.panel, {backgroundColor: colors.canvas}]}>
          <View>
            <AppText variant="display">{t('login.title')}</AppText>
            <AppText color="ink3" style={styles.subtitle}>
              {t('login.subtitle')}
            </AppText>
          </View>

          {banner ? <Banner message={banner} tone="danger" /> : null}

          <TextField
            label={t('login.email')}
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            placeholder={t('login.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!submitting}
          />
          <TextField
            ref={passwordRef}
            label={t('login.password')}
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            editable={!submitting}
          />
          <Button
            label={t('login.submit')}
            onPress={submit}
            loading={submitting}
          />

          {env.showDemoAccounts ? (
            <View style={styles.demo}>
              <View style={styles.dividerRow}>
                <View style={[styles.rule, {backgroundColor: colors.line}]} />
                <AppText variant="caption" color="ink3" weight="semibold">
                  {t('login.demoTitle')}
                </AppText>
                <View style={[styles.rule, {backgroundColor: colors.line}]} />
              </View>
              <View style={styles.demoGrid}>
                {DEMO_ACCOUNTS.map(acc => (
                  <Card
                    key={acc.email}
                    style={styles.demoCard}
                    onPress={() => fillDemo(acc.email)}
                    accessibilityLabel={`${t(acc.role)}: ${acc.email}`}
                  >
                    <Badge label={t(acc.role)} tone={acc.tone} dot={false} />
                    <AppText
                      weight="semibold"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.demoEmail}
                    >
                      {acc.email}
                    </AppText>
                    <AppText
                      variant="caption"
                      color="ink2"
                      style={styles.demoAccess}
                    >
                      {t(acc.access)}
                    </AppText>
                  </Card>
                ))}
              </View>
              <Pressable
                onPress={() => setPassword(DEMO_PASSWORD)}
                style={styles.demoPassword}
              >
                <AppText variant="caption" color="ink3">
                  {t('login.demoPassword')}
                </AppText>
                <View style={[styles.code, {backgroundColor: colors.surface3}]}>
                  <AppText
                    variant="caption"
                    color="ink2"
                    style={{
                      fontFamily: Platform.select({
                        ios: 'Menlo',
                        default: 'monospace',
                      }),
                    }}
                  >
                    {DEMO_PASSWORD}
                  </AppText>
                </View>
              </Pressable>
              <AppText variant="caption" color="ink3" style={styles.server}>
                {env.apiBaseUrl}
              </AppText>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  scroll: {flexGrow: 1},
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    overflow: 'hidden',
    backgroundColor: '#4B2FB0',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  lang: {width: 104},
  heroTitle: {...font('bold'), fontSize: 28, lineHeight: 34},
  heroText: {marginTop: 10, opacity: 0.8},
  panel: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 16,
  },
  subtitle: {marginTop: 4},
  demo: {gap: 12, marginTop: 8},
  dividerRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  rule: {flex: 1, height: 1},
  demoGrid: {flexDirection: 'row', gap: 10},
  demoCard: {flex: 1, padding: 14},
  demoEmail: {marginTop: 8},
  demoAccess: {marginTop: 6},
  demoPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  code: {borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2},
  server: {textAlign: 'center'},
});
