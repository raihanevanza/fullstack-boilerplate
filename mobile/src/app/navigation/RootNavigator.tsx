import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTheme} from '@rupa-ui/react-native';
import React from 'react';
import {useAppSelector} from '@/app/hooks';
import {LoginScreen} from '@/features/auth/LoginScreen';
import {ProductDetailScreen} from '@/features/products/ProductDetailScreen';
import {ProductFormScreen} from '@/features/products/ProductFormScreen';
import {MainTabs} from './MainTabs';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const signedIn = useAppSelector(state => state.session.status === 'signedIn');
  const {palette} = useTheme();

  return (
    // Every screen draws its own title (PageHeader) instead of the native header
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: palette.canvas},
      }}
    >
      {signedIn ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="ProductForm" component={ProductFormScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
