import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {House, Package, UserRound} from 'lucide-react-native';
import React from 'react';
import {useT} from '@/core/i18n/useT';
import {font} from '@/core/theme/typography';
import {useTheme} from '@/core/theme/useTheme';
import {HomeScreen} from '@/features/home/HomeScreen';
import {ProductListScreen} from '@/features/products/ProductListScreen';
import {ProfileScreen} from '@/features/profile/ProfileScreen';
import type {MainTabParamList} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconProps = {color: string; size: number};
const icon = (Icon: typeof House) => (props: IconProps) => <Icon {...props} />;

const HomeIcon = icon(House);
const ProductsIcon = icon(Package);
const ProfileIcon = icon(UserRound);

export function MainTabs() {
  const {colors} = useTheme();
  const {t} = useT();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: {...font('semibold'), fontSize: 11},
        sceneStyle: {backgroundColor: colors.canvas},
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: t('nav.home'), tabBarIcon: HomeIcon}}
      />
      <Tab.Screen
        name="Products"
        component={ProductListScreen}
        options={{title: t('nav.products'), tabBarIcon: ProductsIcon}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: t('nav.profile'), tabBarIcon: ProfileIcon}}
      />
    </Tab.Navigator>
  );
}
