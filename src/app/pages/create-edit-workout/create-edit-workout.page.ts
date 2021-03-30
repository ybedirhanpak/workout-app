import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { ModalController, NavController } from '@ionic/angular';

// Model
import { Workout } from '@models/workout.model';
import { Exercise } from '@models/exercise.model';

// Service
import { ExerciseService } from '@services/exercise.service';
import { WorkoutService } from '@services/workout.service';

// Utils
import { copyFrom } from '@utils/object.util';
import { getEmptyWorkout } from '@utils/workout.util';
import { ImageGalleryPage } from '../image-gallery/image-gallery.page';

const DEFAULT_IMAGE = '/assets/img/workout/workout-1.jpg';

@Component({
  selector: 'app-create-edit-workout',
  templateUrl: './create-edit-workout.page.html',
  styleUrls: ['./create-edit-workout.page.scss'],
})
export class CreateEditWorkoutPage implements OnInit {
  mode: 'create' | 'edit' = 'create';
  workout: Workout;
  created = false;
  customized = false;
  formGroup: FormGroup;

  constructor(
    private router: Router,
    private exerciseService: ExerciseService,
    private workoutService: WorkoutService,
    private navCtrl: NavController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    const editMode = this.router.url.includes('edit-workout');
    if (editMode) {
      // Edit Mode
      this.mode = 'edit';
      this.workoutService.workoutEdit.get().subscribe(async (workout) => {
        this.workout = workout;

        this.formGroup = new FormGroup({
          name: new FormControl(workout.name),
          duration: new FormControl(workout.duration),
          category: new FormControl(workout.category),
          equipments: new FormControl(workout.equipments),
        });

        this.created = workout.state?.created;
        this.customized = workout.state?.customized;
      });
    } else {
      // Create Mode
      this.mode = 'create';
      this.workout = getEmptyWorkout(Date.now());
      this.workout.exercises = [];
      this.formGroup = new FormGroup({
        name: new FormControl(''),
        duration: new FormControl(''),
        category: new FormControl(''),
        equipments: new FormControl(''),
      });
    }
  }

  getTitle() {
    return this.mode === 'create' ? 'Create Workout' : 'Edit Workout';
  }

  ionViewWillEnter() {
    if (this.workout) {
      this.exerciseService.editedExercise.get().subscribe((exercise) => {
        if (exercise) {
          const oldExercise = this.workout.exercises.find(
            (e) => e.id === exercise.id
          );
          if (oldExercise) {
            copyFrom(exercise, oldExercise);
          } else {
            this.workout.exercises.push(exercise);
          }
        }
      });
    }
  }

  onAddExerciseClick() {
    const navigateUrl = `${this.router.url}/exercises`;
    this.router.navigateByUrl(navigateUrl);
  }

  onEditExerciseClick(exercise: Exercise) {
    this.exerciseService.exerciseDetail.set(exercise);
    const navigateUrl = `${this.router.url}/exercise-edit`;
    this.router.navigateByUrl(navigateUrl);
  }

  async onSaveClick() {
    const workoutToSave = {
      imageUrl: DEFAULT_IMAGE,
      ...this.workout,
      ...this.formGroup.value,
    };

    if (this.mode === 'create') {
      this.workoutService.createWorkout(workoutToSave).then(() => {
        this.navCtrl.navigateBack('/home/my-library');
      });
    } else if (this.mode === 'edit') {
      if (this.customized || this.created) {
        this.workoutService.editWorkout(workoutToSave);
      } else {
        this.workoutService.customizeWorkout(workoutToSave);
      }

      this.workoutService.workoutDetail.set(workoutToSave);
      this.navCtrl.navigateBack('/workout-detail');
    }

    // Clear edited exercise
    this.exerciseService.editedExercise.set(null);

    // TODO: Display toast message
  }

  async onDeleteClick() {
    // TODO: Ask for permission before delete

    await this.workoutService.deleteWorkout(this.workout);

    this.navCtrl.navigateBack('/home/my-library');
  }

  async selectImage() {
    if (this.mode === 'edit' && !this.workout.state?.created) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: ImageGalleryPage,
      componentProps: {
        isModal: true,
      },
    });

    modal.onDidDismiss().then((event) => {
      if (event.data.image) {
        this.workout.imageUrl = event.data.image;
      }
    });

    return await modal.present();
  }

  getWorkoutImageUI() {
    return this.workout.imageUrl ?? DEFAULT_IMAGE;
  }
}
