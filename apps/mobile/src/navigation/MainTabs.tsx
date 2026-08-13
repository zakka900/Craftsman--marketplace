import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Home from '../screens/home/Home';
import MyRequests from '../screens/myRequests/MyRequests';
import ChatList from '../screens/chat/ChatList';
import Profile from '../screens/profile/Profile';
import { colors, radius, shadowStrong } from '../theme';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, [string, string]> = {
  HomeTab: ['home', 'home-outline'],
  RequestsTab: ['document-text', 'document-text-outline'],
  ChatTab: ['chatbubbles', 'chatbubbles-outline'],
  ProfileTab: ['person', 'person-outline']
};

/** Icona tab: quando attiva è racchiusa in una pastiglia circolare azzurra. */
function TabIcon({ route, focused }: { route: string; focused: boolean }) {
  const name = (focused ? ICONS[route][0] : ICONS[route][1]) as any;
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={24} color={focused ? '#fff' : colors.sub} />
    </View>
  );
}

export default function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.sub,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
        tabBarIcon: ({ focused }) => <TabIcon route={route.name} focused={focused} />
      })}
    >
      <Tab.Screen name="HomeTab" component={Home} options={{ title: 'Home' }} />
      <Tab.Screen name="RequestsTab" component={MyRequests} options={{ title: t('requests.title') }} />
      <Tab.Screen name="ChatTab" component={ChatList} options={{ title: t('chat.title') }} />
      <Tab.Screen name="ProfileTab" component={Profile} options={{ title: t('profile.title') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Tab bar flottante arrotondata, staccata dai bordi
  bar: {
    position: 'absolute',
    left: 18, right: 18, bottom: 22,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderTopWidth: 0,
    paddingHorizontal: 10,
    ...shadowStrong,
    shadowOpacity: 0.16
  },
  item: { height: 68 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center'
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
    ...shadowStrong
  }
});
