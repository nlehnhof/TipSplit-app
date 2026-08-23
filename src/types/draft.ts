export type DraftWorker = {
  id: string;
  name: string;
  role: string;
  hoursText: string;
  minutesText: string;
  pointsText: string;
  weightText: string;
  adjustmentText: string;
};

export function createDraftWorker(id: string): DraftWorker {
  return {
    id,
    name: '',
    role: '',
    hoursText: '',
    minutesText: '',
    pointsText: '',
    weightText: '',
    adjustmentText: '',
  };
}
