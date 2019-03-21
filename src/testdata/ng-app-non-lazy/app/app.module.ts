import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

// import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// import { DeepLearningModule } from './deep-learning/deep-learning.module';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    // AppRoutingModule,
    // DeepLearningModule,
    CommonModule,
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
