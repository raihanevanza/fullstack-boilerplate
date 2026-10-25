import {
  Alert,
  Badge,
  Button,
  Segmented,
  TextField,
  useTheme,
  type BadgeTone,
  type TextFieldRef,
} from '@rupa-ui/react-native';
import React, {useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
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
import {AppText} from '@/shared/AppText';
import {Logo} from '@/shared/Logo';
import {PressableCard} from '@/shared/PressableCard';

// Dev accounts seeded by db/init/02_seed_dev.sql (same as the web app).
// Only shown when env.showDemoAccounts is true, i.e. never in production builds.
const DEMO_PASSWORD = 'Password123!';
const DEMO_ACCOUNTS: {
  email: string;
  role: TKey;
  access: TKey;
  tone: BadgeTone;
}[] = [
  {
    email: 'admin@example.com',
    role: 'login.role.admin',
    access: 'login.access.admin',
    tone: 'accent',
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
  const {palette} = useTheme();
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
  const passwordRef = useRef<TextFieldRef>(null);
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
      style={[styles.flex, {backgroundColor: palette.canvas}]}
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
          style={[
            styles.hero,
            {paddingTop: insets.top + 16, backgroundColor: palette.primary},
          ]}
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
                  <Stop offset="0" stopColor={palette.primaryHover} />
                  <Stop offset="1" stopColor={palette.primary} />
                </LinearGradient>
              </Defs>
              <Rect width={hero.width} height={hero.height} fill="url(#hero)" />
            </Svg>
          ) : null}
          <View style={styles.heroTop}>
            <Logo onDark />
            <View style={styles.lang}>
              <Segmented<Lang>
                label={t('common.language')}
                size="sm"
                block
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

        <View style={[styles.panel, {backgroundColor: palette.canvas}]}>
          <View>
            <AppText variant="display">{t('login.title')}</AppText>
            <AppText color="ink3" style={styles.subtitle}>
              {t('login.subtitle')}
            </AppText>
          </View>

          {banner ? (
            <Alert tone="danger" live>
              {banner}
            </Alert>
          ) : null}

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
            disabled={submitting}
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
            disabled={submitting}
          />
          <Button variant="primary" block onPress={submit} loading={submitting}>
            {t('login.submit')}
          </Button>

          {env.showDemoAccounts ? (
            <View style={styles.demo}>
              <View style={styles.dividerRow}>
                <View style={[styles.rule, {backgroundColor: palette.line}]} />
                <AppText variant="caption" color="ink3" weight="semibold">
                  {t('login.demoTitle')}
                </AppText>
                <View style={[styles.rule, {backgroundColor: palette.line}]} />
              </View>
              <View style={styles.demoGrid}>
                {DEMO_ACCOUNTS.map(acc => (
                  <PressableCard
                    key={acc.email}
                    padding="sm"
                    style={styles.demoCard}
                    onPress={() => fillDemo(acc.email)}
                    accessibilityLabel={`${t(acc.role)}: ${acc.email}`}
                  >
                    <View style={styles.demoBody}>
                      <Badge tone={acc.tone} size="sm" style={styles.demoBadge}>
                        {t(acc.role)}
                      </Badge>
                      <AppText
                        weight="semibold"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {acc.email}
                      </AppText>
                      <AppText variant="caption" color="ink2">
                        {t(acc.access)}
                      </AppText>
                    </View>
                  </PressableCard>
                ))}
              </View>
              <Pressable
                onPress={() => setPassword(DEMO_PASSWORD)}
                style={styles.demoPassword}
              >
                <AppText variant="caption" color="ink3">
                  {t('login.demoPassword')}
                </AppText>
                <View
                  style={[styles.code, {backgroundColor: palette.surface3}]}
                >
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
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  lang: {width: 112},
  heroTitle: {fontSize: 28, lineHeight: 34},
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
  demoCard: {flex: 1},
  demoBody: {gap: 6},
  demoBadge: {alignSelf: 'flex-start', marginBottom: 2},
  demoPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  code: {borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2},
  server: {textAlign: 'center'},
});
