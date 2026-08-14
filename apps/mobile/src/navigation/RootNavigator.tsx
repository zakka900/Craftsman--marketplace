import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store';
import { RootStackParamList } from './types';
import Onboarding from '../screens/onboarding/Onboarding';
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import OtpVerification from '../screens/auth/OtpVerification';
import ForgotPassword from '../screens/auth/ForgotPassword';
import BankVerification from '../screens/bank/BankVerification';
import MainTabs from './MainTabs';
import CreateRequest from '../screens/request/CreateRequest';
import RequestDetail from '../screens/request/RequestDetail';
import MoreInfoThread from '../screens/request/MoreInfoThread';
import ArtisanProfile from '../screens/artisan/ArtisanProfile';
import ContractSign from '../screens/deal/ContractSign';
import Payment from '../screens/deal/Payment';
import JobTracking from '../screens/job/JobTracking';
import DisputeWizard from '../screens/job/DisputeWizard';
import Review from '../screens/job/Review';
import ChatRoom from '../screens/chat/ChatRoom';
import Notifications from '../screens/notifications/Notifications';
import PersonalData from '../screens/profile/PersonalData';
import NotificationPreferences from '../screens/profile/NotificationPreferences';
import PrivacyPolicy from '../screens/profile/PrivacyPolicy';
import InviteFriend from '../screens/profile/InviteFriend';
import PaymentMethods from '../screens/profile/PaymentMethods';
import AccountSettings from '../screens/profile/AccountSettings';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { onboarded, user, bankStatus } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          {!onboarded && <Stack.Screen name="Onboarding" component={Onboarding} />}
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Otp" component={OtpVerification} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </>
      ) : bankStatus === 'none' ? (
        // Second screen after first login: bank verification.
        // Different name from 'BankVerification' (used in the main branch):
        // this way, when bankStatus changes, the navigator switches straight to MainTabs.
        <Stack.Screen name="BankOnboarding" component={BankVerification} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="CreateRequest" component={CreateRequest} options={{ presentation: 'modal' }} />
          <Stack.Screen name="RequestDetail" component={RequestDetail} />
          <Stack.Screen name="MoreInfo" component={MoreInfoThread} />
          <Stack.Screen name="ArtisanProfile" component={ArtisanProfile} />
          <Stack.Screen name="Contract" component={ContractSign} />
          <Stack.Screen name="Payment" component={Payment} />
          <Stack.Screen name="JobTracking" component={JobTracking} />
          <Stack.Screen name="Dispute" component={DisputeWizard} />
          <Stack.Screen name="Review" component={Review} />
          <Stack.Screen name="ChatRoom" component={ChatRoom} />
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="BankVerification" component={BankVerification} />
          <Stack.Screen name="PersonalData" component={PersonalData} />
          <Stack.Screen name="NotificationPreferences" component={NotificationPreferences} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
          <Stack.Screen name="InviteFriend" component={InviteFriend} />
          <Stack.Screen name="PaymentMethods" component={PaymentMethods} />
          <Stack.Screen name="AccountSettings" component={AccountSettings} />
          {/* Also reused while logged in, for "Change password" in Account settings */}
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </>
      )}
    </Stack.Navigator>
  );
}
