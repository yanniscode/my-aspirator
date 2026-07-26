import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MainComponent } from "./main-component/main.component";

@Component({
  selector: 'app-root',
  standalone: true, // Composant autonome
  imports: [MainComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.css',
})
export class AppComponent {
  public title = "my-aspirator-robot";
}
