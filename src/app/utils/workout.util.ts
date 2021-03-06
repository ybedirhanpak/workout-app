import { Workout } from '@models/workout.model';

export const getEmptyWorkout = (id: number) => {
  return {
    id: id,
    exercises: [],
  } as Workout;
};
