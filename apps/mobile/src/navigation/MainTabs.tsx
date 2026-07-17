import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Home from '../screens/home/Home';
import MyRequests from '../screens/myRequests/MyRequests';
import ChatList from '../screens/chat/ChatList';
import Profile from '../screens/profile/Profile';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, [string, string]> = {
  HomeTab: ['home', 'home-outline'],
  RequestsTab: ['document-text', 'document-text-outline'],
  ChatTab: ['chatbubbles', 'chatbubbles-outline'],
  ProfileTab: ['person', 'person-outline']
};

export default function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.sub,
        tabBarStyle: {
          height: 86, paddingTop: 6, backgroundColor: colors.card,
          borderTopWidth: 0.5, borderTopColor: colors.border
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={(focused ? ICONS[route.name][0] : ICONS[route.name][1]) as any} size={size} color={color} />
        )
      })}
    >
      <Tab.Screen name="HomeTab" component={Home} options={{ title: 'Home' }} />
      <Tab.Screen name="RequestsTab" component={MyRequests} options={{ title: t('requests.title') }} />
      <Tab.Screen name="ChatTab" component={ChatList} options={{ title: t('chat.title') }} />
      <Tab.Screen name="ProfileTab" component={Profile} options={{ title: t('profile.title') }} />
    </Tab.Navigator>
  );
}
