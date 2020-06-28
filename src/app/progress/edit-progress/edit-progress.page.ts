import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  ModalController,
  LoadingController,
  NavController,
  AlertController,
} from '@ionic/angular';
import { ProgressService } from '../progress.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AddExerciseComponent } from '../add-exercise/add-exercise.component';
import { ActivatedRoute } from '@angular/router';
import { Progress } from '../progress.model';
import { Subscription } from 'rxjs';
import { Exercise } from '../exercise.model';

@Component({
  selector: 'app-edit-progress',
  templateUrl: './edit-progress.page.html',
  styleUrls: ['./edit-progress.page.scss'],
})
export class EditProgressPage implements OnInit, OnDestroy {
  paramSub: Subscription;
  progress: Progress;
  progressSub: Subscription;
  isLoading = false;
  form: FormGroup;
  repType: string = 'reps';
  exercises: Exercise[] = [];
  reorder = false;
  constructor(
    private modalController: ModalController,
    private loadingController: LoadingController,
    private progressService: ProgressService,
    private navController: NavController,
    private route: ActivatedRoute,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.paramSub = this.route.paramMap.subscribe((paramMap) => {
      if (!paramMap.has('progressId')) {
        this.navController.navigateBack('/home/progress');
        return;
      }
      this.isLoading = true;
      this.progressSub = this.progressService
        .getProgress(parseInt(paramMap.get('progressId')))
        .subscribe(
          (progress) => {
            this.progress = progress;

            if (!this.progress) {
              this.showErrorModal();
              return;
            }
            const { name, sets, reps, repType, exercises } = this.progress;

            this.exercises = exercises;
            this.repType = repType;

            this.form = new FormGroup({
              name: new FormControl(name, {
                updateOn: 'blur',
                validators: [Validators.required],
              }),
              sets: new FormControl(sets, {
                updateOn: 'blur',
                validators: [Validators.required, Validators.min(1)],
              }),
              reps: new FormControl(reps, {
                updateOn: 'blur',
                validators: [Validators.required, Validators.min(1)],
              }),
            });

            this.isLoading = false;
          },
          (error) => {
            this.showErrorModal();
            this.isLoading = false;
          }
        );
    });
  }

  ngOnDestroy() {
    this.progressSub.unsubscribe();
    this.paramSub.unsubscribe();
  }

  addExercise() {
    this.modalController
      .create({
        component: AddExerciseComponent,
      })
      .then((modalEl) => {
        modalEl.present();
        return modalEl.onDidDismiss();
      })
      .then((resultData) => {
        if (resultData.role === 'confirm') {
          const exerciseName = resultData.data.name;
          const index = this.exercises.findIndex(
            (e) => e.name === exerciseName
          );
          if (index < 0) {
            const selected = this.exercises.length === 0;
            this.exercises.push(new Exercise(exerciseName, selected));
          }
        }
      });
  }

  removeExercise(exercise: Exercise) {
    const ex = this.exercises.find((e) => e.name == exercise.name);
    if (ex) {
      this.exercises = this.exercises.filter((e) => e.name !== ex.name);
      if (ex.selected && this.exercises.length > 0) {
        this.exercises[0].selected = true;
      }
    }
  }

  reorderExercises(event: any) {
    const itemMove = this.exercises.splice(event.detail.from, 1)[0];
    this.exercises.splice(event.detail.to, 0, itemMove);
    event.detail.complete();
  }

  onExerciseClick(exercise: Exercise) {
    this.exercises.forEach((ex) => {
      if (ex.name === exercise.name) {
        ex.selected = true;
      } else {
        ex.selected = false;
      }
    });
  }

  changeRepType() {
    if (this.repType == 'reps') {
      this.repType = 'sec';
    } else {
      this.repType = 'reps';
    }
  }

  updateProgress() {
    this.loadingController
      .create({
        message: 'Updating...',
      })
      .then((loadingEl) => {
        loadingEl.present();

        const { name, sets, reps } = this.form.value;
        this.progressService
          .updateProgress(
            this.progress.id,
            name,
            sets,
            reps,
            this.repType,
            this.exercises
          )
          .subscribe((data) => {
            loadingEl.dismiss();
            this.form.reset();
            this.navController.navigateBack('/home/progress');
          });
      });
  }

  showErrorModal() {
    this.alertController
      .create({
        header: 'Error occured.',
        message: 'Please try again.',
        buttons: [
          {
            text: 'Okay',
            handler: () => this.navController.navigateBack('/home/progress'),
          },
        ],
      })
      .then((alertEl) => {
        alertEl.present();
      });
  }
}
