// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Главная' }} />
      <Stack.Screen name="chart" options={{ title: 'Total balance' }} />
    </Stack>
  );
}
