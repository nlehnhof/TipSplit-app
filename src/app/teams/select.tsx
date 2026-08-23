import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../constants/theme';
import { spacing, radius } from '../../constants/themeColors';
import { PremiumGate } from '../../components/PremiumGate';
import { loadTeams } from '../../storage/teams';
import type { Team } from '../../types/team';

export default function SelectTeamScreen() {
  return (
    <PremiumGate description="Create a team first, then load its whole roster into a split from here in one tap.">
      <SelectTeamList />
    </PremiumGate>
  );
}

function SelectTeamList() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTeams().then((t) => {
      setTeams(t);
      setLoaded(true);
    });
  }, []);

  function handleSelect(team: Team) {
    router.navigate({ pathname: '/', params: { loadTeamId: team.id } });
  }

  if (!loaded) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      {teams.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>
          You don&rsquo;t have any teams yet. Create one from Settings → Saved Teams.
        </Text>
      ) : (
        <View style={styles.list}>
          {teams.map((team) => (
            <Pressable
              key={team.id}
              onPress={() => handleSelect(team)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{team.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {team.workerIds.length} worker{team.workerIds.length === 1 ? '' : 's'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
});
