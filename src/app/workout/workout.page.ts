import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Progress } from '../progress/models/progress.model';
import { ProgressService } from '../progress/services/progress.service';
import { Subscription } from 'rxjs';
import { IonSlides, AlertController } from '@ionic/angular';
import { WorkoutService } from './services/workout.service';
import { ExerciseRecord } from './models/workout.model';
import { ThemeService } from '../shared/services/theme.service';
import { DateService } from '../shared/services/date.service';

const BLACK_COLOR = 'var(--ion-color-dark, black)';
const RED_COLOR = 'var(--ion-color-danger, black)';

@Component({
  selector: 'app-workout',
  templateUrl: './workout.page.html',
  styleUrls: ['./workout.page.scss'],
})
export class WorkoutPage implements OnInit, OnDestroy {
  /** Top Slides */
  @ViewChild('progressSlider') progressSlider: IonSlides;
  private progressListSub: Subscription;
  progressList: Progress[];
  isLoading = false;

  /** Workout */
  workoutStarted = false;
  restTime = 120; // total rest in seconds
  restTimeString = '00:02:00';
  currentRestTime = 0;
  restPercent = 0;
  restString = '00:00:00';
  restStringColor = 'black';
  restInterval: NodeJS.Timeout;
  currentTotalTime = 0;
  totalTimeString = '00:00:00';
  totalTimeInterval: NodeJS.Timeout;

  /** Rest Time */
  private restTimeSub: Subscription;

  /** Theme */
  isDarkMode = false;

  constructor(
    private progressService: ProgressService,
    private alertController: AlertController,
    private workoutService: WorkoutService,
    private themeService: ThemeService,
    private dateService: DateService
  ) {}

  ngOnInit() {
    this.progressListSub = this.progressService.progresses.subscribe((progressList) => {
      this.progressList = progressList;
    });

    this.restTimeSub = this.workoutService.restTime.subscribe((value) => {
      this.restTime = value;
      this.restTimeString = this.dateService.secondsToString(this.restTime);
    });

    this.themeService.darkMode.subscribe((isDark) => {
      this.isDarkMode = isDark;
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.progressService.fetchProgresses().subscribe((data) => {
      this.isLoading = false;
    });

    this.workoutService.fetchRestTime();
  }

  ngOnDestroy() {
    if (this.progressListSub) {
      this.progressListSub.unsubscribe();
    }
    if (this.restTimeSub) {
      this.restTimeSub.unsubscribe();
    }
  }

  slideAction(action: 'forward' | 'back') {
    if (!this.progressSlider) {
      return;
    }
    if (action === 'forward') {
      this.progressSlider.slideNext();
    } else if (action === 'back') {
      this.progressSlider.slidePrev();
    }
  }

  onRestTimeChange(event: any) {
    const restTimeValue = event.detail.value;
    this.workoutService.saveRestTime(
      this.dateService.stringToSeconds(restTimeValue)
    );
  }

  onCircleClick() {
    /* Start the workout */
    if (!this.workoutStarted) {
      this.workoutStarted = true;

      this.updateRestTime();
      this.restInterval = setInterval(() => {
        this.updateRestTime();
      }, 1000);

      this.updateTotalTime();
      this.totalTimeInterval = setInterval(() => {
        this.updateTotalTime();
      }, 1000);
    } else {
      if (this.restInterval) {
        clearInterval(this.restInterval);
      }

      this.restString = '00:00:00';
      this.restPercent = 0;
      this.currentRestTime = 0;

      this.updateRestTime();
      this.restInterval = setInterval(() => {
        this.updateRestTime();
      }, 1000);
    }
  }

  onStopButtonClick() {
    this.alertController
      .create({
        header: 'Are you sure?',
        message: 'Do you want to end this workout?',
        buttons: [
          {
            text: 'Save',
            handler: () => this.saveWorkout(),
          },
          {
            text: 'Discard',
            handler: () => this.stopWorkout(),
          },
          {
            text: 'Cancel',
            role: 'cancel',
          },
        ],
      })
      .then((alertEl) => {
        alertEl.present();
      });
  }

  updateRestTime() {
    this.restString = this.dateService.secondsToString(this.currentRestTime);
    this.restPercent = Math.min(
      (this.currentRestTime / this.restTime) * 100,
      100
    );
    if (this.restPercent === 100) {
      this.restStringColor = RED_COLOR;
    } else {
      this.restStringColor = BLACK_COLOR;
    }
    this.currentRestTime++;
  }

  updateTotalTime() {
    this.totalTimeString = this.dateService.secondsToString(
      this.currentTotalTime
    );
    this.currentTotalTime++;
  }

  resetWorkout() {
    this.workoutStarted = false;
    this.currentRestTime = 0;
    this.restPercent = 0;
    this.restString = '00:00:00';
    this.restStringColor = BLACK_COLOR;
    if (this.restInterval) {
      clearInterval(this.restInterval);
    }
    this.currentTotalTime = 0;
    this.totalTimeString = '00:00:00';
    if (this.totalTimeInterval) {
      clearInterval(this.totalTimeInterval);
    }
  }

  stopWorkout() {
    this.resetWorkout();
  }

  saveWorkout() {
    const exercises: ExerciseRecord[] = this.progressList.map((progress) => {
      return {
        name: progress.currentExercise
          ? progress.currentExercise.name
          : progress.name,
        progressName: progress.name,
        setRep: `${progress.sets} x ${progress.reps}`,
        repType: progress.repType,
      };
    });
    let sub = this.workoutService
      .addWorkout(exercises, new Date(), this.totalTimeString)
      .subscribe(() => {
        sub.unsubscribe();
      });
    this.resetWorkout();
  }
}
