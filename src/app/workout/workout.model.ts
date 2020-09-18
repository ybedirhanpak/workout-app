export interface ExerciseRecord {
  name: string;
  progressName: string;
  setRep: string;
}

export class Workout {
  constructor(
    public id: number,
    public exercises: ExerciseRecord[],
    public date: Date,
    public totalTime: string
  ) {}
}