import { Component } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
})
export class ExplorePage {
  constructor(private router: Router) {}

  onWorkoutsClick() {
    this.router.navigateByUrl('/home/explore/workouts');
  }

  onExercisesClick() {
    this.router.navigateByUrl('/home/explore/exercises');
  }
}
