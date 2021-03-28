import { Component } from '@angular/core';

@Component({
  selector: 'app-clickable',
  templateUrl: './clickable.component.html',
  styleUrls: ['./clickable.component.scss'],
})
export class ClickableComponent {
  clicked = false;

  click() {
    setTimeout(() => {
        this.clicked = true;
    }, 100);
  }

  cancel() {
    this.clicked = false;
  }
}
