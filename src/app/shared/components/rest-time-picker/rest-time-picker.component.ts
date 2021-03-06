import { Component, OnInit } from '@angular/core';

// Service
import { TrainingService } from '@services/training.service';
import { DateService } from '@services/date.service';

@Component({
  selector: 'app-rest-time-picker',
  templateUrl: './rest-time-picker.component.html',
  styleUrls: ['./rest-time-picker.component.scss'],
})
export class RestTimePickerComponent implements OnInit {
  restTime = 0;
  restTimeString = '00:00:00';

  constructor(
    private trainingService: TrainingService,
    private dateService: DateService
  ) {}

  ngOnInit() {
    this.trainingService.restTime.value.subscribe((value) => {
      this.restTime = value;
      this.restTimeString = this.dateService.secondsToString(
        this.restTime,
        true
      );
    });
  }

  ionViewWillEnter() {
    this.trainingService.restTime.fetch();
  }

  /**
   * Saves rest time value with training service
   * @param event change of rest time
   */
  onRestTimeChange(event: any) {
    const restTimeValue = event.detail.value;
    this.trainingService.restTime
      .set(this.dateService.stringToSeconds(restTimeValue))
      .catch(() => {
        // TODO: Display error message
      });
  }
}
