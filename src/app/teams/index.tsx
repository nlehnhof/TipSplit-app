import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../constants/theme';
import { spacing, radius } from '../../constants/themeColors';
import { PremiumGate } from '../../components/PremiumGate';
import { loadTeams } from '../../storage/teams';
import type { Team } from '../../types/team';

export default function TeamsScreen() {
  return (
    <PremiumGate description="Group your saved workers into teams — Friday Night Crew, Bar, Main Restaurant — and load an entire roster in one tap.">
      <TeamsList />
    </PremiumGate>
  );
}

function TeamsList() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTeams().then((t) => {
        setTeams(t);
        setLoaded(true);
      });
    }, []),
  );

  if (!loaded) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      {teams.length === 0 ? (
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
            No teams yet. Create one below to group your saved workers.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {teams.map((team) => (
            <Pressable
              key={team.id}
              onPress={() => router.push(`/teams/${team.id}`)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{team.name || 'Untitled team'}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {team.workerIds.length} worker{team.workerIds.length === 1 ? '' : 's'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => router.push('/teams/new')}
        style={[styles.addTeam, { borderColor: colors.chipBorder }]}
      >
        <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>+ New Team</Text>
      </Pressable>
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
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  addTeam: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
