import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import { radius, spacing } from '../constants/themeColors';
import { Button } from '../components/Button';
import { MethodSelector } from '../components/MethodSelector';
import { WorkerRow } from '../components/WorkerRow';
import { calculateTipSplit } from '../calculations/tipSplit';
import { formatCurrency } from '../calculations/money';
import { createDraftWorker } from '../types/draft';
import type { DraftWorker } from '../types/draft';
import type { CalculateTipSplitSuccess, SplitMethod, WorkerInput } from '../types/tipSplit';
import { SPLIT_METHOD_LABELS } from '../types/tipSplit';
import { createId } from '../utils/id';
import { parseDecimal, parseDollarsToCents } from '../utils/parse';
import { loadLastCalculation, saveLastCalculation } from '../storage/lastCalculation';

function toWorkerInput(worker: DraftWorker, method: SplitMethod, showAdjustment: boolean): WorkerInput {
  const input: WorkerInput = {
    workerId: worker.id,
    name: worker.name.trim() || 'Worker',
    role: worker.role || undefined,
  };

  if (method === 'hours' || method === 'weightedHours') {
    input.hours = parseDecimal(worker.hoursText) ?? 0;
    input.minutes = parseDecimal(worker.minutesText) ?? 0;
  }
  if (method === 'points') {
    input.points = parseDecimal(worker.pointsText) ?? 0;
  }
  if (method === 'weightedHours') {
    input.weight = parseDecimal(worker.weightText);
  }
  if (showAdjustment && worker.adjustmentText.trim() !== '') {
    input.adjustmentCents = parseDollarsToCents(worker.adjustmentText);
  }

  return input;
}

export default function CalculatorScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [totalTipsText, setTotalTipsText] = useState('');
  const [method, setMethod] = useState<SplitMethod>('hours');
  const [workers, setWorkers] = useState<DraftWorker[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [view, setView] = useState<'input' | 'results'>('input');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CalculateTipSplitSuccess | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    loadLastCalculation().then((stored) => {
      if (stored) {
        setTotalTipsText(stored.totalTipsCents ? (stored.totalTipsCents / 100).toString() : '');
        setMethod(stored.method);
        setWorkers(
          stored.workers.map((w) => ({
            id: w.workerId,
            name: w.name,
            role: w.role ?? '',
            hoursText: w.hours !== undefined ? String(w.hours) : '',
            minutesText: w.minutes !== undefined ? String(w.minutes) : '',
            pointsText: w.points !== undefined ? String(w.points) : '',
            weightText: w.weight !== undefined ? String(w.weight) : '',
            adjustmentText:
              w.adjustmentCents !== undefined ? (w.adjustmentCents / 100).toString() : '',
          })),
        );
      }
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const handle = setTimeout(() => {
      saveLastCalculation({
        totalTipsCents: parseDollarsToCents(totalTipsText),
        method,
        workers: workers.map((w) => toWorkerInput(w, method, showAdvanced)),
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [totalTipsText, method, workers, showAdvanced]);

  function addWorker() {
    setWorkers((prev) => [...prev, createDraftWorker(createId('worker'))]);
  }

  function updateWorker(id: string, patch: Partial<DraftWorker>) {
    setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }

  function removeWorker(id: string) {
    setWorkers((prev) => prev.filter((w) => w.id !== id));
  }

  function handleCalculate() {
    const totalTipsCents = parseDollarsToCents(totalTipsText);
    const workerInputs = workers.map((w) => toWorkerInput(w, method, showAdvanced));
    const calcResult = calculateTipSplit({ totalTipsCents, method, workers: workerInputs });

    if (!calcResult.ok) {
      setErrorMessage(calcResult.message);
      return;
    }

    setErrorMessage(null);
    setResult(calcResult);
    setView('results');
  }

  function handleDone() {
    setTotalTipsText('');
    setWorkers((prev) => prev.map((w) => ({ ...w, adjustmentText: '' })));
    setResult(null);
    setView('input');
  }

  if (view === 'results' && result) {
    return (
      <ResultsView
        result={result}
        onEdit={() => setView('input')}
        onDone={handleDone}
        insetsBottom={insets.bottom}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>TipSplit</Text>
          <Link href="/settings" accessibilityLabel="Settings">
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>Settings</Text>
          </Link>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          How much did you collect?
        </Text>
        <View style={[styles.totalInputWrap, { borderColor: colors.border }]}>
          <Text style={[styles.dollarSign, { color: colors.textMuted }]}>$</Text>
          <TextInput
            value={totalTipsText}
            onChangeText={setTotalTipsText}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={[styles.totalInput, { color: colors.text }]}
            accessibilityLabel="Total tips collected"
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Split by</Text>
        <MethodSelector value={method} onChange={setMethod} />

        <View style={styles.workersHeaderRow}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted, marginBottom: 0 }]}>
            Workers
          </Text>
          <Pressable onPress={() => setShowAdvanced((v) => !v)}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
              {showAdvanced ? 'Hide adjustments' : 'Adjustments'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.workerList}>
          {workers.map((worker) => (
            <WorkerRow
              key={worker.id}
              worker={worker}
              method={method}
              showAdjustment={showAdvanced}
              onChange={updateWorker}
              onRemove={removeWorker}
            />
          ))}
        </View>

        <Pressable onPress={addWorker} style={[styles.addWorker, { borderColor: colors.chipBorder }]}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>+ Add Worker</Text>
        </Pressable>

        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: colors.chip, borderColor: colors.danger }]}>
            <Text style={{ color: colors.danger, fontSize: 14 }}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.calculateWrap}>
          <Button onPress={handleCalculate} disabled={workers.length === 0}>
            Calculate Tips
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ResultsView({
  result,
  onEdit,
  onDone,
  insetsBottom,
}: {
  result: CalculateTipSplitSuccess;
  onEdit: () => void;
  onDone: () => void;
  insetsBottom: number;
}) {
  const colors = useThemeColors();
  const maxPercent = Math.max(...result.results.map((r) => r.sharePercent), 1);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insetsBottom + spacing.xl }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Tip Split</Text>
      <Text style={[styles.resultTotal, { color: colors.text }]}>
        {formatCurrency(result.totalTipsCents)}
      </Text>
      <Text style={{ color: colors.textMuted, marginBottom: spacing.md }}>
        Split {SPLIT_METHOD_LABELS[result.method]}
      </Text>

      <View style={styles.workerList}>
        {result.results.map((r) => (
          <View
            key={r.workerId}
            style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.resultHeaderRow}>
              <View>
                <Text style={[styles.resultName, { color: colors.text }]}>{r.name}</Text>
                {r.role ? (
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>{r.role}</Text>
                ) : null}
              </View>
              <Text style={[styles.resultAmount, { color: colors.text }]}>
                {formatCurrency(r.shareCents)}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, (r.sharePercent / maxPercent) * 100)}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              {r.sharePercent.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
        <Text style={{ color: colors.textMuted }}>Total Distributed</Text>
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          {formatCurrency(result.totalDistributedCents)}
        </Text>
      </View>

      <View style={styles.resultActions}>
        <View style={{ flex: 1 }}>
          <Button variant="ghost" onPress={onEdit}>
            Edit
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button onPress={onDone}>Done</Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  totalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  dollarSign: {
    fontSize: 36,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  totalInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    paddingVertical: spacing.sm,
  },
  workersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  workerList: {
    gap: spacing.sm,
  },
  addWorker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  calculateWrap: {
    marginTop: spacing.lg,
  },
  resultTotal: {
    fontSize: 40,
    fontWeight: '700',
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultName: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(120,113,108,0.15)',
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: radius.pill,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  resultActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
